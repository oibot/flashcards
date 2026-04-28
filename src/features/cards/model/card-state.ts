export const CARD_STATES = ["new", "learning", "review", "relearning"] as const

export type CardState = (typeof CARD_STATES)[number]

export function isCardState(value: string): value is CardState {
  return CARD_STATES.includes(value as CardState)
}

export function parseCardState(value?: string): CardState | undefined {
  if (!value) return undefined
  return isCardState(value) ? value : undefined
}
