export type CardId = string

export type Card = {
  id: CardId
  tag: string
  frontHtml: string
  backHtml: string
  createdAt: number
  updatedAt: number
}

export type NewCardInput = {
  tag: string
  frontHtml: string
  backHtml: string
}
