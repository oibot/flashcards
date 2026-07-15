import type { SupportedTtsLocale } from "@/features/cards/audio/model/card-audio"

export const TTS_LANGUAGE_NATIVE_LABELS = {
  "en-US": "English",
  "de-DE": "Deutsch",
  "es-ES": "Español",
  "fr-FR": "Français",
  "pt-BR": "Português",
  "ja-JP": "日本語",
  "zh-CN": "中文",
  "ru-RU": "Русский",
  "th-TH": "ไทย",
} satisfies Record<SupportedTtsLocale, string>
