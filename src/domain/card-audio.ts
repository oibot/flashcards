import type {
  CardContentSide,
  CardVariant,
  VisibleCardSide,
} from "@/domain/card"
import { normalizeWhitespace } from "@/utils/html"

export type TtsProvider = "elevenlabs"
export type TtsOutputFormat = "mp3"
export type TtsAssetStatus = "ready" | "failed"
export type TtsConfig = {
  provider: TtsProvider
  locale: string
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
export type TtsResolveMissingResponse = {
  status: "missing"
  contentSide: CardContentSide
  cacheKey: string
}
export type TtsResolveResponse =
  | TtsResolveReadyResponse
  | TtsResolveMissingResponse

export type CardSetTtsSelection = {
  sideATtsAssetId?: string
  sideBTtsAssetId?: string
}

export type TtsAsset = {
  id: string
  cacheKey: string
  sourceText: string
  normalizedText: string
  locale: string
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
