import { id } from "@instantdb/react-native"

import type { CardStore } from "@/db/card-store"
import { db } from "@/db/instant/db"
import { normalizeError, toCard } from "@/db/instant/instant-utils"
import { type Card, type NewCardInput, parseTags } from "@/domain/card"
import {
  createInitialSchedule,
  type ReviewGrade,
  scheduleCardReview,
} from "@/domain/review-scheduler"

export const createInstantCardStore = (): CardStore => {
  const useCardsQuery = () => {
    const { isLoading, error, data } = db.useQuery({ cards: { tags: {} } })
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
    const tags = parseTags(input.tags)
    const cardId = id()
    const now = Date.now()
    const existingTags =
      tags.length > 0
        ? (
            await db.queryOnce({
              tags: {
                $: {
                  where: {
                    title: { $in: tags },
                  },
                },
              },
            })
          ).data.tags
        : []

    const existingTagIdByTitle = new Map(
      existingTags.map((tag) => [tag.title, tag.id]),
    )
    const missingTags = tags.filter((tag) => !existingTagIdByTitle.has(tag))
    const newTagIdByTitle = new Map(missingTags.map((tag) => [tag, id()]))
    const tagIds = tags.flatMap((tag) => {
      const tagId = existingTagIdByTitle.get(tag) ?? newTagIdByTitle.get(tag)
      return tagId ? [tagId] : []
    })

    const cardTransaction = db.tx.cards[cardId].update({
      frontHtml: input.frontHtml,
      backHtml: input.backHtml,
      createdAt: now,
      updatedAt: now,
      ...createInitialSchedule(now),
    })

    await db.transact([
      ...missingTags.map((tag) =>
        db.tx.tags[newTagIdByTitle.get(tag)!].create({ title: tag }),
      ),
      tagIds.length > 0
        ? cardTransaction.link({ tags: tagIds })
        : cardTransaction,
    ])
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
