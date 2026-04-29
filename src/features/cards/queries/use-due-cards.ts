import { useDb } from "@/features/cards/data/db-context"

export function useDueCards(now: number) {
  const { cardStore } = useDb()
  const { useDueCardsQuery, removeCard, reviewCard } = cardStore
  const { cards, isLoading, error } = useDueCardsQuery(now)

  return {
    cards,
    isLoading,
    error,
    removeCard,
    reviewCard,
  }
}
