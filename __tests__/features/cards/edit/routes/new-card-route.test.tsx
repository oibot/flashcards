const mockUseRouter = jest.fn()

jest.mock("expo-router", () => ({
  useRouter: () => mockUseRouter(),
}))

jest.mock("@/features/cards/edit/screens/edit-card-screen", () => {
  const React = require("react")
  const { Pressable, Text } = require("react-native")

  return function MockEditCardScreen({ onClose }: { onClose: () => void }) {
    return (
      <Pressable
        accessibilityLabel="close-new-card"
        accessibilityRole="button"
        onPress={onClose}
      >
        <Text>close-new-card</Text>
      </Pressable>
    )
  }
})

import { fireEvent, render, screen } from "@testing-library/react-native"

import NewCardRoute from "@/features/cards/edit/routes/new-card-route"

describe("NewCardRoute", () => {
  const canDismiss = jest.fn()
  const dismiss = jest.fn()
  const replace = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ canDismiss, dismiss, replace })
  })

  it("dismisses when the new-card modal has a previous route", () => {
    canDismiss.mockReturnValue(true)

    render(<NewCardRoute />)
    fireEvent.press(screen.getByLabelText("close-new-card"))

    expect(dismiss).toHaveBeenCalledTimes(1)
    expect(replace).not.toHaveBeenCalled()
  })

  it("replaces the route with the cards screen when there is nothing to dismiss", () => {
    canDismiss.mockReturnValue(false)

    render(<NewCardRoute />)
    fireEvent.press(screen.getByLabelText("close-new-card"))

    expect(dismiss).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith("/")
  })
})
