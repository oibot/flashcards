const mockUseRouter = jest.fn()

jest.mock("expo-router", () => ({
  useRouter: () => mockUseRouter(),
}))

jest.mock("@/features/cards/review/screens/review-session-screen", () => {
  const React = require("react")
  const { Pressable, Text, View } = require("react-native")

  return function MockReviewSessionScreen({
    onClose,
    onEditCard,
  }: {
    onClose: () => void
    onEditCard: (cardId: string) => void
  }) {
    return (
      <View>
        <Pressable
          accessibilityLabel="close-review-session"
          accessibilityRole="button"
          onPress={onClose}
        >
          <Text>close-review-session</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="edit-review-card"
          accessibilityRole="button"
          onPress={() => onEditCard("card-1")}
        >
          <Text>edit-review-card</Text>
        </Pressable>
      </View>
    )
  }
})

import { fireEvent, render, screen } from "@testing-library/react-native"

import ReviewSessionRoute from "@/features/cards/review/routes/review-session-route"

describe("ReviewSessionRoute", () => {
  const dismiss = jest.fn()
  const push = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ dismiss, push })
  })

  it("routes close and edit-card callbacks", () => {
    render(<ReviewSessionRoute />)

    fireEvent.press(screen.getByLabelText("close-review-session"))
    fireEvent.press(screen.getByLabelText("edit-review-card"))

    expect(dismiss).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith({
      pathname: "/edit-card/[id]",
      params: {
        id: "card-1",
      },
    })
  })
})
