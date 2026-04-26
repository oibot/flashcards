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
  "de-DE",
  "es-ES",
  "fr-FR",
  "pt-BR",
  "ja-JP",
  "zh-CN",
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

export type CardSetTtsSelectionPatch = {
  sideATtsAssetId?: string | null
  sideBTtsAssetId?: string | null
}

export type CardSetTtsLocaleSelection = {
  sideATtsLocale?: SupportedTtsLocale
  sideBTtsLocale?: SupportedTtsLocale
}

export type CardSetTtsLocaleSelectionPatch = {
  sideATtsLocale?: SupportedTtsLocale | null
  sideBTtsLocale?: SupportedTtsLocale | null
}

export type CardSetTtsPatch = CardSetTtsLocaleSelectionPatch &
  CardSetTtsSelectionPatch

export type VisibleCardTtsSideSelection = {
  locale: SupportedTtsLocale | null
  assetId: string | null
}

export type VisibleCardTtsSelectionPatch = {
  front?: VisibleCardTtsSideSelection
  back?: VisibleCardTtsSideSelection
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

export function toCanonicalCardTtsPatch(
  selection: VisibleCardTtsSelectionPatch,
  variant: CardVariant,
): CardSetTtsPatch {
  const patch: CardSetTtsPatch = {}

  ;(["front", "back"] as const).forEach((visibleSide) => {
    const sideSelection = selection[visibleSide]

    if (!sideSelection) {
      return
    }

    const contentSide = resolveCardContentSide(variant, visibleSide)

    if (contentSide === "sideA") {
      patch.sideATtsLocale = sideSelection.locale
      patch.sideATtsAssetId = sideSelection.assetId
      return
    }

    patch.sideBTtsLocale = sideSelection.locale
    patch.sideBTtsAssetId = sideSelection.assetId
  })

  return patch
}

export function toCanonicalCardTtsSelectionPatch(
  selection: VisibleCardTtsSelectionPatch,
  variant: CardVariant,
): CardSetTtsSelectionPatch {
  const patch = toCanonicalCardTtsPatch(selection, variant)
  const selectionPatch: CardSetTtsSelectionPatch = {}

  if ("sideATtsAssetId" in patch) {
    selectionPatch.sideATtsAssetId = patch.sideATtsAssetId ?? null
  }

  if ("sideBTtsAssetId" in patch) {
    selectionPatch.sideBTtsAssetId = patch.sideBTtsAssetId ?? null
  }

  return selectionPatch
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
