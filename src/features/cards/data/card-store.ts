import type {
  Card,
  CardId,
  NewCardInput,
  UpdateCardInput,
} from "@/features/cards/model/card"
import type { CardBackupEnvelope } from "@/features/cards/model/card-backup"
import type { ReviewGrade } from "@/features/cards/model/review-scheduler"

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

export type CardSaveResult = {
  cardSetId: string
}

export type CardStore = {
  useCardsQuery: () => CardsQueryState
  useDueCardsQuery: (now?: number) => CardsQueryState
  useTagsQuery: () => TagsQueryState
  exportCards: () => Promise<CardBackupEnvelope>
  importCards: (backup: CardBackupEnvelope) => Promise<void>
  addCard: (input: NewCardInput) => Promise<CardSaveResult>
  updateCard: (input: UpdateCardInput) => Promise<CardSaveResult>
  reviewCard: (
    card: Card,
    grade: ReviewGrade,
    reviewedAt?: number,
  ) => Promise<void>
  removeCard: (id: CardId) => Promise<void>
}
