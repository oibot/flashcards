import {
  type CardSetTtsPatch,
  toCanonicalCardTtsPatch,
} from "@/features/cards/audio/model/card-audio"
import {
  type Card,
  parseTags,
  toCanonicalCardContent,
  type UpdateCardInput,
} from "@/features/cards/model/card"
import { hasOwn } from "@/shared/lib/object"

type TagDiff = {
  tagsToLink: string[]
  tagsToUnlink: string[]
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
  currentCard: Pick<Card, "cardSetId" | "variant" | "tags">
  input: UpdateCardInput
  now: number
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
  currentCard,
  input,
  now,
}: UpdateCardPlanInput): UpdateCardPlan {
  const tags = parseTags(input.tags)
  const ttsPatch = toCanonicalCardTtsPatch(input.tts ?? {}, currentCard.variant)
  const { sideAHtml, sideBHtml } = toCanonicalCardContent(
    {
      frontHtml: input.frontHtml,
      backHtml: input.backHtml,
    },
    currentCard.variant,
  )
  const { tagsToLink, tagsToUnlink } = diffTags(
    parseTags(currentCard.tags),
    tags,
  )

  return {
    cardSetId: currentCard.cardSetId,
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
