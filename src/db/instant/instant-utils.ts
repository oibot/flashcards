import type { InstaQLEntity } from "@instantdb/react-native"

import type { AppSchema } from "@/db/instant/instant.schema"
import type { Card } from "@/domain/card"
import { parseCardState } from "@/domain/card-state"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type InstantCardRecord = InstaQLEntity<AppSchema, "cards", { tags: {} }>

export function toTimestamp(value: number | string) {
  if (typeof value === "number") return value

  const asNumber = Number(value)
  if (!Number.isNaN(asNumber)) return asNumber

  return Date.parse(value)
}

export function toCard(card: InstantCardRecord): Card {
  const state = parseCardState(card.state)

  if (!state) {
    throw new Error(`Invalid card state: ${String(card.state)}`)
  }

  return {
    id: card.id,
    tags: card.tags.map((tag) => tag.title),
    frontHtml: card.frontHtml,
    backHtml: card.backHtml,
    createdAt: toTimestamp(card.createdAt),
    updatedAt: toTimestamp(card.updatedAt),
    dueAt: toTimestamp(card.dueAt),
    lastReviewedAt: toTimestamp(card.lastReviewedAt),
    intervalDays: card.intervalDays,
    easeFactor: card.easeFactor,
    repetition: card.repetition,
    lapses: card.lapses,
    state,
  }
}

export function normalizeError(error: unknown) {
  if (!error) return null
  if (error instanceof Error) return error
  return new Error(String(error))
}
