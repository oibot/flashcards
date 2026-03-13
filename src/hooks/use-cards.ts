import { useDb } from "@/db/db-context"

export function useCards() {
  const { cardStore } = useDb()
  const { useCardsQuery, addCard, reviewCard, removeCard } = cardStore
  const { cards, isLoading, error } = useCardsQuery()

  return {
    cards,
    isLoading,
    error,
    addCard,
    reviewCard,
    removeCard,
  }
}
