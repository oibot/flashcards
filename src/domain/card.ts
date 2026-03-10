import type { CardState } from "@/domain/card-state"

export type CardId = string

export type Card = {
  id: CardId
  tag: string
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
  tag: string
  frontHtml: string
  backHtml: string
}
