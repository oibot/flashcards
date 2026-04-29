const mockUseCards = jest.fn()

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      switch (key) {
        case "delete.title":
          return "Delete card?"
        case "delete.message":
          return "Delete this card and related cards?"
        case "delete.cancel":
          return "Cancel"
        case "delete.confirm":
          return "Delete"
        case "delete.error":
          return "Delete failed."
        case "saveErrorTitle":
          return "Review failed."
        default:
          return key
      }
    },
  }),
}))

jest.mock("@/features/cards/queries/use-cards", () => ({
  useCards: () => mockUseCards(),
}))

import { act, renderHook, waitFor } from "@testing-library/react-native"
import { Alert } from "react-native"

import type { Card } from "@/features/cards/model/card"
import { useReviewSession } from "@/features/cards/review/hooks/use-review-session"

type CardsState = {
  cards: Card[]
  error: Error | null
  isLoading: boolean
  removeCard: jest.Mock
  reviewCard: jest.Mock
}

function createCardsState(overrides: Partial<CardsState> = {}): CardsState {
  return {
    cards: [],
    error: null,
    isLoading: false,
    removeCard: jest.fn().mockResolvedValue(undefined),
    reviewCard: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function createReviewCard(overrides: Partial<Card> = {}): Card {
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

describe("useReviewSession", () => {
  let cardsState: CardsState
  let alertSpy: jest.SpiedFunction<typeof Alert.alert>
  let alertButtons: { onPress?: () => void }[] | undefined

  beforeEach(() => {
    jest.clearAllMocks()
    cardsState = createCardsState()
    mockUseCards.mockImplementation(() => cardsState)
    alertButtons = undefined
    alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        alertButtons = buttons as { onPress?: () => void }[] | undefined
      })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("initializes from a seed independently from live query errors", async () => {
    const seedCard = createReviewCard({ id: "seed-card" })
    cardsState = createCardsState({
      error: new Error("Live cards failed."),
      cards: [],
    })

    const { result } = renderHook(() =>
      useReviewSession({ initialSeed: { cards: [seedCard] } }),
    )

    await waitFor(() => {
      expect(result.current.currentCard?.id).toBe("seed-card")
    })
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.progressLabel).toBe("1 / 1")
    expect(result.current.visibleHtml).toBe("<p>Hallo</p>")
    expect(result.current.visibleSide).toBe("front")
  })

  it("initializes from live cards and reports loading, error, or empty-close state", async () => {
    const liveCard = createReviewCard({ id: "live-card" })
    cardsState = createCardsState({
      cards: [liveCard],
    })
    const { result: liveResult } = renderHook(() => useReviewSession())

    await waitFor(() => {
      expect(liveResult.current.currentCard?.id).toBe("live-card")
    })
    expect(liveResult.current.isLoading).toBe(false)

    cardsState = createCardsState({ isLoading: true })
    const { result: loadingResult } = renderHook(() => useReviewSession())

    expect(loadingResult.current.isLoading).toBe(true)

    const error = new Error("Could not load review cards.")
    cardsState = createCardsState({ error })
    const { result: errorResult } = renderHook(() => useReviewSession())

    expect(errorResult.current.error).toBe(error)
    expect(errorResult.current.isLoading).toBe(false)

    cardsState = createCardsState()
    const { result: emptyResult } = renderHook(() => useReviewSession())

    expect(emptyResult.current.shouldClose).toBe(true)
  })

  it("reveals, shows the front, grades cards, and completes the session", async () => {
    const firstCard = createReviewCard({ id: "first-card" })
    const secondCard = createReviewCard({ id: "second-card" })
    cardsState = createCardsState({
      cards: [firstCard, secondCard],
    })
    const { result } = renderHook(() =>
      useReviewSession({ initialSeed: { cards: [firstCard, secondCard] } }),
    )

    await waitFor(() => {
      expect(result.current.currentCard?.id).toBe("first-card")
    })

    act(() => {
      result.current.reveal()
    })

    expect(result.current.visibleSide).toBe("back")
    expect(result.current.visibleHtml).toBe("<p>Hello</p>")

    act(() => {
      result.current.showFront()
    })

    expect(result.current.visibleSide).toBe("front")

    await act(async () => {
      await result.current.grade("good")
    })

    expect(cardsState.reviewCard).toHaveBeenCalledWith(firstCard, "good")
    expect(result.current.currentCard?.id).toBe("second-card")
    expect(result.current.progressLabel).toBe("2 / 2")
    expect(result.current.reviewedCount).toBe(1)
    expect(result.current.visibleSide).toBe("front")

    await act(async () => {
      await result.current.grade("hard")
    })

    expect(cardsState.reviewCard).toHaveBeenCalledWith(secondCard, "hard")
    expect(result.current.isComplete).toBe(true)
    expect(result.current.reviewedCount).toBe(2)
    expect(result.current.visibleSide).toBe("front")
  })

  it("reports grade failures without advancing", async () => {
    const card = createReviewCard({ id: "card-1" })
    cardsState = createCardsState({
      cards: [card],
      reviewCard: jest.fn().mockRejectedValue(new Error("Review crashed.")),
    })
    const { result } = renderHook(() =>
      useReviewSession({ initialSeed: { cards: [card] } }),
    )

    await waitFor(() => {
      expect(result.current.currentCard?.id).toBe("card-1")
    })

    await act(async () => {
      await result.current.grade("again")
    })

    expect(result.current.currentCard?.id).toBe("card-1")
    expect(result.current.isComplete).toBe(false)
    expect(result.current.isMutatingCard).toBe(false)
    expect(result.current.mutationError).toBe("Review crashed.")
  })

  it("ignores grade and delete actions while a review mutation is pending", async () => {
    const card = createReviewCard({ id: "card-1" })
    let resolveReview: () => void = () => undefined
    const pendingReview = new Promise<void>((resolve) => {
      resolveReview = resolve
    })
    cardsState = createCardsState({
      cards: [card],
      reviewCard: jest.fn().mockReturnValue(pendingReview),
    })
    const { result } = renderHook(() =>
      useReviewSession({ initialSeed: { cards: [card] } }),
    )

    await waitFor(() => {
      expect(result.current.currentCard?.id).toBe("card-1")
    })

    let gradePromise: Promise<void> = Promise.resolve()

    act(() => {
      gradePromise = result.current.grade("good")
    })

    await waitFor(() => {
      expect(result.current.isMutatingCard).toBe(true)
    })

    act(() => {
      void result.current.grade("hard")
      result.current.deleteCurrent()
    })

    expect(cardsState.reviewCard).toHaveBeenCalledTimes(1)
    expect(alertSpy).not.toHaveBeenCalled()

    await act(async () => {
      resolveReview()
      await gradePromise
    })
  })

  it("cancels delete confirmation without removing a card", async () => {
    const card = createReviewCard({ id: "card-1" })
    cardsState = createCardsState({
      cards: [card],
    })
    const { result } = renderHook(() =>
      useReviewSession({ initialSeed: { cards: [card] } }),
    )

    await waitFor(() => {
      expect(result.current.currentCard?.id).toBe("card-1")
    })

    act(() => {
      result.current.deleteCurrent()
      alertButtons?.[0]?.onPress?.()
    })

    expect(alertSpy).toHaveBeenCalledWith(
      "Delete card?",
      "Delete this card and related cards?",
      expect.any(Array),
    )
    expect(cardsState.removeCard).not.toHaveBeenCalled()
    expect(result.current.currentCard?.id).toBe("card-1")
  })

  it("deletes the current card set and adjusts the session index", async () => {
    const firstForward = createReviewCard({
      id: "first-forward",
      cardSetId: "set-1",
    })
    const firstReverse = createReviewCard({
      id: "first-reverse",
      cardSetId: "set-1",
      variant: "reverse",
    })
    const second = createReviewCard({
      id: "second",
      cardSetId: "set-2",
    })
    cardsState = createCardsState({
      cards: [firstForward, firstReverse, second],
    })
    const { result } = renderHook(() =>
      useReviewSession({
        initialSeed: { cards: [firstForward, firstReverse, second] },
      }),
    )

    await waitFor(() => {
      expect(result.current.currentCard?.id).toBe("first-forward")
    })

    act(() => {
      result.current.deleteCurrent()
    })

    await act(async () => {
      alertButtons?.[1]?.onPress?.()
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.currentCard?.id).toBe("second")
    })
    expect(cardsState.removeCard).toHaveBeenCalledWith("first-forward")
    expect(result.current.progressLabel).toBe("1 / 1")
    expect(result.current.isComplete).toBe(false)
  })

  it("completes the session after deleting the final card", async () => {
    const card = createReviewCard({ id: "only-card" })
    cardsState = createCardsState({
      cards: [card],
    })
    const { result } = renderHook(() =>
      useReviewSession({ initialSeed: { cards: [card] } }),
    )

    await waitFor(() => {
      expect(result.current.currentCard?.id).toBe("only-card")
    })

    act(() => {
      result.current.deleteCurrent()
    })

    await act(async () => {
      alertButtons?.[1]?.onPress?.()
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true)
    })
    expect(result.current.currentCard).toBeNull()
  })

  it("reports delete failures without removing the current card", async () => {
    const card = createReviewCard({ id: "card-1" })
    cardsState = createCardsState({
      cards: [card],
      removeCard: jest.fn().mockRejectedValue(new Error("Delete crashed.")),
    })
    const { result } = renderHook(() =>
      useReviewSession({ initialSeed: { cards: [card] } }),
    )

    await waitFor(() => {
      expect(result.current.currentCard?.id).toBe("card-1")
    })

    act(() => {
      result.current.deleteCurrent()
    })

    await act(async () => {
      alertButtons?.[1]?.onPress?.()
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.mutationError).toBe("Delete crashed.")
    })
    expect(result.current.currentCard?.id).toBe("card-1")
    expect(result.current.isMutatingCard).toBe(false)
  })

  it("syncs changed live card data into an active session", async () => {
    const card = createReviewCard({
      id: "card-1",
      frontHtml: "<p>Old front</p>",
      updatedAt: 1,
    })
    const updatedCard = createReviewCard({
      id: "card-1",
      frontHtml: "<p>Updated front</p>",
      updatedAt: 2,
    })
    cardsState = createCardsState({
      cards: [card],
    })
    const { result, rerender } = renderHook(() =>
      useReviewSession({ initialSeed: { cards: [card] } }),
    )

    await waitFor(() => {
      expect(result.current.visibleHtml).toBe("<p>Old front</p>")
    })

    cardsState = createCardsState({
      cards: [updatedCard],
    })

    rerender({})

    await waitFor(() => {
      expect(result.current.visibleHtml).toBe("<p>Updated front</p>")
    })
  })
})
