import {
  SUPPORTED_TTS_LOCALES,
  type SupportedTtsLocale,
  type TtsOutputFormat,
} from "@/features/cards/audio/model/card-audio"

export type TtsBaseConfig = {
  provider: "elevenlabs"
  modelId: string
  outputFormat: TtsOutputFormat
}

export type TtsVoiceProfile = {
  locale: SupportedTtsLocale
  voiceId: string
}

export const TTS_BASE_CONFIG: TtsBaseConfig = {
  provider: "elevenlabs",
  modelId: "eleven_flash_v2_5",
  outputFormat: "mp3",
}

const TTS_VOICE_IDS_BY_LOCALE = {
  "en-US": "2vbhUP8zyKg4dEZaTWGn",
  "de-DE": "JiW03c2Gt43XNUQAumRP",
  "es-ES": "ODO4sbmD3pTjhgRVVRP6",
  "fr-FR": "fMikjf4u2qBd4gPl7yuw",
  "pt-BR": "7iqXtOF3wl3pomwXFY7G",
  "ja-JP": "GxhGYQesaQaYKePCZDEC",
  "zh-CN": "BqljjWyTnrioXPCNkCd4",
  "ru-RU": "KpX1OoMT6Br64YtIpgRI",
} satisfies Record<SupportedTtsLocale, string>

export function getTtsVoiceProfile(
  locale: SupportedTtsLocale,
): TtsVoiceProfile {
  return {
    locale,
    voiceId: TTS_VOICE_IDS_BY_LOCALE[locale],
  }
}

export function getConfiguredTtsLocales(): SupportedTtsLocale[] {
  return [...SUPPORTED_TTS_LOCALES]
}

export function getConfiguredTtsVoiceProfiles(): TtsVoiceProfile[] {
  return SUPPORTED_TTS_LOCALES.map((locale) => getTtsVoiceProfile(locale))
}
