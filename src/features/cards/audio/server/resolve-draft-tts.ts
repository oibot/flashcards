import {
  createTtsCacheKey,
  extractNormalizedTtsTextFromHtml,
  extractTtsSourceTextFromHtml,
  type SupportedTtsLocale,
} from "@/features/cards/audio/card-audio"
import {
  generateElevenLabsAudio,
  getTtsAudioContentType,
  resolveTtsConfig,
} from "@/features/cards/audio/server/elevenlabs"
import { TtsResolveError } from "@/features/cards/audio/server/errors"
import {
  getReadyFileUrl,
  persistGeneratedTtsAsset,
  querySharedTtsAsset,
  uploadGeneratedAudio,
} from "@/features/cards/audio/server/instant-tts-assets"
import {
  logTtsError,
  logTtsInfo,
  logTtsWarn,
  summarizeCacheKey,
} from "@/features/cards/audio/server/log"
type ResolveDraftTtsInput = {
  userId: string
  html: string
  locale: SupportedTtsLocale
}

type DraftTtsReadyResponse = {
  status: "ready"
  assetId: string
  fileUrl: string
  cacheHit: boolean
}

function toReadyResponse(
  assetId: string,
  fileUrl: string,
  cacheHit: boolean,
): DraftTtsReadyResponse {
  return {
    status: "ready",
    assetId,
    fileUrl,
    cacheHit,
  }
}

export async function resolveDraftTts({
  userId,
  html,
  locale,
}: ResolveDraftTtsInput): Promise<DraftTtsReadyResponse> {
  logTtsInfo("Resolving draft audio", {
    userId,
    locale,
  })

  const sourceText = extractTtsSourceTextFromHtml(html)
  const normalizedText = extractNormalizedTtsTextFromHtml(html)

  if (normalizedText.length === 0) {
    logTtsWarn("Draft side has no speakable text", {
      userId,
      locale,
    })
    throw new TtsResolveError("Card side does not contain speakable text.", 422)
  }

  const ttsConfig = resolveTtsConfig(locale)
  const cacheKey = await createTtsCacheKey(normalizedText, ttsConfig)

  logTtsInfo("Computed draft TTS cache key", {
    userId,
    locale,
    cacheKey: summarizeCacheKey(cacheKey),
    normalizedTextLength: normalizedText.length,
  })

  const sharedAsset = await querySharedTtsAsset(cacheKey)
  const sharedAssetFileUrl = getReadyFileUrl(sharedAsset)

  if (sharedAsset && sharedAssetFileUrl) {
    logTtsInfo("Resolved draft audio from shared TTS cache", {
      userId,
      locale,
      assetId: sharedAsset.id,
      cacheKey: summarizeCacheKey(cacheKey),
    })

    return toReadyResponse(sharedAsset.id, sharedAssetFileUrl, true)
  }

  logTtsInfo("Draft audio cache miss, generating with ElevenLabs", {
    userId,
    locale,
    cacheKey: summarizeCacheKey(cacheKey),
  })
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
    logTtsWarn(
      "Persisting generated draft TTS asset raced with another request",
      {
        userId,
        locale,
        cacheKey: summarizeCacheKey(cacheKey),
        error:
          error instanceof Error ? error.message : "Unknown persistence error",
      },
    )
    const racedSharedAsset = await querySharedTtsAsset(cacheKey)
    const racedSharedAssetFileUrl = getReadyFileUrl(racedSharedAsset)

    if (racedSharedAsset && racedSharedAssetFileUrl) {
      logTtsInfo("Resolved draft audio from raced shared asset", {
        userId,
        locale,
        assetId: racedSharedAsset.id,
        cacheKey: summarizeCacheKey(cacheKey),
      })

      return toReadyResponse(
        racedSharedAsset.id,
        racedSharedAssetFileUrl,
        false,
      )
    }

    throw error
  }

  const generatedAsset = await querySharedTtsAsset(cacheKey)
  const generatedAssetFileUrl = getReadyFileUrl(generatedAsset)

  if (!generatedAsset || !generatedAssetFileUrl) {
    logTtsError(
      "Generated draft audio could not be reloaded from shared cache",
      {
        userId,
        locale,
        cacheKey: summarizeCacheKey(cacheKey),
      },
    )
    throw new TtsResolveError("Failed to resolve generated audio.", 500)
  }

  logTtsInfo("Resolved draft audio from newly generated asset", {
    userId,
    locale,
    assetId: generatedAsset.id,
    cacheKey: summarizeCacheKey(cacheKey),
  })

  return toReadyResponse(generatedAsset.id, generatedAssetFileUrl, false)
}
