import type { Card, CardId, NewCardInput } from "@/domain/card"

export type CardsQueryState = {
  cards: Card[]
  isLoading: boolean
  error: Error | null
}

export type CardStore = {
  useCardsQuery: () => CardsQueryState
  addCard: (input: NewCardInput) => Promise<void>
  removeCard: (id: CardId) => Promise<void>
}
