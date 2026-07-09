import type { CardBackupEnvelope } from "@/features/cards/backup/model/card-backup"
import type {
  Card,
  NewCardInput,
  UpdateCardInput,
} from "@/features/cards/model/card"
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
  metadataPersisted: Promise<void>
}

export type CardStore = {
  useCardsQuery: () => CardsQueryState
  useDueCardsQuery: (now?: number) => CardsQueryState
  useTagsQuery: () => TagsQueryState
  exportCards: () => Promise<CardBackupEnvelope>
  importCards: (backup: CardBackupEnvelope) => Promise<void>
  addCard: (input: NewCardInput) => CardSaveResult
  updateCard: (input: UpdateCardInput) => CardSaveResult
  reviewCard: (card: Card, grade: ReviewGrade, reviewedAt?: number) => void
  removeCard: (card: Card) => void
}
