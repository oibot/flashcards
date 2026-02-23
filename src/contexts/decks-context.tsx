import type { ReactNode } from "react"
import { createContext, use, useState } from "react"
import { decks as initialDecks, type Deck } from "@/data/decks"

type NewDeckInput = {
  title: string
  description?: string
  cards?: number
}

type DecksContextValue = {
  decks: Deck[]
  addDeck: (input: NewDeckInput) => void
}

const DecksContext = createContext<DecksContextValue | null>(null)

const createDeckId = (title: string) => {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  const base = slug.length > 0 ? slug : "deck"
  return `${base}-${Date.now().toString(36)}`
}

export function DecksProvider({ children }: { children: ReactNode }) {
  const [decks, setDecks] = useState<Deck[]>(initialDecks)

  const addDeck = (input: NewDeckInput) => {
    const title = input.title.trim()
    if (!title) return

    const description = input.description?.trim() ?? ""
    const cards = input.cards ?? 0

    const nextDeck: Deck = {
      id: createDeckId(title),
      title,
      cards,
      description,
    }

    setDecks((prev) => [nextDeck, ...prev])
  }

  return <DecksContext value={{ decks, addDeck }}>{children}</DecksContext>
}

export function useDecks() {
  const context = use(DecksContext)
  if (!context) {
    throw new Error("useDecks must be used within DecksProvider")
  }
  return context
}
