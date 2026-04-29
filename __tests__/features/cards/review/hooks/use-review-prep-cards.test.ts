const mockUseCards = jest.fn()
const mockUseFocusEffect = jest.fn()

jest.mock("expo-router", () => ({
  useFocusEffect: (...args: unknown[]) => mockUseFocusEffect(...args),
}))

jest.mock("@/features/cards/queries/use-cards", () => ({
  useCards: () => mockUseCards(),
}))

import { act, renderHook } from "@testing-library/react-native"

import { useReviewPrepCards } from "@/features/cards/review/hooks/use-review-prep-cards"

import { createReviewCard } from "../test-utils"

describe("useReviewPrepCards", () => {
  const removeCard = jest.fn()
  const reviewCard = jest.fn()
  let currentNow = 1_000
  let focusEffect: (() => void | (() => void)) | undefined
  let dateNowSpy: jest.SpiedFunction<typeof Date.now>

  beforeEach(() => {
    jest.clearAllMocks()
    currentNow = 1_000
    focusEffect = undefined
    dateNowSpy = jest.spyOn(Date, "now").mockImplementation(() => currentNow)
    mockUseFocusEffect.mockImplementation(
      (effect: () => void | (() => void)) => {
        focusEffect = effect
      },
    )
    mockUseCards.mockReturnValue({
      cards: [],
      error: null,
      isLoading: false,
      removeCard,
      reviewCard,
    })
  })

  afterEach(() => {
    dateNowSpy.mockRestore()
  })

  it("derives sorted due and all-card lists", () => {
    const futureCard = createReviewCard({ id: "future", dueAt: 3_000 })
    const dueCard = createReviewCard({ id: "due", dueAt: 1_000 })
    const overdueCard = createReviewCard({ id: "overdue", dueAt: 500 })
    mockUseCards.mockReturnValue({
      cards: [futureCard, dueCard, overdueCard],
      error: null,
      isLoading: false,
      removeCard,
      reviewCard,
    })
    currentNow = 2_000

    const { result } = renderHook(() => useReviewPrepCards())

    expect(result.current.cards.map((card) => card.id)).toEqual([
      "overdue",
      "due",
    ])
    expect(result.current.dueCardCount).toBe(2)
    expect(result.current.allCardCount).toBe(3)

    let preparedCards = [] as typeof result.current.cards

    act(() => {
      preparedCards = result.current.prepareCards("all")
    })

    expect(preparedCards.map((card) => card.id)).toEqual([
      "overdue",
      "due",
      "future",
    ])
    expect(result.current.cards.map((card) => card.id)).toEqual([
      "overdue",
      "due",
      "future",
    ])
    expect(result.current.preparationKind).toBe("all")
  })

  it("refreshes due cards when the review prep view regains focus", () => {
    mockUseCards.mockReturnValue({
      cards: [
        createReviewCard({ id: "first", dueAt: 1_000 }),
        createReviewCard({ id: "second", dueAt: 2_000 }),
      ],
      error: null,
      isLoading: false,
      removeCard,
      reviewCard,
    })

    const { result } = renderHook(() => useReviewPrepCards())

    expect(result.current.cards.map((card) => card.id)).toEqual(["first"])

    act(() => {
      currentNow = 2_000
      focusEffect?.()
    })

    expect(result.current.cards.map((card) => card.id)).toEqual([
      "first",
      "second",
    ])
    expect(result.current.dueCardCount).toBe(2)
  })

  it("exposes loading and error state from the cards query", () => {
    const error = new Error("Could not load review cards.")
    mockUseCards.mockReturnValue({
      cards: [],
      error,
      isLoading: true,
      removeCard,
      reviewCard,
    })

    const { result } = renderHook(() => useReviewPrepCards())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBe(error)
    expect(result.current.cards).toEqual([])
    expect(result.current.dueCardCount).toBe(0)
    expect(result.current.allCardCount).toBe(0)
  })
})
