import type { ReactNode } from "react"
import { createContext, use, useState } from "react"

import type { CardStore } from "@/features/cards/data/card-store"
import { createInstantCardStore } from "@/features/cards/data/instant/instant-card-store"

type DbContextValue = {
  cardStore: CardStore
}

const DbContext = createContext<DbContextValue | null>(null)

export function DbProvider({ children }: { children: ReactNode }) {
  const [cardStore] = useState(() => createInstantCardStore())

  return <DbContext value={{ cardStore }}>{children}</DbContext>
}

export function useDb() {
  const context = use(DbContext)
  if (!context) {
    throw new Error("useDb must be used within DbProvider")
  }
  return context
}
