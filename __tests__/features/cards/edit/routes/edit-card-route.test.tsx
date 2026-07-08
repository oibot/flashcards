const mockUseLocalSearchParams = jest.fn()
const mockUseRouter = jest.fn()
const mockUseCard = jest.fn()

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => mockUseRouter(),
}))

jest.mock("react-native-unistyles", () => ({
  StyleSheet: {
    create: (styles: unknown) =>
      typeof styles === "function"
        ? styles({
            typography: { styles: { body: {} } },
            colors: {
              background: "#ffffff",
              secondary: "#666666",
            },
          })
        : styles,
  },
}))

jest.mock("@/features/cards/queries/use-card", () => ({
  useCard: (...args: unknown[]) => mockUseCard(...args),
}))

jest.mock("@/features/cards/edit/screens/edit-card-screen", () => {
  const React = require("react")
  const { Pressable, Text, View } = require("react-native")

  return function MockEditCardScreen({
    initialCard,
    onClose,
  }: {
    initialCard: { id: string }
    onClose: (event?: unknown) => void
  }) {
    return (
      <View>
        <Text testID="edit-card-screen">{initialCard.id}</Text>
        <Pressable
          accessibilityLabel="close-edit-screen"
          accessibilityRole="button"
          onPress={() => onClose({ nativeEvent: {} })}
        >
          <Text>close-edit-screen</Text>
        </Pressable>
      </View>
    )
  }
})

jest.mock("@/shared/ui/loading-screen", () => {
  const React = require("react")
  const { Text } = require("react-native")

  return function MockLoadingScreen() {
    return <Text testID="loading-screen">loading</Text>
  }
})

import { fireEvent, render, screen } from "@testing-library/react-native"

import EditCardRoute from "@/features/cards/edit/routes/edit-card-route"

describe("EditCardRoute", () => {
  const dismiss = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalSearchParams.mockReturnValue({ id: "card-1" })
    mockUseRouter.mockReturnValue({ dismiss })
  })

  it("renders the loading screen while the card query is in flight", () => {
    mockUseCard.mockReturnValue({
      card: null,
      isLoading: true,
      error: null,
    })

    render(<EditCardRoute />)

    expect(screen.getByTestId("loading-screen")).toBeTruthy()
    expect(screen.queryByTestId("edit-card-screen")).toBeNull()
  })

  it("shows the query error when the card cannot be loaded", () => {
    mockUseCard.mockReturnValue({
      card: null,
      isLoading: false,
      error: new Error("Could not load this card."),
    })

    render(<EditCardRoute />)

    expect(screen.getByText("Could not load this card.")).toBeTruthy()
  })

  it("shows the missing-card fallback when no card is returned", () => {
    mockUseCard.mockReturnValue({
      card: null,
      isLoading: false,
      error: null,
    })

    render(<EditCardRoute />)

    expect(screen.getByText("Could not load card.")).toBeTruthy()
  })

  it("renders the hydrated edit screen and closes without passing press events to dismiss", () => {
    mockUseCard.mockReturnValue({
      card: { id: "card-1" },
      isLoading: false,
      error: null,
    })

    render(<EditCardRoute />)

    expect(screen.getByTestId("edit-card-screen").props.children).toBe("card-1")

    fireEvent.press(screen.getByLabelText("close-edit-screen"))

    expect(dismiss).toHaveBeenCalledTimes(1)
    expect(dismiss).toHaveBeenCalledWith()
  })
})
