export type DeckId = string

export type Deck = {
  id: DeckId
  title: string
  description?: string
  createdAt: number
  updatedAt: number
  cardCount: number | null
}

export type NewDeckInput = {
  title: string
  description?: string
}
