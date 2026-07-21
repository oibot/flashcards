jest.mock("expo-router", () => {
  const React = require("react")
  const { Text } = require("react-native")

  return {
    Redirect({ href }: { href: string }) {
      return <Text accessibilityLabel="redirect-target">{href}</Text>
    },
  }
})

jest.mock("@/features/cards/edit/screens/language-selection-screen", () => {
  const React = require("react")
  const { Text } = require("react-native")

  return function MockLanguageSelectionScreen() {
    return <Text>Language selection</Text>
  }
})

import { render, screen } from "@testing-library/react-native"

import LanguageSelectionRoute from "@/features/cards/edit/routes/language-selection-route"
import { featureFlags } from "@/shared/config/feature-flags"

const mockFeatureFlags = featureFlags as { audioCreation: boolean }

describe("LanguageSelectionRoute", () => {
  beforeEach(() => {
    mockFeatureFlags.audioCreation = false
  })

  it("redirects when audio creation is disabled", () => {
    render(<LanguageSelectionRoute />)

    expect(screen.getByLabelText("redirect-target")).toHaveTextContent("/")
    expect(screen.queryByText("Language selection")).toBeNull()
  })

  it("renders language selection when audio creation is enabled", () => {
    mockFeatureFlags.audioCreation = true

    render(<LanguageSelectionRoute />)

    expect(screen.getByText("Language selection")).toBeTruthy()
    expect(screen.queryByLabelText("redirect-target")).toBeNull()
  })
})
