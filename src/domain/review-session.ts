import type { Card } from "@/domain/card"

export type ReviewPreparationKind = "due" | "all"

export type ReviewSessionConfig = {
  tags?: string[]
}

export type ReviewSessionSeed = {
  cards: Card[]
  config?: ReviewSessionConfig
}
