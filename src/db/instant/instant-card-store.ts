import { id } from "@instantdb/react-native"

import type { CardStore } from "@/db/card-store"
import { db } from "@/db/instant/db"
import { normalizeError, toCard } from "@/db/instant/instant-utils"
import type { Card, NewCardInput } from "@/domain/card"
import {
  createInitialSchedule,
  type ReviewGrade,
  scheduleCardReview,
} from "@/domain/review-scheduler"

export const createInstantCardStore = (): CardStore => {
  const useCardsQuery = () => {
    const { isLoading, error, data } = db.useQuery({ cards: {} })
    const cards = data?.cards?.map(toCard) ?? []

    return {
      cards,
      isLoading,
      error: normalizeError(error),
    }
  }

  const useDueCardsQuery = (now = Date.now()) => {
    const { cards, isLoading, error } = useCardsQuery()
    const dueCards = cards
      .filter((card) => card.dueAt <= now)
      .sort((left, right) => left.dueAt - right.dueAt)

    return {
      cards: dueCards,
      isLoading,
      error,
    }
  }

  const addCard = async (input: NewCardInput) => {
    const tag = input.tag.trim()
    if (!tag) return

    const now = Date.now()

    await db.transact(
      db.tx.cards[id()].update({
        tag,
        frontHtml: input.frontHtml,
        backHtml: input.backHtml,
        createdAt: now,
        updatedAt: now,
        ...createInitialSchedule(now),
      }),
    )
  }

  const reviewCard = async (
    card: Card,
    grade: ReviewGrade,
    reviewedAt = Date.now(),
  ) => {
    await db.transact(
      db.tx.cards[card.id].update({
        ...scheduleCardReview(card, grade, reviewedAt),
        updatedAt: reviewedAt,
      }),
    )
  }

  const removeCard = async (cardId: string) => {
    await db.transact(db.tx.cards[cardId].delete())
  }

  return {
    useCardsQuery,
    useDueCardsQuery,
    addCard,
    reviewCard,
    removeCard,
  }
}
