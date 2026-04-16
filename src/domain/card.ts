import type { CardState } from "@/domain/card-state"

export type CardId = string
export type CardVariant = "forward" | "reverse"

export type CanonicalCardContent = {
  sideAHtml: string
  sideBHtml: string
}

export type VisibleCardContent = {
  frontHtml: string
  backHtml: string
}

export type Card = VisibleCardContent & {
  id: CardId
  cardSetId: string
  variant: CardVariant
  tags: string[]
  createdAt: number
  updatedAt: number
  dueAt: number
  lastReviewedAt: number
  intervalDays: number
  easeFactor: number
  repetition: number
  lapses: number
  state: CardState
}

export type EditableCardInput = VisibleCardContent & {
  tags: string[]
}

export type CardVariants = readonly [CardVariant, ...CardVariant[]]

export type NewCardInput = EditableCardInput & {
  variants: CardVariants
}

export type UpdateCardInput = EditableCardInput & {
  id: CardId
  previousTags: string[]
}

export function isCardVariant(value: unknown): value is CardVariant {
  return value === "forward" || value === "reverse"
}

export function resolveCardContent(
  cardContent: CanonicalCardContent,
  variant: CardVariant,
): VisibleCardContent {
  if (variant === "forward") {
    return {
      frontHtml: cardContent.sideAHtml,
      backHtml: cardContent.sideBHtml,
    }
  }

  return {
    frontHtml: cardContent.sideBHtml,
    backHtml: cardContent.sideAHtml,
  }
}

export function toCanonicalCardContent(
  cardContent: VisibleCardContent,
  variant: CardVariant,
): CanonicalCardContent {
  if (variant === "forward") {
    return {
      sideAHtml: cardContent.frontHtml,
      sideBHtml: cardContent.backHtml,
    }
  }

  return {
    sideAHtml: cardContent.backHtml,
    sideBHtml: cardContent.frontHtml,
  }
}

export function normalizeTagTitle(tag: string) {
  const normalizedWhitespace = tag.trim().replace(/\s+/g, " ")

  if (normalizedWhitespace.length === 0) {
    return ""
  }

  return normalizedWhitespace
    .split(" ")
    .map((part) => {
      const [firstCharacter = "", ...restCharacters] = [...part]

      return (
        firstCharacter.toLocaleUpperCase() +
        restCharacters.join("").toLocaleLowerCase()
      )
    })
    .join(" ")
}

export function parseTags(tags: string[] | string) {
  const tagValues = Array.isArray(tags) ? tags : tags.split(",")

  return tagValues
    .map(normalizeTagTitle)
    .filter(
      (tag, index, allTags) => tag.length > 0 && allTags.indexOf(tag) === index,
    )
}
