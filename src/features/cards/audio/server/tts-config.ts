import {
  SUPPORTED_TTS_LOCALES,
  type SupportedTtsLocale,
  type TtsOutputFormat,
} from "@/features/cards/audio/model/card-audio"

export type TtsBaseConfig = {
  provider: "elevenlabs"
  outputFormat: TtsOutputFormat
}

export type TtsVoiceProfile = {
  locale: SupportedTtsLocale
  voiceId: string
  modelId: string
}

export const TTS_BASE_CONFIG: TtsBaseConfig = {
  provider: "elevenlabs",
  outputFormat: "mp3",
}

const FLASH_MODEL_ID = "eleven_flash_v2_5"

const TTS_VOICE_PROFILES_BY_LOCALE = {
  "en-US": {
    voiceId: "2vbhUP8zyKg4dEZaTWGn",
    modelId: FLASH_MODEL_ID,
  },
  "de-DE": {
    voiceId: "JiW03c2Gt43XNUQAumRP",
    modelId: FLASH_MODEL_ID,
  },
  "es-ES": {
    voiceId: "ODO4sbmD3pTjhgRVVRP6",
    modelId: FLASH_MODEL_ID,
  },
  "fr-FR": {
    voiceId: "fMikjf4u2qBd4gPl7yuw",
    modelId: FLASH_MODEL_ID,
  },
  "pt-BR": {
    voiceId: "7iqXtOF3wl3pomwXFY7G",
    modelId: FLASH_MODEL_ID,
  },
  "ja-JP": {
    voiceId: "GxhGYQesaQaYKePCZDEC",
    modelId: FLASH_MODEL_ID,
  },
  "zh-CN": {
    voiceId: "BqljjWyTnrioXPCNkCd4",
    modelId: FLASH_MODEL_ID,
  },
  "ru-RU": {
    voiceId: "KpX1OoMT6Br64YtIpgRI",
    modelId: FLASH_MODEL_ID,
  },
  "th-TH": {
    voiceId: "xVv8qLTTnsYnrysc2Lx4",
    modelId: "eleven_v3",
  },
} satisfies Record<
  SupportedTtsLocale,
  Pick<TtsVoiceProfile, "voiceId" | "modelId">
>

export function getTtsVoiceProfile(
  locale: SupportedTtsLocale,
): TtsVoiceProfile {
  return {
    locale,
    ...TTS_VOICE_PROFILES_BY_LOCALE[locale],
  }
}

export function getConfiguredTtsLocales(): SupportedTtsLocale[] {
  return [...SUPPORTED_TTS_LOCALES]
}

export function getConfiguredTtsVoiceProfiles(): TtsVoiceProfile[] {
  return SUPPORTED_TTS_LOCALES.map((locale) => getTtsVoiceProfile(locale))
}
