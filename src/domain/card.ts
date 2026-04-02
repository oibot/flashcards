import type { CardState } from "@/domain/card-state"

export type CardId = string

export type Card = {
  id: CardId
  tags: string[]
  frontHtml: string
  backHtml: string
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

export type NewCardInput = {
  tags: string[]
  frontHtml: string
  backHtml: string
}

export type UpdateCardInput = NewCardInput & {
  id: CardId
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
