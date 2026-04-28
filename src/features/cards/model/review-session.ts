import type { Card } from "@/features/cards/model/card"

export type ReviewPreparationKind = "due" | "all"

export type ReviewSessionConfig = {
  tags?: string[]
}

export type ReviewSessionSeed = {
  cards: Card[]
  config?: ReviewSessionConfig
}
