import { useState } from "react"

import { useDb } from "@/db/db-context"

export function useDueCards(now?: number) {
  const { cardStore } = useDb()
  const { useDueCardsQuery, removeCard, reviewCard } = cardStore
  const [initialNow] = useState(() => Date.now())
  const { cards, isLoading, error } = useDueCardsQuery(now ?? initialNow)

  return {
    cards,
    isLoading,
    error,
    removeCard,
    reviewCard,
  }
}
