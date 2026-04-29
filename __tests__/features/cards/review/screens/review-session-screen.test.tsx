const mockUseReviewSession = jest.fn()
const mockConsumePendingReviewSessionSeed = jest.fn()

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      switch (key) {
        case "loading":
          return "Loading review session"
        case "loadErrorTitle":
          return "Could not load review session"
        default:
          return key
      }
    },
  }),
}))

jest.mock("react-native-unistyles", () => ({
  StyleSheet: {
    create: (styles: unknown) =>
      typeof styles === "function"
        ? styles({
            typography: {
              styles: {
                body: {},
                title3: {},
              },
            },
            colors: {
              accent: "#00aa88",
              background: "#ffffff",
              primary: "#111111",
              secondary: "#666666",
            },
          })
        : styles,
  },
  useUnistyles: () => ({
    theme: {
      colors: {
        accent: "#00aa88",
      },
    },
  }),
}))

jest.mock("@/features/cards/review/hooks/use-review-session", () => ({
  useReviewSession: (...args: unknown[]) => mockUseReviewSession(...args),
}))

jest.mock("@/features/cards/review/lib/review-session-seed-store", () => ({
  consumePendingReviewSessionSeed: () => mockConsumePendingReviewSessionSeed(),
}))

jest.mock("@/features/cards/review/components/review-session-header", () => {
  const React = require("react")
  const { Pressable, Text, View } = require("react-native")

  return function MockReviewSessionHeader({
    onClose,
    onDelete,
    onEdit,
    onShowFront,
  }: {
    onClose: () => void
    onDelete: () => void
    onEdit: () => void
    onShowFront?: () => void
  }) {
    return (
      <View>
        <Pressable
          accessibilityLabel="close-review"
          accessibilityRole="button"
          onPress={onClose}
        >
          <Text>close-review</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="delete-review-card"
          accessibilityRole="button"
          onPress={onDelete}
        >
          <Text>delete-review-card</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="edit-review-card"
          accessibilityRole="button"
          onPress={onEdit}
        >
          <Text>edit-review-card</Text>
        </Pressable>
        {onShowFront ? (
          <Pressable
            accessibilityLabel="show-front"
            accessibilityRole="button"
            onPress={onShowFront}
          >
            <Text>show-front</Text>
          </Pressable>
        ) : null}
      </View>
    )
  }
})

jest.mock("@/features/cards/review/components/active-review-state", () => {
  const React = require("react")
  const { Pressable, Text, View } = require("react-native")

  return function MockActiveReviewState({
    cardId,
    onGrade,
    onReveal,
  }: {
    cardId: string
    onGrade: (grade: "again" | "hard" | "good") => void
    onReveal: () => void
  }) {
    return (
      <View>
        <Text testID="active-review">{cardId}</Text>
        <Pressable
          accessibilityLabel="reveal-answer"
          accessibilityRole="button"
          onPress={onReveal}
        >
          <Text>reveal-answer</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="grade-good"
          accessibilityRole="button"
          onPress={() => onGrade("good")}
        >
          <Text>grade-good</Text>
        </Pressable>
      </View>
    )
  }
})

jest.mock("@/features/cards/review/components/completed-review-state", () => {
  const React = require("react")
  const { Pressable, Text, View } = require("react-native")

  return function MockCompletedReviewState({
    cardCount,
    onClose,
  }: {
    cardCount: number
    onClose: () => void
  }) {
    return (
      <View>
        <Text testID="completed-review">{cardCount}</Text>
        <Pressable
          accessibilityLabel="close-completed-review"
          accessibilityRole="button"
          onPress={onClose}
        >
          <Text>close-completed-review</Text>
        </Pressable>
      </View>
    )
  }
})

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"

import type { Card } from "@/features/cards/model/card"
import ReviewSessionScreen from "@/features/cards/review/screens/review-session-screen"

function createSessionState(overrides: Record<string, unknown> = {}) {
  return {
    currentCard: null,
    deleteCurrent: jest.fn(),
    error: null,
    grade: jest.fn(),
    isComplete: false,
    isLoading: false,
    isMutatingCard: false,
    mutationError: null,
    progressLabel: "0 / 0",
    reveal: jest.fn(),
    reviewedCount: 0,
    shouldClose: false,
    showFront: jest.fn(),
    visibleHtml: "",
    visibleSide: "front" as const,
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

describe("ReviewSessionScreen", () => {
  const onClose = jest.fn()
  const onEditCard = jest.fn()
  const seed = {
    cards: [createReviewCard({ id: "seed-card" })],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockConsumePendingReviewSessionSeed.mockReturnValue(seed)
    mockUseReviewSession.mockReturnValue(createSessionState())
  })

  function renderScreen() {
    return render(
      <ReviewSessionScreen onClose={onClose} onEditCard={onEditCard} />,
    )
  }

  it("consumes the pending seed and renders loading, error, and should-close states", async () => {
    mockUseReviewSession.mockReturnValueOnce(
      createSessionState({ isLoading: true }),
    )

    const { rerender } = renderScreen()

    expect(mockUseReviewSession).toHaveBeenCalledWith({ initialSeed: seed })
    expect(screen.getByText("Loading review session")).toBeTruthy()

    mockUseReviewSession.mockReturnValueOnce(
      createSessionState({
        error: new Error("Load failed."),
      }),
    )

    rerender(<ReviewSessionScreen onClose={onClose} onEditCard={onEditCard} />)

    expect(screen.getByText("Could not load review session")).toBeTruthy()
    expect(screen.getByText("Load failed.")).toBeTruthy()

    mockUseReviewSession.mockReturnValueOnce(
      createSessionState({ shouldClose: true }),
    )

    rerender(<ReviewSessionScreen onClose={onClose} onEditCard={onEditCard} />)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it("routes active session callbacks through child components and header", () => {
    const session = createSessionState({
      currentCard: createReviewCard({ id: "card-1" }),
      visibleHtml: "<p>Hello</p>",
      visibleSide: "back" as const,
    })
    mockUseReviewSession.mockReturnValue(session)

    renderScreen()

    expect(screen.getByTestId("active-review").props.children).toBe("card-1")

    fireEvent.press(screen.getByLabelText("reveal-answer"))
    fireEvent.press(screen.getByLabelText("grade-good"))
    fireEvent.press(screen.getByLabelText("show-front"))
    fireEvent.press(screen.getByLabelText("edit-review-card"))
    fireEvent.press(screen.getByLabelText("delete-review-card"))
    fireEvent.press(screen.getByLabelText("close-review"))

    expect(session.reveal).toHaveBeenCalledTimes(1)
    expect(session.grade).toHaveBeenCalledWith("good")
    expect(session.showFront).toHaveBeenCalledTimes(1)
    expect(onEditCard).toHaveBeenCalledWith("card-1")
    expect(session.deleteCurrent).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("renders completed state and routes close and edit callbacks", () => {
    mockUseReviewSession.mockReturnValue(
      createSessionState({
        currentCard: createReviewCard({ id: "card-1" }),
        isComplete: true,
        reviewedCount: 3,
      }),
    )

    renderScreen()

    expect(screen.getByTestId("completed-review").props.children).toBe(3)

    fireEvent.press(screen.getByLabelText("close-completed-review"))
    fireEvent.press(screen.getByLabelText("edit-review-card"))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onEditCard).toHaveBeenCalledWith("card-1")
  })
})
