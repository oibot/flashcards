import type {
  CardContentSide,
  CardVariant,
  VisibleCardSide,
} from "@/domain/card"
import { normalizeWhitespace } from "@/utils/html"

export type TtsProvider = "elevenlabs"
export type TtsOutputFormat = "mp3"
export type TtsAssetStatus = "ready" | "failed"
export const SUPPORTED_TTS_LOCALES = [
  "en-US",
  "ja-JP",
  "zh-CN",
  "de-DE",
  "hi-IN",
  "fr-FR",
  "ko-KR",
  "pt-BR",
  "it-IT",
  "es-ES",
  "id-ID",
  "nl-NL",
  "tr-TR",
  "fil-PH",
  "pl-PL",
  "sv-SE",
  "bg-BG",
  "ro-RO",
  "ar-SA",
  "cs-CZ",
  "el-GR",
  "fi-FI",
  "hr-HR",
  "ms-MY",
  "sk-SK",
  "da-DK",
  "ta-IN",
  "uk-UA",
  "ru-RU",
] as const
export type SupportedTtsLocale = (typeof SUPPORTED_TTS_LOCALES)[number]
export type TtsConfig = {
  provider: TtsProvider
  locale: SupportedTtsLocale
  voiceId: string
  modelId: string
  outputFormat: TtsOutputFormat
}
export type TtsResolveReadyResponse = {
  status: "ready"
  assetId: string
  fileUrl: string
  contentSide: CardContentSide
  cacheHit: boolean
}
export type TtsResolveNeedsLocaleResponse = {
  status: "needs-locale"
  contentSide: CardContentSide
  supportedLocales: SupportedTtsLocale[]
}
export type TtsResolveResponse =
  | TtsResolveReadyResponse
  | TtsResolveNeedsLocaleResponse

export type CardSetTtsSelection = {
  sideATtsAssetId?: string
  sideBTtsAssetId?: string
}

export type CardSetTtsLocaleSelection = {
  sideATtsLocale?: SupportedTtsLocale
  sideBTtsLocale?: SupportedTtsLocale
}

export type TtsAsset = {
  id: string
  cacheKey: string
  sourceText: string
  normalizedText: string
  locale: SupportedTtsLocale
  provider: TtsProvider
  voiceId: string
  modelId: string
  outputFormat: TtsOutputFormat
  status: TtsAssetStatus
  fileId: string
  durationMs?: number
  error?: string
  createdAt: number
  updatedAt: number
}

export function resolveCardContentSide(
  variant: CardVariant,
  visibleSide: VisibleCardSide,
): CardContentSide {
  if (variant === "forward") {
    return visibleSide === "front" ? "sideA" : "sideB"
  }

  return visibleSide === "front" ? "sideB" : "sideA"
}

export function normalizeTtsSourceText(text: string) {
  return normalizeWhitespace(text)
}

export function isSupportedTtsLocale(
  value: unknown,
): value is SupportedTtsLocale {
  return (
    typeof value === "string" &&
    SUPPORTED_TTS_LOCALES.includes(value as SupportedTtsLocale)
  )
}

export function getCardSetTtsLocale(
  selection: CardSetTtsLocaleSelection,
  contentSide: CardContentSide,
) {
  if (contentSide === "sideA") {
    return selection.sideATtsLocale
  }

  return selection.sideBTtsLocale
}

export async function createTtsCacheKey(
  text: string,
  config: TtsConfig,
  cacheVersion = 1,
) {
  const payload = JSON.stringify({
    text,
    provider: config.provider,
    locale: config.locale,
    voiceId: config.voiceId,
    modelId: config.modelId,
    outputFormat: config.outputFormat,
    cacheVersion,
  })
  const encodedPayload = new TextEncoder().encode(payload)
  const digest = await crypto.subtle.digest("SHA-256", encodedPayload)

  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
}

export type { CardContentSide, VisibleCardSide }
