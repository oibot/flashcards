const mockUseDb = jest.fn()

jest.mock("@/features/cards/data/db-context", () => ({
  useDb: () => mockUseDb(),
}))

import { renderHook } from "@testing-library/react-native"

import type { Card } from "@/features/cards/model/card"
import { useDueCards } from "@/features/cards/queries/use-due-cards"

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

describe("useDueCards", () => {
  const cards = [createCard()]
  const error = new Error("Could not load due cards.")
  const cardStore = {
    removeCard: jest.fn(),
    reviewCard: jest.fn(),
    useDueCardsQuery: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    cardStore.useDueCardsQuery.mockReturnValue({
      cards,
      error,
      isLoading: true,
    })
    mockUseDb.mockReturnValue({ cardStore })
  })

  it("uses the caller-provided timestamp and forwards query state and actions", () => {
    const { result, rerender } = renderHook(
      ({ now }: { now: number }) => useDueCards(now),
      {
        initialProps: { now: 5_000 },
      },
    )

    expect(cardStore.useDueCardsQuery).toHaveBeenLastCalledWith(5_000)
    expect(result.current).toEqual({
      cards,
      isLoading: true,
      error,
      removeCard: cardStore.removeCard,
      reviewCard: cardStore.reviewCard,
    })

    rerender({ now: 6_000 })

    expect(cardStore.useDueCardsQuery).toHaveBeenLastCalledWith(6_000)
  })
})
