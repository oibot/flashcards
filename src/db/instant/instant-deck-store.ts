import { id } from "@instantdb/react-native"
import type { Deck, NewDeckInput } from "@/domain/deck"
import type { DeckStore } from "@/db/deck-store"
import { db } from "@/db/instant/db"

const toTimestamp = (value: number | string) => {
  if (typeof value === "number") return value
  const asNumber = Number(value)
  if (!Number.isNaN(asNumber)) return asNumber
  return Date.parse(value)
}

const toDeck = (deck: {
  id: string
  title: string
  description?: string | null
  createdAt: number | string
  updatedAt: number | string
}): Deck => ({
  id: deck.id,
  title: deck.title,
  description: deck.description ?? undefined,
  createdAt: toTimestamp(deck.createdAt),
  updatedAt: toTimestamp(deck.updatedAt),
  cardCount: null,
})

const normalizeError = (error: unknown) => {
  if (!error) return null
  if (error instanceof Error) return error
  return new Error(String(error))
}

export const createInstantDeckStore = (): DeckStore => {
  const useDecksQuery = () => {
    const { isLoading, error, data } = db.useQuery({ decks: {} })
    const decks = data?.decks?.map(toDeck) ?? []

    return {
      decks,
      isLoading,
      error: normalizeError(error),
    }
  }

  const addDeck = async (input: NewDeckInput) => {
    const title = input.title.trim()
    if (!title) return

    const description = input.description?.trim()
    const now = Date.now()

    const payload: {
      title: string
      description?: string
      createdAt: number
      updatedAt: number
    } = {
      title,
      createdAt: now,
      updatedAt: now,
    }

    if (description) {
      payload.description = description
    }

    await db.transact(db.tx.decks[id()].update(payload))
  }

  const removeDeck = async (deckId: string) => {
    await db.transact(db.tx.decks[deckId].delete())
  }

  return {
    useDecksQuery,
    addDeck,
    removeDeck,
  }
}
