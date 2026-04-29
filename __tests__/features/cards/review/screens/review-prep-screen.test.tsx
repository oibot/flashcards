const mockUseReviewPrepCards = jest.fn()
const mockSetPendingReviewSessionSeed = jest.fn()

jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => {
  const React = require("react")
  const { Text } = require("react-native")

  return function MockMaterialCommunityIcons({ name }: { name: string }) {
    return <Text>{name}</Text>
  }
})

jest.mock("expo-router", () => {
  const React = require("react")
  const { Pressable, Text, View } = require("react-native")

  return {
    Stack: {
      Screen({ options }: { options: Record<string, unknown> }) {
        const rightItems =
          typeof options.unstable_headerRightItems === "function"
            ? options.unstable_headerRightItems()
            : []

        return (
          <View>
            {rightItems.map(
              (
                item: {
                  label: string
                  onPress: () => void
                },
                index: number,
              ) => (
                <Pressable
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                  key={`${item.label}-${index}`}
                  onPress={item.onPress}
                >
                  <Text>{item.label}</Text>
                </Pressable>
              ),
            )}
          </View>
        )
      },
    },
  }
})

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      switch (key) {
        case "title":
          return "Review"
        case "loading":
          return "Loading review cards"
        case "loadError":
          return "Could not load review cards"
        case "dueCount":
          return `${options?.count ?? 0} cards due`
        case "emptyState":
          return "No cards due"
        case "startReview":
          return "Start review"
        case "startAllReviews":
          return "Review all"
        case "newCardAccessibilityLabel":
          return "New card"
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
        ? styles(
            {
              typography: {
                styles: {
                  body: {},
                  footnote: {},
                  headline: {},
                  subheadline: {},
                  title3: {},
                },
              },
              colors: {
                accent: "#00aa88",
                background: "#ffffff",
                chromeMuted: "#cccccc",
                primary: "#111111",
                secondary: "#666666",
                secondaryBackground: "#f5f5f5",
                shadowSoft: "#00000022",
              },
            },
            {
              insets: {
                bottom: 0,
                right: 0,
              },
            },
          )
        : styles,
  },
  useUnistyles: () => ({
    theme: {
      colors: {
        accent: "#00aa88",
        background: "#ffffff",
      },
    },
  }),
}))

jest.mock("@/features/cards/review/hooks/use-review-prep-cards", () => ({
  useReviewPrepCards: () => mockUseReviewPrepCards(),
}))

jest.mock("@/features/cards/review/lib/review-session-seed-store", () => ({
  setPendingReviewSessionSeed: (...args: unknown[]) =>
    mockSetPendingReviewSessionSeed(...args),
}))

jest.mock("@/shared/ui/icon-button", () => {
  const React = require("react")
  const { Pressable, Text } = require("react-native")

  return {
    IconButtonPlus({
      accessibilityLabel,
      onPress,
    }: {
      accessibilityLabel: string
      onPress: () => void
    }) {
      return (
        <Pressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          onPress={onPress}
        >
          <Text>{accessibilityLabel}</Text>
        </Pressable>
      )
    },
  }
})

import { fireEvent, render, screen } from "@testing-library/react-native"

import ReviewPrepScreen from "@/features/cards/review/screens/review-prep-screen"

import { createReviewCard } from "../test-utils"

describe("ReviewPrepScreen", () => {
  const onNewCard = jest.fn()
  const onReviewAllStart = jest.fn()
  const onReviewStart = jest.fn()
  const dueCards = [createReviewCard({ id: "due-card" })]
  const allCards = [
    createReviewCard({ id: "due-card" }),
    createReviewCard({ id: "future-card", dueAt: 10_000 }),
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseReviewPrepCards.mockReturnValue({
      allCardCount: allCards.length,
      dueCardCount: dueCards.length,
      error: null,
      isLoading: false,
      prepareCards: jest.fn((kind: "due" | "all") =>
        kind === "due" ? dueCards : allCards,
      ),
    })
  })

  function renderScreen() {
    return render(
      <ReviewPrepScreen
        onNewCard={onNewCard}
        onReviewAllStart={onReviewAllStart}
        onReviewStart={onReviewStart}
      />,
    )
  }

  it("shows loading, error, and empty states", () => {
    mockUseReviewPrepCards.mockReturnValueOnce({
      allCardCount: 0,
      dueCardCount: 0,
      error: null,
      isLoading: true,
      prepareCards: jest.fn(),
    })

    const { rerender } = renderScreen()

    expect(screen.getByText("Loading review cards")).toBeTruthy()

    mockUseReviewPrepCards.mockReturnValueOnce({
      allCardCount: 0,
      dueCardCount: 0,
      error: new Error("Load failed"),
      isLoading: false,
      prepareCards: jest.fn(),
    })

    rerender(
      <ReviewPrepScreen
        onNewCard={onNewCard}
        onReviewAllStart={onReviewAllStart}
        onReviewStart={onReviewStart}
      />,
    )

    expect(screen.getByText("Could not load review cards")).toBeTruthy()

    mockUseReviewPrepCards.mockReturnValueOnce({
      allCardCount: 0,
      dueCardCount: 0,
      error: null,
      isLoading: false,
      prepareCards: jest.fn(),
    })

    rerender(
      <ReviewPrepScreen
        onNewCard={onNewCard}
        onReviewAllStart={onReviewAllStart}
        onReviewStart={onReviewStart}
      />,
    )

    expect(screen.getByText("No cards due")).toBeTruthy()
  })

  it("stores due and all-card seeds before starting review sessions", () => {
    renderScreen()

    fireEvent.press(screen.getByText("Start review"))

    expect(mockSetPendingReviewSessionSeed).toHaveBeenCalledWith({
      cards: dueCards,
    })
    expect(onReviewStart).toHaveBeenCalledTimes(1)

    fireEvent.press(screen.getByText("Review all"))

    expect(mockSetPendingReviewSessionSeed).toHaveBeenLastCalledWith({
      cards: allCards,
    })
    expect(onReviewAllStart).toHaveBeenCalledTimes(1)
  })

  it("does not start disabled review actions", () => {
    mockUseReviewPrepCards.mockReturnValue({
      allCardCount: 0,
      dueCardCount: 0,
      error: null,
      isLoading: false,
      prepareCards: jest.fn(),
    })
    renderScreen()

    fireEvent.press(screen.getByText("Start review"))
    fireEvent.press(screen.getByText("Review all"))

    expect(mockSetPendingReviewSessionSeed).not.toHaveBeenCalled()
    expect(onReviewStart).not.toHaveBeenCalled()
    expect(onReviewAllStart).not.toHaveBeenCalled()
  })

  it("routes new-card actions through the provided callback", () => {
    renderScreen()

    fireEvent.press(screen.getAllByLabelText("New card")[0])

    expect(onNewCard).toHaveBeenCalledTimes(1)
  })
})
