import { useDb } from "@/db/db-context"
import type { CardId } from "@/domain/card"

export function useEditCard(id: CardId | null | undefined) {
  const { cardStore } = useDb()
  const { addCard, updateCard, useCardsQuery } = cardStore
  const { cards, isLoading, error } = useCardsQuery()
  const card = id
    ? (cards.find((currentCard) => currentCard.id === id) ?? null)
    : null

  return {
    card,
    isLoading,
    error,
    addCard,
    updateCard,
  }
}
