import type { ReactNode } from "react"
import { createContext, use, useState } from "react"
import type { DeckStore } from "@/db/deck-store"
import { createInstantDeckStore } from "@/db/instant/instant-deck-store"

type DbContextValue = {
  deckStore: DeckStore
}

const DbContext = createContext<DbContextValue | null>(null)

export function DbProvider({ children }: { children: ReactNode }) {
  const [deckStore] = useState(() => createInstantDeckStore())

  return <DbContext value={{ deckStore }}>{children}</DbContext>
}

export function useDb() {
  const context = use(DbContext)
  if (!context) {
    throw new Error("useDb must be used within DbProvider")
  }
  return context
}
