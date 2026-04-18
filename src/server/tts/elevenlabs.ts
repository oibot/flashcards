import type { TtsConfig, TtsOutputFormat } from "@/domain/card-audio"
import { TtsResolveError } from "@/server/tts/errors"

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

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "")
    const errorMessage =
      errorBody.trim().length > 0 ? errorBody : "ElevenLabs request failed."

    throw new TtsResolveError(errorMessage, 502)
  }

  return new Uint8Array(await response.arrayBuffer())
}
