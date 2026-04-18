import type {
  CardContentSide,
  CardVariant,
  VisibleCardSide,
} from "@/domain/card"

export type TtsProvider = "elevenlabs"
export type TtsOutputFormat = "mp3"
export type TtsAssetStatus = "ready" | "failed"

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

export type { CardContentSide, VisibleCardSide }
