import { useDb } from "@/db/db-context"

export function useCards() {
  const { cardStore } = useDb()
  const { useCardsQuery, addCard } = cardStore
  const { cards, isLoading, error } = useCardsQuery()

  return {
    cards,
    isLoading,
    error,
    addCard,
  }
}
