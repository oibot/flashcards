import type { Deck, DeckId, NewDeckInput } from "@/domain/deck"

export type DecksQueryState = {
  decks: Deck[]
  isLoading: boolean
  error: Error | null
}

export type DeckStore = {
  useDecksQuery: () => DecksQueryState
  addDeck: (input: NewDeckInput) => Promise<void>
  removeDeck: (id: DeckId) => Promise<void>
}
