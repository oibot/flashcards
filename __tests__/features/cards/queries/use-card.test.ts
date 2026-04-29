const mockUseDb = jest.fn()

jest.mock("@/features/cards/data/db-context", () => ({
  useDb: () => mockUseDb(),
}))

import { renderHook } from "@testing-library/react-native"

import type { Card } from "@/features/cards/model/card"
import { useCard } from "@/features/cards/queries/use-card"

function createCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "card-1",
    cardSetId: "set-1",
    variant: "forward",
    tags: ["German"],
    frontHtml: "<p>Hallo</p>",
    backHtml: "<p>Hello</p>",
    frontTtsLocale: undefined,
    backTtsLocale: undefined,
    frontHasSound: false,
    backHasSound: false,
    createdAt: 1,
    updatedAt: 2,
    dueAt: 3,
    lastReviewedAt: 4,
    intervalDays: 5,
    easeFactor: 2.5,
    repetition: 1,
    lapses: 0,
    state: "review",
    ...overrides,
  }
}

describe("useCard", () => {
  const matchingCard = createCard({ id: "card-1" })
  const otherCard = createCard({ id: "card-2" })
  const error = new Error("Could not load card.")
  const cardStore = {
    updateCard: jest.fn(),
    useCardsQuery: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    cardStore.useCardsQuery.mockReturnValue({
      cards: [matchingCard, otherCard],
      error,
      isLoading: true,
    })
    mockUseDb.mockReturnValue({ cardStore })
  })

  it("returns the matching card for the provided id", () => {
    const { result } = renderHook(() => useCard("card-1"))

    expect(result.current.card).toBe(matchingCard)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBe(error)
    expect(result.current.updateCard).toBe(cardStore.updateCard)
  })

  it("returns null when the provided id does not match a card", () => {
    const { result } = renderHook(() => useCard("missing-card"))

    expect(result.current.card).toBeNull()
  })

  it("returns null for null or undefined ids", () => {
    const nullResult = renderHook(() => useCard(null)).result
    const undefinedResult = renderHook(() => useCard(undefined)).result

    expect(nullResult.current.card).toBeNull()
    expect(undefinedResult.current.card).toBeNull()
  })
})
