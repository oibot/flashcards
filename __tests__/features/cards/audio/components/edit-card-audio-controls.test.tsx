jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === "audioLabel") return "Audio"
      if (key === "previewAudioAccessibilityLabel") return "Preview audio"
      return key
    },
  }),
}))

jest.mock("expo-symbols", () => ({
  SymbolView: () => null,
}))

jest.mock("react-native-unistyles", () => ({
  useUnistyles: () => ({
    theme: {
      colors: {
        accent: "accent",
        secondary: "secondary",
      },
    },
  }),
  StyleSheet: {
    create: (styles: unknown) =>
      typeof styles === "function"
        ? styles({
            colors: {
              accent: "accent",
              chromeMuted: "chrome-muted",
              primary: "primary",
              secondary: "secondary",
              secondaryBackground: "secondary-background",
            },
            typography: {
              styles: {
                subheadline: {},
              },
            },
          })
        : styles,
  },
}))

jest.mock("@/shared/ui/icon-button", () => {
  const React = require("react")
  const { Pressable, Text } = require("react-native")

  function MockAudioButton({
    accessibilityLabel,
    disabled,
    onPress,
  }: {
    accessibilityLabel: string
    disabled?: boolean
    onPress: () => void
  }) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
      >
        <Text>{accessibilityLabel}</Text>
      </Pressable>
    )
  }

  return {
    IconButtonAudio: MockAudioButton,
    IconButtonAudioNone: MockAudioButton,
    IconButtonAudioSelected: MockAudioButton,
    IconButtonAudioStale: MockAudioButton,
  }
})

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { Alert } from "react-native"

import EditCardAudioControls from "@/features/cards/audio/components/edit-card-audio-controls"
import type { EditCardAudioSideState } from "@/features/cards/audio/hooks/use-edit-card-audio"

function createAudioState(
  overrides: Partial<EditCardAudioSideState> = {},
): EditCardAudioSideState {
  return {
    valueLabel: "German",
    isActionDisabled: false,
    isPreviewDisabled: false,
    isPreviewLoading: false,
    previewState: "ready",
    setHtml: jest.fn(),
    playPreview: jest.fn().mockResolvedValue({ ok: true }),
    ...overrides,
  }
}

describe("EditCardAudioControls", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("opens audio configuration", () => {
    const onConfigure = jest.fn()

    render(
      <EditCardAudioControls
        audio={createAudioState()}
        onConfigure={onConfigure}
      />,
    )

    fireEvent.press(screen.getByText("Audio"))

    expect(onConfigure).toHaveBeenCalledTimes(1)
    expect(screen.getByText("German")).toBeTruthy()
  })

  it("plays the preview and shows failures", async () => {
    const playPreview = jest.fn().mockResolvedValue({
      ok: false,
      message: "Audio unavailable",
    })
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn())

    render(
      <EditCardAudioControls
        audio={createAudioState({ playPreview })}
        onConfigure={jest.fn()}
      />,
    )

    fireEvent.press(screen.getByLabelText("Preview audio"))

    await waitFor(() => {
      expect(playPreview).toHaveBeenCalledTimes(1)
      expect(Alert.alert).toHaveBeenCalledWith("Audio unavailable")
    })
  })
})
