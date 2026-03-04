import { id } from "@instantdb/react-native"

import type { CardStore } from "@/db/card-store"
import { db } from "@/db/instant/db"
import { toTimestamp } from "@/db/instant/instant-utils"
import type { Card, NewCardInput } from "@/domain/card"

const toCard = (card: {
  id: string
  tag: string
  frontHtml: string
  backHtml: string
  createdAt: number | string
  updatedAt: number | string
}): Card => ({
  id: card.id,
  tag: card.tag,
  frontHtml: card.frontHtml,
  backHtml: card.backHtml,
  createdAt: toTimestamp(card.createdAt),
  updatedAt: toTimestamp(card.updatedAt),
})

const normalizeError = (error: unknown) => {
  if (!error) return null
  if (error instanceof Error) return error
  return new Error(String(error))
}

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
      }),
    )
  }

  const removeCard = async (cardId: string) => {
    await db.transact(db.tx.cards[cardId].delete())
  }

  return {
    useCardsQuery,
    addCard,
    removeCard,
  }
}
