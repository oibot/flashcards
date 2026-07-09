import {
  type CardSetTtsPatch,
  toCanonicalCardTtsPatch,
} from "@/features/cards/audio/model/card-audio"
import type {
  CardBackupCard,
  CardBackupCardSet,
  CardBackupEnvelope,
} from "@/features/cards/backup/model/card-backup"
import {
  type NewCardInput,
  parseTags,
  toCanonicalCardContent,
  type UpdateCardInput,
} from "@/features/cards/model/card"
import { createInitialSchedule } from "@/features/cards/model/review-scheduler"
import { hasOwn } from "@/shared/lib/object"

type TagDiff = {
  tagsToLink: string[]
  tagsToUnlink: string[]
}

type ExistingImportedCardSet = {
  id: string
  tags: string[]
}

type CardSetLocaleUpdateData = {
  sideATtsLocale?: CardSetTtsPatch["sideATtsLocale"] | null
  sideBTtsLocale?: CardSetTtsPatch["sideBTtsLocale"] | null
}

export type UpdateCardPlan = {
  cardSetId: string
  cardSetUpdate: {
    sideAHtml: string
    sideBHtml: string
    updatedAt: number
  } & CardSetLocaleUpdateData
} & TagDiff

type UpdateCardPlanInput = {
  input: UpdateCardInput
  now: number
}

type AddCardPlanInput = {
  input: NewCardInput
  now: number
  cardSetId: string
  cardIds: string[]
}

type ImportCardsPlanInput = {
  backup: CardBackupEnvelope
  existingCardSets: ExistingImportedCardSet[]
}

export type AddCardPlan = {
  cardSetId: string
  tags: string[]
  cardSetUpdate: {
    sideAHtml: string
    sideBHtml: string
    createdAt: number
    updatedAt: number
  } & CardSetLocaleUpdateData
  cards: (ReturnType<typeof createInitialSchedule> & {
    id: string
    variant: NewCardInput["variants"][number]
    createdAt: number
    updatedAt: number
  })[]
}

export type ImportedCardSetPlan = Omit<CardBackupCardSet, "cards" | "tags"> & {
  tags: string[]
  previousTags: string[]
}

export type ImportedCardPlan = CardBackupCard & {
  cardSetId: string
}

export type ImportCardsPlan = {
  importedTags: string[]
  cardSets: ImportedCardSetPlan[]
  cards: ImportedCardPlan[]
}

export function diffTags(previousTags: string[], nextTags: string[]): TagDiff {
  const previousTagSet = new Set(previousTags)
  const nextTagSet = new Set(nextTags)

  return {
    tagsToLink: nextTags.filter((tag) => !previousTagSet.has(tag)),
    tagsToUnlink: previousTags.filter((tag) => !nextTagSet.has(tag)),
  }
}

export function buildCardSetTtsUpdateData(
  ttsPatch: CardSetTtsPatch,
): CardSetLocaleUpdateData {
  return {
    ...(hasOwn(ttsPatch, "sideATtsLocale")
      ? { sideATtsLocale: ttsPatch.sideATtsLocale ?? null }
      : {}),
    ...(hasOwn(ttsPatch, "sideBTtsLocale")
      ? { sideBTtsLocale: ttsPatch.sideBTtsLocale ?? null }
      : {}),
  }
}

export function planUpdateCard({
  input,
  now,
}: UpdateCardPlanInput): UpdateCardPlan {
  const tags = parseTags(input.tags)
  const ttsPatch = toCanonicalCardTtsPatch(input.tts ?? {}, input.variant)
  const { sideAHtml, sideBHtml } = toCanonicalCardContent(
    {
      frontHtml: input.frontHtml,
      backHtml: input.backHtml,
    },
    input.variant,
  )
  const { tagsToLink, tagsToUnlink } = diffTags(
    parseTags(input.previousTags),
    tags,
  )

  return {
    cardSetId: input.cardSetId,
    cardSetUpdate: {
      sideAHtml,
      sideBHtml,
      ...buildCardSetTtsUpdateData(ttsPatch),
      updatedAt: now,
    },
    tagsToLink,
    tagsToUnlink,
  }
}

export function planAddCard({
  input,
  now,
  cardSetId,
  cardIds,
}: AddCardPlanInput): AddCardPlan {
  if (cardIds.length !== input.variants.length) {
    throw new Error("Card ids must match the requested variants.")
  }

  const tags = parseTags(input.tags)
  const ttsPatch = toCanonicalCardTtsPatch(input.tts ?? {}, "forward")

  return {
    cardSetId,
    tags,
    cardSetUpdate: {
      sideAHtml: input.frontHtml,
      sideBHtml: input.backHtml,
      ...buildCardSetTtsUpdateData(ttsPatch),
      createdAt: now,
      updatedAt: now,
    },
    cards: input.variants.map((variant, index) => ({
      id: cardIds[index]!,
      variant,
      createdAt: now,
      updatedAt: now,
      ...createInitialSchedule(now),
    })),
  }
}

export function planImportCards({
  backup,
  existingCardSets,
}: ImportCardsPlanInput): ImportCardsPlan {
  const importedCardSets = backup.cardSets.map((cardSet) => ({
    ...cardSet,
    tags: parseTags(cardSet.tags),
  }))
  const existingTagsByCardSetId = new Map(
    existingCardSets.map((cardSet) => [cardSet.id, cardSet.tags]),
  )

  return {
    importedTags: [
      ...new Set(importedCardSets.flatMap((cardSet) => cardSet.tags)),
    ],
    cardSets: importedCardSets.map((cardSet) => ({
      id: cardSet.id,
      tags: cardSet.tags,
      previousTags: existingTagsByCardSetId.get(cardSet.id) ?? [],
      sideAHtml: cardSet.sideAHtml,
      sideBHtml: cardSet.sideBHtml,
      sideATtsLocale: cardSet.sideATtsLocale,
      sideBTtsLocale: cardSet.sideBTtsLocale,
      createdAt: cardSet.createdAt,
      updatedAt: cardSet.updatedAt,
    })),
    cards: importedCardSets.flatMap((cardSet) =>
      cardSet.cards.map((card) => ({
        ...card,
        cardSetId: cardSet.id,
      })),
    ),
  }
}
