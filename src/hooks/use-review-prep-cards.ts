import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"

import type { ReviewPreparationKind } from "@/domain/review-session"
import { useCards } from "@/hooks/use-cards"

const byDueDateAscending = (
  left: { dueAt: number },
  right: { dueAt: number },
) => left.dueAt - right.dueAt

export function useReviewPrepCards(
  initialPreparationKind: ReviewPreparationKind = "due",
) {
  const { cards, error, isLoading } = useCards()
  const [preparationKind, setPreparationKind] = useState<ReviewPreparationKind>(
    initialPreparationKind,
  )
  const [reviewNow, setReviewNow] = useState(() => Date.now())

  const allCards = useMemo(() => {
    return [...cards].sort(byDueDateAscending)
  }, [cards])

  const dueCards = useMemo(() => {
    return allCards.filter((card) => card.dueAt <= reviewNow)
  }, [allCards, reviewNow])

  const cardsForPreparationKind = useCallback(
    (kind: ReviewPreparationKind) => {
      return kind === "due" ? dueCards : allCards
    },
    [allCards, dueCards],
  )

  useFocusEffect(
    useCallback(() => {
      setReviewNow(Date.now())
    }, []),
  )

  return {
    cards: cardsForPreparationKind(preparationKind),
    allCardCount: allCards.length,
    dueCardCount: dueCards.length,
    error,
    isLoading,
    preparationKind,
    prepareCards: (kind: ReviewPreparationKind) => {
      setPreparationKind(kind)
      return cardsForPreparationKind(kind)
    },
    setPreparationKind,
  }
}
