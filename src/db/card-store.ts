import type { Card, CardId, NewCardInput, UpdateCardInput } from "@/domain/card"
import type { ReviewGrade } from "@/domain/review-scheduler"

export type CardsQueryState = {
  cards: Card[]
  isLoading: boolean
  error: Error | null
}

export type TagsQueryState = {
  tags: string[]
  isLoading: boolean
  error: Error | null
}

export type CardStore = {
  useCardsQuery: () => CardsQueryState
  useDueCardsQuery: (now?: number) => CardsQueryState
  useTagsQuery: () => TagsQueryState
  addCard: (input: NewCardInput) => Promise<void>
  updateCard: (input: UpdateCardInput) => Promise<void>
  reviewCard: (
    card: Card,
    grade: ReviewGrade,
    reviewedAt?: number,
  ) => Promise<void>
  removeCard: (id: CardId) => Promise<void>
}
