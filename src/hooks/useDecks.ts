import { useDb } from "@/db/db-context"

export function useDecks() {
  const { deckStore } = useDb()
  const { useDecksQuery, addDeck, removeDeck } = deckStore
  const { decks, isLoading, error } = useDecksQuery()

  return {
    decks,
    isLoading,
    error,
    addDeck,
    removeDeck,
  }
}
