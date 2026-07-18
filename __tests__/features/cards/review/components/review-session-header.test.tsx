let mockScreenOptions: {
  unstable_headerLeftItems?: () => { label: string; onPress: () => void }[]
  unstable_headerRightItems?: () => { label: string; onPress: () => void }[]
} = {}

jest.mock("expo-router", () => ({
  Stack: {
    Screen({ options }: { options: typeof mockScreenOptions }) {
      mockScreenOptions = options
      return null
    },
  },
}))

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

jest.mock("react-native-unistyles", () => ({
  useUnistyles: () => ({
    theme: {
      colors: {
        background: "#ffffff",
        destructive: "#ff0000",
        primary: "#000000",
      },
    },
  }),
}))

import { render } from "@testing-library/react-native"

import ReviewSessionHeader from "@/features/cards/review/components/review-session-header"

describe("ReviewSessionHeader", () => {
  const onClose = jest.fn()
  const onDelete = jest.fn()
  const onEdit = jest.fn()
  const onShowFront = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockScreenOptions = {}
  })

  it("shows card actions during an active review", () => {
    render(
      <ReviewSessionHeader
        isComplete={false}
        isMutating={false}
        onClose={onClose}
        onDelete={onDelete}
        onEdit={onEdit}
        onShowFront={onShowFront}
        visibleSide="back"
      />,
    )

    expect(mockScreenOptions.unstable_headerLeftItems?.()).toEqual([
      expect.objectContaining({ label: "closeAccessibilityLabel" }),
    ])
    expect(mockScreenOptions.unstable_headerRightItems?.()).toEqual([
      expect.objectContaining({ label: "showFrontAccessibilityLabel" }),
      expect.objectContaining({ label: "editAccessibilityLabel" }),
      expect.objectContaining({ label: "delete.accessibilityLabel" }),
    ])
  })

  it("explicitly clears card actions after the review is complete", () => {
    render(
      <ReviewSessionHeader
        isComplete
        isMutating={false}
        onClose={onClose}
        onDelete={onDelete}
        onEdit={onEdit}
        onShowFront={onShowFront}
        visibleSide="back"
      />,
    )

    expect(mockScreenOptions.unstable_headerLeftItems?.()).toEqual([
      expect.objectContaining({ label: "closeAccessibilityLabel" }),
    ])
    expect(mockScreenOptions.unstable_headerRightItems).toEqual(
      expect.any(Function),
    )
    expect(mockScreenOptions.unstable_headerRightItems?.()).toEqual([])
  })
})
