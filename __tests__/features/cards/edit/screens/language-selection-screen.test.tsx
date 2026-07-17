const mockUseRouter = jest.fn()
const mockUseLocalSearchParams = jest.fn()
const mockUseAudioSelectionDraft = jest.fn()
const mockClearAudioSelectionDraftSide = jest.fn()
const mockSetAudioSelectionDraftCreating = jest.fn()
let mockResolvedLanguage = "en"

jest.mock("expo-router", () => {
  const React = require("react")
  const { Pressable, Text, View } = require("react-native")

  return {
    Stack: {
      Screen({ options }: { options: Record<string, unknown> }) {
        const leftItems =
          typeof options.unstable_headerLeftItems === "function"
            ? options.unstable_headerLeftItems()
            : []
        const rightItems =
          typeof options.unstable_headerRightItems === "function"
            ? options.unstable_headerRightItems()
            : []

        return (
          <View>
            {[...leftItems, ...rightItems].map(
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
    useLocalSearchParams: () => mockUseLocalSearchParams(),
    useRouter: () => mockUseRouter(),
  }
})

jest.mock("expo-symbols", () => {
  const React = require("react")
  const { Text } = require("react-native")

  return {
    SymbolView({ name }: { name: string }) {
      return <Text>{name}</Text>
    },
  }
})

jest.mock("react-i18next", () => ({
  useTranslation: (namespace: string) => {
    if (namespace === "editCard") {
      return {
        i18n: {
          resolvedLanguage: mockResolvedLanguage,
        },
        t: (key: string, params?: { side?: string }) => {
          switch (key) {
            case "languageSelection.title":
              return `Choose Audio Language: ${params?.side ?? ""}`
            case "languageSelection.front":
              return "Front"
            case "languageSelection.back":
              return "Back"
            case "languageSelection.none":
              return "None"
            case "languageSelection.deleteConfirmation.title":
              return "Delete audio?"
            case "languageSelection.deleteConfirmation.message":
              return "Remove saved audio for this side?"
            case "languageSelection.deleteConfirmation.cancel":
              return "Keep audio"
            case "languageSelection.languages.en-US.label":
              return "English"
            case "languageSelection.languages.de-DE.label":
              return "German"
            case "languageSelection.languages.es-ES.label":
              return "Spanish"
            case "languageSelection.languages.fr-FR.label":
              return "French"
            case "languageSelection.languages.pt-BR.label":
              return "Portuguese"
            case "languageSelection.languages.ja-JP.label":
              return "Japanese"
            case "languageSelection.languages.zh-CN.label":
              return "Chinese"
            case "languageSelection.languages.ru-RU.label":
              return "Russian"
            case "languageSelection.languages.th-TH.label":
              return "Thai"
            case "saveCard":
              return "Save Card"
            default:
              return key
          }
        },
      }
    }

    return {
      t: (key: string) => {
        if (key === "cancel") {
          return "Cancel"
        }

        if (key === "delete") {
          return "Delete"
        }

        return key
      },
    }
  },
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
                  caption: {},
                  subheadline: {},
                },
              },
              colors: {
                accent: "#00aa88",
                background: "#ffffff",
                chromeMuted: "#cccccc",
                primary: "#111111",
                secondary: "#666666",
                secondaryBackground: "#f5f5f5",
              },
            },
            {
              insets: {
                bottom: 0,
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
        primary: "#111111",
      },
    },
  }),
}))

jest.mock("@/features/cards/audio/lib/audio-selection-draft", () => ({
  clearAudioSelectionDraftSide: (...args: unknown[]) =>
    mockClearAudioSelectionDraftSide(...args),
  setAudioSelectionDraftCreating: (...args: unknown[]) =>
    mockSetAudioSelectionDraftCreating(...args),
  useAudioSelectionDraft: () => mockUseAudioSelectionDraft(),
}))

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { Alert } from "react-native"

import LanguageSelectionScreen from "@/features/cards/edit/screens/language-selection-screen"

function createDraftState(overrides?: {
  backAssetId?: string | null
  backFileUrl?: string | null
  backLocale?: string | null
  frontAssetId?: string | null
  frontFileUrl?: string | null
  frontLocale?: string | null
}) {
  return {
    front: {
      html: "<p>Hallo</p>",
      locale: overrides?.frontLocale ?? "en-US",
      assetId: overrides?.frontAssetId ?? null,
      fileUrl: overrides?.frontFileUrl ?? null,
      audioText: null,
      isDirty: false,
      status: "idle" as const,
    },
    back: {
      html: "<p>Hello</p>",
      locale: overrides?.backLocale ?? "fr-FR",
      assetId: overrides?.backAssetId ?? null,
      fileUrl: overrides?.backFileUrl ?? null,
      audioText: null,
      isDirty: false,
      status: "idle" as const,
    },
  }
}

describe("LanguageSelectionScreen", () => {
  const dismiss = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockResolvedLanguage = "en"
    mockUseRouter.mockReturnValue({ dismiss })
    mockUseLocalSearchParams.mockReturnValue({ side: "back" })
    mockUseAudioSelectionDraft.mockReturnValue(createDraftState())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("orders the preferred locale first and reflects the selected back-side locale", () => {
    mockResolvedLanguage = "de"

    render(<LanguageSelectionScreen />)

    const labels = screen
      .getAllByText(
        /^(None|German|English|Spanish|French|Portuguese|Japanese|Chinese|Russian|Thai)$/,
      )
      .map((node) => node.props.children)

    expect(labels.slice(0, 3)).toEqual(["None", "German", "English"])
    expect(labels).toContain("Thai")
    expect(screen.getByText("ไทย")).toBeTruthy()
    expect(
      screen.getByRole("button", { name: "French" }).props.accessibilityState,
    ).toEqual({ selected: true })
  })

  it("saves a selected locale for the requested side and dismisses", async () => {
    render(<LanguageSelectionScreen />)

    fireEvent.press(screen.getByRole("button", { name: "German" }))
    fireEvent.press(screen.getByLabelText("Save Card"))

    await waitFor(() => {
      expect(mockSetAudioSelectionDraftCreating).toHaveBeenCalledWith(
        "back",
        "de-DE",
      )
    })
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  it("clears audio for the default front side without confirmation when no asset exists", async () => {
    mockUseLocalSearchParams.mockReturnValue({ side: "sideways" })

    render(<LanguageSelectionScreen />)

    fireEvent.press(screen.getByRole("button", { name: "None" }))
    fireEvent.press(screen.getByLabelText("Save Card"))

    await waitFor(() => {
      expect(mockClearAudioSelectionDraftSide).toHaveBeenCalledWith("front")
    })
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  it("shows delete confirmation before clearing existing audio and clears on confirm", async () => {
    mockUseLocalSearchParams.mockReturnValue({ side: "front" })
    mockUseAudioSelectionDraft.mockReturnValue(
      createDraftState({
        frontFileUrl: "https://audio.example/front.mp3",
      }),
    )
    jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        buttons?.[1]?.onPress?.()
      })

    render(<LanguageSelectionScreen />)

    fireEvent.press(screen.getByRole("button", { name: "None" }))
    fireEvent.press(screen.getByLabelText("Save Card"))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Delete audio?",
        "Remove saved audio for this side?",
        expect.any(Array),
      )
    })
    expect(mockClearAudioSelectionDraftSide).toHaveBeenCalledWith("front")
    expect(dismiss).toHaveBeenCalledTimes(1)
    expect(mockSetAudioSelectionDraftCreating).not.toHaveBeenCalled()
  })
})
