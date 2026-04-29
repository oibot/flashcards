const mockUseDb = jest.fn()

jest.mock("@/features/cards/data/db-context", () => ({
  useDb: () => mockUseDb(),
}))

import { renderHook } from "@testing-library/react-native"

import type { Card } from "@/features/cards/model/card"
import { useCards } from "@/features/cards/queries/use-cards"

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

describe("useCards", () => {
  const cards = [createCard()]
  const error = new Error("Could not load cards.")
  const cardStore = {
    addCard: jest.fn(),
    removeCard: jest.fn(),
    reviewCard: jest.fn(),
    useCardsQuery: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    cardStore.useCardsQuery.mockReturnValue({
      cards,
      error,
      isLoading: true,
    })
    mockUseDb.mockReturnValue({ cardStore })
  })

  it("forwards cards query state and card actions", () => {
    const { result } = renderHook(() => useCards())

    expect(result.current).toEqual({
      cards,
      isLoading: true,
      error,
      addCard: cardStore.addCard,
      removeCard: cardStore.removeCard,
      reviewCard: cardStore.reviewCard,
    })
    expect(cardStore.useCardsQuery).toHaveBeenCalledTimes(1)
  })
})
