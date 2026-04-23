import {
  isSupportedTtsLocale,
  SUPPORTED_TTS_LOCALES,
  type SupportedTtsLocale,
  type TtsConfig,
  type TtsOutputFormat,
} from "@/domain/card-audio"
import { TtsResolveError } from "@/server/tts/errors"
import { logTtsError, logTtsInfo, summarizeText } from "@/server/tts/log"

const ELEVENLABS_OUTPUT_FORMAT = "mp3_44100_128"
const AUDIO_CONTENT_TYPES: Record<TtsOutputFormat, string> = {
  mp3: "audio/mpeg",
}
const DEFAULT_TTS_MODEL_ID = "eleven_multilingual_v2"
const DEFAULT_TTS_OUTPUT_FORMAT: TtsOutputFormat = "mp3"
const TTS_VOICE_ID_ENV_VAR_NAMES: Record<SupportedTtsLocale, string> = {
  "en-US": "ELEVENLABS_VOICE_ID_EN_US",
  "ja-JP": "ELEVENLABS_VOICE_ID_JA_JP",
  "zh-CN": "ELEVENLABS_VOICE_ID_ZH_CN",
  "de-DE": "ELEVENLABS_VOICE_ID_DE_DE",
  "hi-IN": "ELEVENLABS_VOICE_ID_HI_IN",
  "fr-FR": "ELEVENLABS_VOICE_ID_FR_FR",
  "ko-KR": "ELEVENLABS_VOICE_ID_KO_KR",
  "pt-BR": "ELEVENLABS_VOICE_ID_PT_BR",
  "it-IT": "ELEVENLABS_VOICE_ID_IT_IT",
  "es-ES": "ELEVENLABS_VOICE_ID_ES_ES",
  "id-ID": "ELEVENLABS_VOICE_ID_ID_ID",
  "nl-NL": "ELEVENLABS_VOICE_ID_NL_NL",
  "tr-TR": "ELEVENLABS_VOICE_ID_TR_TR",
  "fil-PH": "ELEVENLABS_VOICE_ID_FIL_PH",
  "pl-PL": "ELEVENLABS_VOICE_ID_PL_PL",
  "sv-SE": "ELEVENLABS_VOICE_ID_SV_SE",
  "bg-BG": "ELEVENLABS_VOICE_ID_BG_BG",
  "ro-RO": "ELEVENLABS_VOICE_ID_RO_RO",
  "ar-SA": "ELEVENLABS_VOICE_ID_AR_SA",
  "cs-CZ": "ELEVENLABS_VOICE_ID_CS_CZ",
  "el-GR": "ELEVENLABS_VOICE_ID_EL_GR",
  "fi-FI": "ELEVENLABS_VOICE_ID_FI_FI",
  "hr-HR": "ELEVENLABS_VOICE_ID_HR_HR",
  "ms-MY": "ELEVENLABS_VOICE_ID_MS_MY",
  "sk-SK": "ELEVENLABS_VOICE_ID_SK_SK",
  "da-DK": "ELEVENLABS_VOICE_ID_DA_DK",
  "ta-IN": "ELEVENLABS_VOICE_ID_TA_IN",
  "uk-UA": "ELEVENLABS_VOICE_ID_UK_UA",
  "ru-RU": "ELEVENLABS_VOICE_ID_RU_RU",
}
const TTS_VOICE_IDS_BY_LOCALE: Record<SupportedTtsLocale, string | undefined> =
  {
    "en-US": process.env.ELEVENLABS_VOICE_ID_EN_US,
    "ja-JP": process.env.ELEVENLABS_VOICE_ID_JA_JP,
    "zh-CN": process.env.ELEVENLABS_VOICE_ID_ZH_CN,
    "de-DE": process.env.ELEVENLABS_VOICE_ID_DE_DE,
    "hi-IN": process.env.ELEVENLABS_VOICE_ID_HI_IN,
    "fr-FR": process.env.ELEVENLABS_VOICE_ID_FR_FR,
    "ko-KR": process.env.ELEVENLABS_VOICE_ID_KO_KR,
    "pt-BR": process.env.ELEVENLABS_VOICE_ID_PT_BR,
    "it-IT": process.env.ELEVENLABS_VOICE_ID_IT_IT,
    "es-ES": process.env.ELEVENLABS_VOICE_ID_ES_ES,
    "id-ID": process.env.ELEVENLABS_VOICE_ID_ID_ID,
    "nl-NL": process.env.ELEVENLABS_VOICE_ID_NL_NL,
    "tr-TR": process.env.ELEVENLABS_VOICE_ID_TR_TR,
    "fil-PH": process.env.ELEVENLABS_VOICE_ID_FIL_PH,
    "pl-PL": process.env.ELEVENLABS_VOICE_ID_PL_PL,
    "sv-SE": process.env.ELEVENLABS_VOICE_ID_SV_SE,
    "bg-BG": process.env.ELEVENLABS_VOICE_ID_BG_BG,
    "ro-RO": process.env.ELEVENLABS_VOICE_ID_RO_RO,
    "ar-SA": process.env.ELEVENLABS_VOICE_ID_AR_SA,
    "cs-CZ": process.env.ELEVENLABS_VOICE_ID_CS_CZ,
    "el-GR": process.env.ELEVENLABS_VOICE_ID_EL_GR,
    "fi-FI": process.env.ELEVENLABS_VOICE_ID_FI_FI,
    "hr-HR": process.env.ELEVENLABS_VOICE_ID_HR_HR,
    "ms-MY": process.env.ELEVENLABS_VOICE_ID_MS_MY,
    "sk-SK": process.env.ELEVENLABS_VOICE_ID_SK_SK,
    "da-DK": process.env.ELEVENLABS_VOICE_ID_DA_DK,
    "ta-IN": process.env.ELEVENLABS_VOICE_ID_TA_IN,
    "uk-UA": process.env.ELEVENLABS_VOICE_ID_UK_UA,
    "ru-RU": process.env.ELEVENLABS_VOICE_ID_RU_RU,
  }

export type TtsBaseConfig = {
  provider: "elevenlabs"
  modelId: string
  outputFormat: TtsOutputFormat
}

export type TtsVoiceProfile = {
  locale: SupportedTtsLocale
  voiceId: string
}

function toLanguageCode(locale: string) {
  const [languageCode = ""] = locale.split(/[-_]/)

  return languageCode.toLowerCase()
}

export function getTtsAudioContentType(outputFormat: TtsOutputFormat) {
  return AUDIO_CONTENT_TYPES[outputFormat]
}

export function getTtsBaseConfig(): TtsBaseConfig {
  return {
    provider: "elevenlabs",
    modelId: process.env.ELEVENLABS_MODEL_ID ?? DEFAULT_TTS_MODEL_ID,
    outputFormat: DEFAULT_TTS_OUTPUT_FORMAT,
  }
}

export function getTtsVoiceIdEnvVarName(locale: SupportedTtsLocale) {
  return TTS_VOICE_ID_ENV_VAR_NAMES[locale]
}

function getLegacyTtsLocale() {
  const locale = process.env.ELEVENLABS_TTS_LOCALE ?? "en-US"

  if (!isSupportedTtsLocale(locale)) {
    throw new TtsResolveError("Unsupported ELEVENLABS_TTS_LOCALE.", 500)
  }

  return locale
}

function getLegacyTtsVoiceProfile(): TtsVoiceProfile | null {
  const voiceId = process.env.ELEVENLABS_VOICE_ID

  if (!voiceId) {
    return null
  }

  return {
    locale: getLegacyTtsLocale(),
    voiceId,
  }
}

export function getTtsVoiceProfile(
  locale: SupportedTtsLocale,
): TtsVoiceProfile | null {
  const voiceId = TTS_VOICE_IDS_BY_LOCALE[locale]

  if (voiceId) {
    return {
      locale,
      voiceId,
    }
  }

  const legacyProfile = getLegacyTtsVoiceProfile()

  if (legacyProfile?.locale === locale) {
    return legacyProfile
  }

  return null
}

export function getConfiguredTtsLocales() {
  return SUPPORTED_TTS_LOCALES.filter(
    (locale): locale is SupportedTtsLocale =>
      getTtsVoiceProfile(locale) !== null,
  )
}

export function getConfiguredTtsVoiceProfiles() {
  return getConfiguredTtsLocales()
    .map((locale) => getTtsVoiceProfile(locale))
    .filter((profile): profile is TtsVoiceProfile => profile !== null)
}

export function resolveTtsConfig(locale: SupportedTtsLocale): TtsConfig {
  const voiceProfile = getTtsVoiceProfile(locale)

  if (!voiceProfile) {
    throw new TtsResolveError(
      `Missing ${getTtsVoiceIdEnvVarName(locale)}.`,
      500,
    )
  }

  return {
    ...getTtsBaseConfig(),
    locale: voiceProfile.locale,
    voiceId: voiceProfile.voiceId,
  }
}

export function getTtsConfig(): TtsConfig {
  const voiceId = process.env.ELEVENLABS_VOICE_ID

  if (!voiceId) {
    return resolveTtsConfig(getLegacyTtsLocale())
  }

  return {
    ...getTtsBaseConfig(),
    locale: getLegacyTtsLocale(),
    voiceId,
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
