import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"

import { useDb } from "@/db/db-context"

export function useDueCards(now?: number) {
  const { cardStore } = useDb()
  const { useDueCardsQuery, removeCard, reviewCard } = cardStore
  const [queryNow, setQueryNow] = useState(() => Date.now())

  useFocusEffect(
    useCallback(() => {
      if (now !== undefined) {
        return
      }

      setQueryNow(Date.now())
    }, [now]),
  )

  const { cards, isLoading, error } = useDueCardsQuery(now ?? queryNow)

  return {
    cards,
    isLoading,
    error,
    removeCard,
    reviewCard,
  }
}
