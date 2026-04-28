import { useDb } from "@/features/cards/data/db-context"

export function useCards() {
  const { cardStore } = useDb()
  const { useCardsQuery, addCard, removeCard, reviewCard } = cardStore
  const { cards, isLoading, error } = useCardsQuery()

  return {
    cards,
    isLoading,
    error,
    addCard,
    removeCard,
    reviewCard,
  }
}
