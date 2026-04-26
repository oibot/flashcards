import {
  isCardVariant,
  resolveCardContent,
  type VisibleCardSide,
} from "@/domain/card"
import {
  createTtsCacheKey,
  extractNormalizedTtsTextFromHtml,
  extractTtsSourceTextFromHtml,
  getCardSetTtsLocale,
  isSupportedTtsLocale,
  resolveCardContentSide,
  type TtsResolveReadyResponse,
  type TtsResolveResponse,
} from "@/domain/card-audio"
import {
  generateElevenLabsAudio,
  getConfiguredTtsLocales,
  getTtsAudioContentType,
  resolveTtsConfig,
} from "@/server/tts/elevenlabs"
import { TtsResolveError } from "@/server/tts/errors"
import {
  getReadyFileUrl,
  getSelectedTtsAsset,
  loadCardForTts,
  persistGeneratedTtsAsset,
  querySharedTtsAsset,
  type TtsAssetRecord,
  updateCardSetTtsReference,
  uploadGeneratedAudio,
} from "@/server/tts/instant-tts-assets"
import {
  logTtsError,
  logTtsInfo,
  logTtsWarn,
  summarizeCacheKey,
} from "@/server/tts/log"
type ResolveTtsInput = {
  userId: string
  cardId: string
  visibleSide: VisibleCardSide
}

function toReadyResponse(
  asset: TtsAssetRecord,
  contentSide: TtsResolveReadyResponse["contentSide"],
  cacheHit: boolean,
): TtsResolveReadyResponse {
  const fileUrl = getReadyFileUrl(asset)

  if (!fileUrl) {
    throw new TtsResolveError("Failed to resolve generated audio.", 500)
  }

  return {
    status: "ready",
    assetId: asset.id,
    fileUrl,
    contentSide,
    cacheHit,
  }
}

export async function resolveTts({
  userId,
  cardId,
  visibleSide,
}: ResolveTtsInput): Promise<TtsResolveResponse> {
  logTtsInfo("Resolving review card audio", {
    userId,
    cardId,
    visibleSide,
  })

  const card = await loadCardForTts(userId, cardId)

  if (!card?.cardSet) {
    throw new TtsResolveError("Card not found.", 404)
  }

  const cardSet = card.cardSet

  if (!isCardVariant(card.variant)) {
    throw new TtsResolveError("Card variant is invalid.", 500)
  }

  if (
    typeof cardSet.sideAHtml !== "string" ||
    typeof cardSet.sideBHtml !== "string"
  ) {
    throw new TtsResolveError("Card content is invalid.", 500)
  }

  const visibleContent = resolveCardContent(
    {
      sideAHtml: cardSet.sideAHtml,
      sideBHtml: cardSet.sideBHtml,
    },
    card.variant,
  )
  const contentSide = resolveCardContentSide(card.variant, visibleSide)
  const selectedTtsAsset = getSelectedTtsAsset(cardSet, contentSide)
  const selectedTtsAssetFileUrl = getReadyFileUrl(selectedTtsAsset)

  if (selectedTtsAsset && selectedTtsAssetFileUrl) {
    logTtsInfo("Resolved audio from cardSet sound association", {
      userId,
      cardId,
      visibleSide,
      contentSide,
      assetId: selectedTtsAsset.id,
    })

    return toReadyResponse(selectedTtsAsset, contentSide, true)
  }

  const html =
    visibleSide === "front" ? visibleContent.frontHtml : visibleContent.backHtml
  const sourceText = extractTtsSourceTextFromHtml(html)
  const normalizedText = extractNormalizedTtsTextFromHtml(html)

  if (normalizedText.length === 0) {
    logTtsWarn("Review card side has no speakable text", {
      userId,
      cardId,
      visibleSide,
      contentSide,
    })
    throw new TtsResolveError("Card side does not contain speakable text.", 422)
  }

  const configuredLocales = getConfiguredTtsLocales()

  if (configuredLocales.length === 0) {
    throw new TtsResolveError("No TTS voice profiles configured.", 500)
  }

  const selectedLocale = getCardSetTtsLocale(
    {
      sideATtsLocale: isSupportedTtsLocale(cardSet.sideATtsLocale)
        ? cardSet.sideATtsLocale
        : undefined,
      sideBTtsLocale: isSupportedTtsLocale(cardSet.sideBTtsLocale)
        ? cardSet.sideBTtsLocale
        : undefined,
    },
    contentSide,
  )

  if (!selectedLocale) {
    logTtsInfo("TTS locale missing for review card side", {
      userId,
      cardId,
      visibleSide,
      contentSide,
      supportedLocaleCount: configuredLocales.length,
    })

    return {
      status: "needs-locale",
      contentSide,
      supportedLocales: configuredLocales,
    }
  }

  const ttsConfig = resolveTtsConfig(selectedLocale)
  const cacheKey = await createTtsCacheKey(normalizedText, ttsConfig)

  logTtsInfo("Computed TTS cache key", {
    userId,
    cardId,
    visibleSide,
    contentSide,
    locale: selectedLocale,
    cacheKey: summarizeCacheKey(cacheKey),
    normalizedTextLength: normalizedText.length,
    selectedAssetId: selectedTtsAsset?.id,
  })

  if (selectedTtsAsset?.cacheKey === cacheKey) {
    const fileUrl = getReadyFileUrl(selectedTtsAsset)

    if (fileUrl) {
      logTtsInfo("Resolved audio from cardSet cache reference", {
        userId,
        cardId,
        visibleSide,
        contentSide,
        assetId: selectedTtsAsset.id,
        cacheKey: summarizeCacheKey(cacheKey),
      })
      return {
        status: "ready",
        assetId: selectedTtsAsset.id,
        fileUrl,
        contentSide,
        cacheHit: true,
      }
    }
  }

  const sharedAsset = await querySharedTtsAsset(cacheKey)
  const sharedAssetFileUrl = getReadyFileUrl(sharedAsset)

  if (sharedAsset && sharedAssetFileUrl) {
    logTtsInfo("Resolved audio from shared TTS cache", {
      userId,
      cardId,
      visibleSide,
      contentSide,
      assetId: sharedAsset.id,
      cacheKey: summarizeCacheKey(cacheKey),
    })
    await updateCardSetTtsReference(cardSet.id, contentSide, sharedAsset.id)

    return toReadyResponse(sharedAsset, contentSide, true)
  }

  logTtsInfo("Cache miss, generating audio with ElevenLabs", {
    userId,
    cardId,
    visibleSide,
    contentSide,
    cacheKey: summarizeCacheKey(cacheKey),
  })
  const audioBytes = await generateElevenLabsAudio(normalizedText, ttsConfig)
  const uploadedFile = await uploadGeneratedAudio(
    cacheKey,
    audioBytes,
    getTtsAudioContentType(ttsConfig.outputFormat),
  )

  logTtsInfo("Uploaded generated TTS audio to Instant storage", {
    userId,
    cardId,
    visibleSide,
    contentSide,
    cacheKey: summarizeCacheKey(cacheKey),
    fileId: uploadedFile.data.id,
    byteLength: audioBytes.byteLength,
  })

  try {
    await persistGeneratedTtsAsset({
      existingAsset: sharedAsset,
      cacheKey,
      sourceText,
      normalizedText,
      config: ttsConfig,
      fileId: uploadedFile.data.id,
    })
  } catch (error) {
    logTtsWarn("Persisting generated TTS asset raced with another request", {
      userId,
      cardId,
      visibleSide,
      contentSide,
      cacheKey: summarizeCacheKey(cacheKey),
      error:
        error instanceof Error ? error.message : "Unknown persistence error",
    })
    const racedSharedAsset = await querySharedTtsAsset(cacheKey)
    const racedSharedAssetFileUrl = getReadyFileUrl(racedSharedAsset)

    if (racedSharedAsset && racedSharedAssetFileUrl) {
      logTtsInfo("Resolved audio from raced shared asset", {
        userId,
        cardId,
        visibleSide,
        contentSide,
        assetId: racedSharedAsset.id,
        cacheKey: summarizeCacheKey(cacheKey),
      })
      await updateCardSetTtsReference(
        cardSet.id,
        contentSide,
        racedSharedAsset.id,
      )

      return toReadyResponse(racedSharedAsset, contentSide, false)
    }

    throw error
  }

  const generatedAsset = await querySharedTtsAsset(cacheKey)

  if (!generatedAsset) {
    logTtsError("Generated audio could not be reloaded from shared cache", {
      userId,
      cardId,
      visibleSide,
      contentSide,
      cacheKey: summarizeCacheKey(cacheKey),
    })
    throw new TtsResolveError("Failed to resolve generated audio.", 500)
  }

  await updateCardSetTtsReference(cardSet.id, contentSide, generatedAsset.id)

  logTtsInfo("Resolved audio from newly generated asset", {
    userId,
    cardId,
    visibleSide,
    contentSide,
    assetId: generatedAsset.id,
    cacheKey: summarizeCacheKey(cacheKey),
  })

  return toReadyResponse(generatedAsset, contentSide, false)
}
