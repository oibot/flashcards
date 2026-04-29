const mockUseRouter = jest.fn()

jest.mock("expo-router", () => ({
  useRouter: () => mockUseRouter(),
}))

jest.mock("@/features/cards/review/screens/review-prep-screen", () => {
  const React = require("react")
  const { Pressable, Text, View } = require("react-native")

  return function MockReviewPrepScreen({
    onNewCard,
    onReviewAllStart,
    onReviewStart,
  }: {
    onNewCard: () => void
    onReviewAllStart: () => void
    onReviewStart: () => void
  }) {
    return (
      <View>
        <Pressable
          accessibilityLabel="new-card"
          accessibilityRole="button"
          onPress={onNewCard}
        >
          <Text>new-card</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="start-review"
          accessibilityRole="button"
          onPress={onReviewStart}
        >
          <Text>start-review</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="start-review-all"
          accessibilityRole="button"
          onPress={onReviewAllStart}
        >
          <Text>start-review-all</Text>
        </Pressable>
      </View>
    )
  }
})

import { fireEvent, render, screen } from "@testing-library/react-native"

import ReviewPrepRoute from "@/features/cards/review/routes/review-prep-route"

describe("ReviewPrepRoute", () => {
  const push = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ push })
  })

  it("routes new-card and review-start callbacks", () => {
    render(<ReviewPrepRoute />)

    fireEvent.press(screen.getByLabelText("new-card"))
    fireEvent.press(screen.getByLabelText("start-review"))
    fireEvent.press(screen.getByLabelText("start-review-all"))

    expect(push).toHaveBeenNthCalledWith(1, "/new-card")
    expect(push).toHaveBeenNthCalledWith(2, "/review-session")
    expect(push).toHaveBeenNthCalledWith(3, "/review-session")
  })
})
