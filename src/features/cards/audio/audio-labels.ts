import type { SupportedTtsLocale } from "@/features/cards/audio/card-audio"

export const TTS_LANGUAGE_NATIVE_LABELS = {
  "en-US": "English",
  "de-DE": "Deutsch",
  "es-ES": "Español",
  "fr-FR": "Français",
  "pt-BR": "Português",
  "ja-JP": "日本語",
  "zh-CN": "中文",
  "ru-RU": "Русский",
} satisfies Record<SupportedTtsLocale, string>
