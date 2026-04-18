import {
  isCardVariant,
  resolveCardContent,
  type VisibleCardSide,
} from "@/domain/card"
import {
  createTtsCacheKey,
  normalizeTtsSourceText,
  resolveCardContentSide,
  type TtsResolveReadyResponse,
} from "@/domain/card-audio"
import {
  generateElevenLabsAudio,
  getTtsAudioContentType,
  getTtsConfig,
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
import { extractPlainTextFromHtml } from "@/utils/html"

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
}: ResolveTtsInput): Promise<TtsResolveReadyResponse> {
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
  const html =
    visibleSide === "front" ? visibleContent.frontHtml : visibleContent.backHtml
  const sourceText = extractPlainTextFromHtml(html)
  const normalizedText = normalizeTtsSourceText(sourceText)

  if (normalizedText.length === 0) {
    throw new TtsResolveError("Card side does not contain speakable text.", 422)
  }

  const ttsConfig = getTtsConfig()
  const cacheKey = await createTtsCacheKey(normalizedText, ttsConfig)
  const selectedTtsAsset = getSelectedTtsAsset(cardSet, contentSide)

  if (selectedTtsAsset?.cacheKey === cacheKey) {
    const fileUrl = getReadyFileUrl(selectedTtsAsset)

    if (fileUrl) {
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
    await updateCardSetTtsReference(cardSet.id, contentSide, sharedAsset.id)

    return toReadyResponse(sharedAsset, contentSide, true)
  }

  const audioBytes = await generateElevenLabsAudio(normalizedText, ttsConfig)
  const uploadedFile = await uploadGeneratedAudio(
    cacheKey,
    audioBytes,
    getTtsAudioContentType(ttsConfig.outputFormat),
  )

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
    const racedSharedAsset = await querySharedTtsAsset(cacheKey)
    const racedSharedAssetFileUrl = getReadyFileUrl(racedSharedAsset)

    if (racedSharedAsset && racedSharedAssetFileUrl) {
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
    throw new TtsResolveError("Failed to resolve generated audio.", 500)
  }

  await updateCardSetTtsReference(cardSet.id, contentSide, generatedAsset.id)

  return toReadyResponse(generatedAsset, contentSide, false)
}
