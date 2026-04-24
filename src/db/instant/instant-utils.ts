import type { InstaQLEntity } from "@instantdb/react-native"

import type { AppSchema } from "@/db/instant/instant.schema"
import {
  type CanonicalCardContent,
  type Card,
  isCardVariant,
  resolveCardContent,
} from "@/domain/card"
import {
  type CardSetTtsLocaleSelection,
  isSupportedTtsLocale,
} from "@/domain/card-audio"
import type { CardBackupCard, CardBackupCardSet } from "@/domain/card-backup"
import { parseCardState } from "@/domain/card-state"

type EmptyRelations = Record<never, never>
type InstantCardWithCardSetRecord = InstaQLEntity<
  AppSchema,
  "cards",
  { cardSet: { tags: EmptyRelations } }
>
type InstantCardSetSummaryRecord = InstaQLEntity<
  AppSchema,
  "cardSets",
  { tags: EmptyRelations }
>
type InstantCardSetRecord = InstaQLEntity<
  AppSchema,
  "cardSets",
  { tags: EmptyRelations; cards: EmptyRelations }
>
type InstantBackupCardRecord = InstaQLEntity<AppSchema, "cards", EmptyRelations>

export type StoredCardSet = CanonicalCardContent &
  CardSetTtsLocaleSelection & {
    id: string
    tags: string[]
    createdAt: number
    updatedAt: number
  }

function toOptionalTtsLocale(value: unknown) {
  return isSupportedTtsLocale(value) ? value : undefined
}

export function toTimestamp(value: number | string) {
  if (typeof value === "number") return value

  const asNumber = Number(value)
  if (!Number.isNaN(asNumber)) return asNumber

  return Date.parse(value)
}

export function toStoredCardSet(
  cardSet: InstantCardSetSummaryRecord,
): StoredCardSet {
  return {
    id: cardSet.id,
    tags: cardSet.tags.map((tag) => tag.title),
    sideAHtml: cardSet.sideAHtml,
    sideBHtml: cardSet.sideBHtml,
    sideATtsLocale: toOptionalTtsLocale(cardSet.sideATtsLocale),
    sideBTtsLocale: toOptionalTtsLocale(cardSet.sideBTtsLocale),
    createdAt: toTimestamp(cardSet.createdAt),
    updatedAt: toTimestamp(cardSet.updatedAt),
  }
}

export function toCard(card: InstantCardWithCardSetRecord): Card {
  const state = parseCardState(card.state)

  if (!state) {
    throw new Error(`Invalid card state: ${String(card.state)}`)
  }

  if (!card.cardSet) {
    throw new Error(`Missing card set for card ${card.id}`)
  }

  if (!isCardVariant(card.variant)) {
    throw new Error(`Invalid card variant: ${String(card.variant)}`)
  }

  const cardSet = toStoredCardSet(card.cardSet)
  const resolvedContent = resolveCardContent(cardSet, card.variant)
  const sideAHasSound = cardSet.sideATtsLocale !== undefined
  const sideBHasSound = cardSet.sideBTtsLocale !== undefined

  return {
    id: card.id,
    cardSetId: cardSet.id,
    variant: card.variant,
    tags: cardSet.tags,
    frontHtml: resolvedContent.frontHtml,
    backHtml: resolvedContent.backHtml,
    frontHasSound: card.variant === "forward" ? sideAHasSound : sideBHasSound,
    backHasSound: card.variant === "forward" ? sideBHasSound : sideAHasSound,
    createdAt: toTimestamp(card.createdAt),
    updatedAt: Math.max(
      toTimestamp(card.updatedAt),
      toTimestamp(card.cardSet.updatedAt),
    ),
    dueAt: toTimestamp(card.dueAt),
    lastReviewedAt: toTimestamp(card.lastReviewedAt),
    intervalDays: card.intervalDays,
    easeFactor: card.easeFactor,
    repetition: card.repetition,
    lapses: card.lapses,
    state,
  }
}

export function toCardBackupCard(
  card: InstantBackupCardRecord,
): CardBackupCard {
  const state = parseCardState(card.state)

  if (!state) {
    throw new Error(`Invalid card state: ${String(card.state)}`)
  }

  if (!isCardVariant(card.variant)) {
    throw new Error(`Invalid card variant: ${String(card.variant)}`)
  }

  return {
    id: card.id,
    variant: card.variant,
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

export function toCardBackupCardSet(
  cardSet: InstantCardSetRecord,
): CardBackupCardSet {
  const normalizedCardSet = toStoredCardSet(cardSet)
  const cards = [...cardSet.cards]
    .map(toCardBackupCard)
    .sort(
      (left, right) =>
        left.createdAt - right.createdAt || left.id.localeCompare(right.id),
    )

  return {
    ...normalizedCardSet,
    cards,
  }
}

export function normalizeError(error: unknown) {
  if (!error) return null
  if (error instanceof Error) return error
  return new Error(String(error))
}
