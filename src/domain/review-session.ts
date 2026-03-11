import type { Card } from "@/domain/card"

export type ReviewSessionConfig = {
  tags?: string[]
}

export type ReviewSessionSeed = {
  cards: Card[]
  config?: ReviewSessionConfig
}
