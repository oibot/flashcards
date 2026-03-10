import { useDb } from "@/db/db-context"

export function useDueCards(now = Date.now()) {
  const { cardStore } = useDb()
  const { useDueCardsQuery, reviewCard } = cardStore
  const { cards, isLoading, error } = useDueCardsQuery(now)

  return {
    cards,
    isLoading,
    error,
    reviewCard,
  }
}
