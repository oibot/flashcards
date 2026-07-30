type HeaderItem = {
  disabled?: boolean
  label: string
  onPress: () => void
}

let mockScreenOptions: {
  unstable_headerRightItems?: () => HeaderItem[]
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
        accent: "#00aa88",
        primary: "#111111",
      },
    },
  }),
}))

import { render } from "@testing-library/react-native"

import EditCardHeader from "@/features/cards/edit/components/edit-card-header"

describe("EditCardHeader", () => {
  beforeEach(() => {
    mockScreenOptions = {}
  })

  it("disables save and add-another for an incomplete new card", () => {
    render(
      <EditCardHeader
        isSubmissionEnabled={false}
        onAddAnother={jest.fn()}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />,
    )

    expect(mockScreenOptions.unstable_headerRightItems?.()).toEqual([
      expect.objectContaining({ label: "addAnotherCard", disabled: true }),
      expect.objectContaining({ label: "saveCard", disabled: true }),
    ])
  })

  it("enables save for a complete existing card and hides add-another", () => {
    render(
      <EditCardHeader
        isEditing
        isSubmissionEnabled
        onClose={jest.fn()}
        onSave={jest.fn()}
      />,
    )

    expect(mockScreenOptions.unstable_headerRightItems?.()).toEqual([
      expect.objectContaining({ label: "saveCard", disabled: false }),
    ])
  })
})
