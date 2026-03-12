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

export function parseTags(tags: string[] | string) {
  const tagValues = Array.isArray(tags) ? tags : tags.split(",")

  return tagValues
    .map((tag) => tag.trim())
    .filter(
      (tag, index, allTags) => tag.length > 0 && allTags.indexOf(tag) === index,
    )
}
