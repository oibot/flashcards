import type { TtsConfig, TtsOutputFormat } from "@/domain/card-audio"
import { TtsResolveError } from "@/server/tts/errors"
import { logTtsError, logTtsInfo, summarizeText } from "@/server/tts/log"

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

export function getTtsConfig(): TtsConfig {
  const voiceId = process.env.ELEVENLABS_VOICE_ID

  if (!voiceId) {
    throw new TtsResolveError("Missing ELEVENLABS_VOICE_ID.", 500)
  }

  return {
    provider: "elevenlabs",
    locale: process.env.ELEVENLABS_TTS_LOCALE ?? "en-US",
    voiceId,
    modelId: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
    outputFormat: "mp3",
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

  logTtsInfo("Decoded ElevenLabs audio payload", {
    status: response.status,
    byteLength: audioBytes.byteLength,
    locale: config.locale,
    voiceId: config.voiceId,
    modelId: config.modelId,
  })

  return audioBytes
}
