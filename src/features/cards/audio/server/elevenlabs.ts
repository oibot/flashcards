import {
  type SupportedTtsLocale,
  type TtsConfig,
  type TtsOutputFormat,
} from "@/features/cards/audio/model/card-audio"
import { TtsResolveError } from "@/features/cards/audio/server/errors"
import {
  logTtsError,
  logTtsInfo,
  summarizeText,
} from "@/features/cards/audio/server/log"
import {
  getConfiguredTtsLocales as getConfiguredTtsLocalesFromConfig,
  getConfiguredTtsVoiceProfiles as getConfiguredTtsVoiceProfilesFromConfig,
  getTtsVoiceProfile as getTtsVoiceProfileFromConfig,
  TTS_BASE_CONFIG,
  type TtsBaseConfig,
  type TtsVoiceProfile,
} from "@/features/cards/audio/server/tts-config"

const ELEVENLABS_OUTPUT_FORMAT = "mp3_44100_128"
const AUDIO_CONTENT_TYPES: Record<TtsOutputFormat, string> = {
  mp3: "audio/mpeg",
}

function toLanguageCode(locale: string) {
  const [languageCode = ""] = locale.split(/[-_]/)

  return languageCode.toLowerCase()
}

export function getTtsAudioContentType(outputFormat: TtsOutputFormat) {
  return AUDIO_CONTENT_TYPES[outputFormat]
}

export function getTtsBaseConfig(): TtsBaseConfig {
  return TTS_BASE_CONFIG
}

export function getTtsVoiceProfile(
  locale: SupportedTtsLocale,
): TtsVoiceProfile {
  return getTtsVoiceProfileFromConfig(locale)
}

export function getConfiguredTtsLocales() {
  return getConfiguredTtsLocalesFromConfig()
}

export function getConfiguredTtsVoiceProfiles() {
  return getConfiguredTtsVoiceProfilesFromConfig()
}

export function resolveTtsConfig(locale: SupportedTtsLocale): TtsConfig {
  const voiceProfile = getTtsVoiceProfile(locale)

  return {
    ...getTtsBaseConfig(),
    locale: voiceProfile.locale,
    voiceId: voiceProfile.voiceId,
    modelId: voiceProfile.modelId,
  }
}

export async function generateElevenLabsAudio(text: string, config: TtsConfig) {
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    throw new TtsResolveError("Missing ELEVENLABS_API_KEY.", 500)
  }

  const url = new URL(
    `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`,
  )
  url.searchParams.set("output_format", ELEVENLABS_OUTPUT_FORMAT)

  logTtsInfo("Sending ElevenLabs request", {
    locale: config.locale,
    voiceId: config.voiceId,
    modelId: config.modelId,
    textLength: text.length,
    textPreview: summarizeText(text),
  })

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: config.modelId,
      language_code: toLanguageCode(config.locale),
    }),
  })

  logTtsInfo("Received ElevenLabs response", {
    status: response.status,
    ok: response.ok,
    locale: config.locale,
    voiceId: config.voiceId,
    modelId: config.modelId,
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "")
    const errorMessage =
      errorBody.trim().length > 0 ? errorBody : "ElevenLabs request failed."

    logTtsError("ElevenLabs request failed", {
      status: response.status,
      locale: config.locale,
      voiceId: config.voiceId,
      modelId: config.modelId,
      errorMessage,
    })

    throw new TtsResolveError(errorMessage, 502)
  }

  const audioBytes = new Uint8Array(await response.arrayBuffer())

  if (audioBytes.byteLength === 0) {
    const errorMessage = "ElevenLabs returned an empty audio payload."

    logTtsError("ElevenLabs returned empty audio", {
      status: response.status,
      locale: config.locale,
      voiceId: config.voiceId,
      modelId: config.modelId,
      errorMessage,
    })

    throw new TtsResolveError(errorMessage, 502)
  }

  logTtsInfo("Decoded ElevenLabs audio payload", {
    status: response.status,
    byteLength: audioBytes.byteLength,
    locale: config.locale,
    voiceId: config.voiceId,
    modelId: config.modelId,
  })

  return audioBytes
}

export type { TtsBaseConfig, TtsVoiceProfile }
