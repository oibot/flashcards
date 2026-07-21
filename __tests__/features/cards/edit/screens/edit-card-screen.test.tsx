const mockPush = jest.fn()
const mockUseEditCard = jest.fn()
const mockUseEditCardAudio = jest.fn()
const mockUseEditCardForm = jest.fn()

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      switch (key) {
        case "audioLabel":
          return "Audio"
        case "previewAudioAccessibilityLabel":
          return "Preview audio"
        case "frontLabel":
          return "Front"
        case "backLabel":
          return "Back"
        case "discard.title":
          return "Discard changes?"
        case "discard.message":
          return "Your changes will be lost."
        case "discard.cancel":
          return "Cancel"
        case "discard.confirm":
          return "Discard"
        case "oppositeDirection.label":
          return "Add reverse card"
        case "oppositeDirection.description":
          return "Create both directions"
        default:
          return key
      }
    },
  }),
}))

jest.mock("react-native-keyboard-controller", () => {
  const React = require("react")
  const { View } = require("react-native")

  function MockKeyboardToolbar({
    children,
    enabled,
  }: {
    children: React.ReactNode
    enabled?: boolean
  }) {
    return (
      <View
        accessibilityLabel={enabled ? "toolbar-enabled" : "toolbar-disabled"}
      >
        {children}
      </View>
    )
  }

  MockKeyboardToolbar.Content = function MockKeyboardToolbarContent({
    children,
  }: {
    children: React.ReactNode
  }) {
    return <View>{children}</View>
  }

  MockKeyboardToolbar.Done = function MockKeyboardToolbarDone() {
    return null
  }

  return {
    KeyboardAwareScrollView({ children }: { children: React.ReactNode }) {
      return <View>{children}</View>
    },
    KeyboardToolbar: MockKeyboardToolbar,
  }
})

jest.mock("react-native-unistyles", () => ({
  withUnistyles: (Component: unknown) => Component,
  StyleSheet: {
    create: (styles: unknown) =>
      typeof styles === "function"
        ? styles({
            typography: {
              styles: {
                subheadline: {},
              },
            },
            colors: {
              background: "#ffffff",
            },
          })
        : styles,
  },
}))

jest.mock("@/features/cards/edit/hooks/use-edit-card", () => ({
  useEditCard: (...args: unknown[]) => mockUseEditCard(...args),
}))

jest.mock("@/features/cards/audio/hooks/use-edit-card-audio", () => ({
  useEditCardAudio: (...args: unknown[]) => mockUseEditCardAudio(...args),
}))

jest.mock("@/features/cards/edit/hooks/use-edit-card-form", () => ({
  useEditCardForm: (...args: unknown[]) => mockUseEditCardForm(...args),
}))

jest.mock("@/features/cards/edit/components/edit-card-header", () => {
  const React = require("react")
  const { Pressable, Text, View } = require("react-native")

  return function MockEditCardHeader({
    onAddAnother,
    onClose,
    onSave,
  }: {
    onAddAnother?: () => void
    onClose: () => void
    onSave: () => void
  }) {
    return (
      <View>
        <Pressable
          accessibilityLabel="close-card"
          accessibilityRole="button"
          onPress={onClose}
        >
          <Text>close-card</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="save-card"
          accessibilityRole="button"
          onPress={onSave}
        >
          <Text>save-card</Text>
        </Pressable>
        {onAddAnother ? (
          <Pressable
            accessibilityLabel="add-another-card"
            accessibilityRole="button"
            onPress={onAddAnother}
          >
            <Text>add-another-card</Text>
          </Pressable>
        ) : null}
      </View>
    )
  }
})

jest.mock("@/features/cards/edit/components/card-side-field", () => {
  const React = require("react")
  const { Pressable, Text, View } = require("react-native")

  return function MockCardSideField({
    footer,
    label,
    onFocus,
  }: {
    footer?: React.ReactNode
    label: string
    onFocus: () => void
  }) {
    return (
      <View>
        <Text>{label}</Text>
        <Pressable
          accessibilityLabel={`${label}-focus`}
          accessibilityRole="button"
          onPress={onFocus}
        >
          <Text>{label}-focus</Text>
        </Pressable>
        {footer}
      </View>
    )
  }
})

jest.mock("@/features/cards/audio/components/edit-card-audio-controls", () => {
  const React = require("react")
  const { Pressable, Text, View } = require("react-native")

  return function MockEditCardAudioControls({
    audio,
    onConfigure,
  }: {
    audio: {
      playPreview: () => void
      valueLabel: string
    }
    onConfigure: () => void
  }) {
    const side = audio.valueLabel.startsWith("Front") ? "Front" : "Back"

    return (
      <View>
        <Pressable
          accessibilityLabel={`${side}-audio-action`}
          accessibilityRole="button"
          onPress={onConfigure}
        >
          <Text>{side}-audio-action</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`${side}-audio-preview`}
          accessibilityRole="button"
          onPress={audio.playPreview}
        >
          <Text>{side}-audio-preview</Text>
        </Pressable>
      </View>
    )
  }
})

jest.mock("@/features/cards/edit/components/opposite-direction-toggle", () => {
  const React = require("react")
  const { Pressable, Text } = require("react-native")

  return function MockOppositeDirectionToggle({
    onValueChange,
    value,
  }: {
    onValueChange: (value: boolean) => void
    value: boolean
  }) {
    return (
      <Pressable
        accessibilityLabel="toggle-opposite-direction"
        accessibilityRole="switch"
        onPress={() => onValueChange(!value)}
      >
        <Text>{value ? "on" : "off"}</Text>
      </Pressable>
    )
  }
})

jest.mock("@/shared/ui/tag-input", () => {
  const React = require("react")
  const { Text, View } = require("react-native")

  return {
    TagInput: React.forwardRef(function MockTagInput(
      { tags }: { tags: string[] },
      _ref: unknown,
    ) {
      return (
        <View>
          <Text testID="tag-input">{tags.join(",")}</Text>
        </View>
      )
    }),
  }
})

jest.mock("@/shared/ui/tags-menu", () => {
  return function MockTagsMenu() {
    return null
  }
})

jest.mock("@/shared/ui/toolbar", () => {
  return function MockToolbar() {
    return null
  }
})

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { Alert } from "react-native"

import EditCardScreen from "@/features/cards/edit/screens/edit-card-screen"
import type { Card } from "@/features/cards/model/card"
import { featureFlags } from "@/shared/config/feature-flags"

const mockFeatureFlags = featureFlags as { audioCreation: boolean }

type DraftOverride = {
  backHtml?: string
  frontHtml?: string
  hasOppositeDirection?: boolean
  tags?: string[]
}

function createInitialCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "card-1",
    cardSetId: "set-1",
    variant: "forward",
    tags: ["German"],
    frontHtml: "<p>Hallo</p>",
    backHtml: "<p>Hello</p>",
    frontTtsLocale: undefined,
    backTtsLocale: undefined,
    frontHasSound: false,
    backHasSound: false,
    createdAt: 1,
    updatedAt: 2,
    dueAt: 3,
    lastReviewedAt: 4,
    intervalDays: 5,
    easeFactor: 2.5,
    repetition: 1,
    lapses: 0,
    state: "review",
    ...overrides,
  }
}

function createAudioMock() {
  return {
    front: {
      isActionDisabled: false,
      isPreviewDisabled: true,
      isPreviewLoading: false,
      playPreview: jest.fn().mockResolvedValue({ ok: true }),
      previewState: "none" as const,
      setHtml: jest.fn(),
      valueLabel: "Front audio",
    },
    back: {
      isActionDisabled: false,
      isPreviewDisabled: true,
      isPreviewLoading: false,
      playPreview: jest.fn().mockResolvedValue({ ok: true }),
      previewState: "none" as const,
      setHtml: jest.fn(),
      valueLabel: "Back audio",
    },
    clearError: jest.fn(),
    error: null as { id: number; message: string } | null,
    getPersistedSelection: jest.fn().mockReturnValue({
      front: {
        locale: "de-DE",
        assetId: "asset-front",
      },
    }),
    persistCardAudio: jest.fn().mockResolvedValue({ ok: true }),
    resetDraft: jest.fn(),
  }
}

function createFormMock(draftOverrides: DraftOverride = {}) {
  const draft = {
    tags: ["German", "Travel"],
    frontHtml: "<p>Visible front</p>",
    backHtml: "<p>Visible back</p>",
    hasOppositeDirection: true,
    ...draftOverrides,
  }

  return {
    activeStyles: {
      bold: false,
      italic: false,
      underline: false,
      strikeThrough: false,
      h1: false,
      h2: false,
      h3: false,
    },
    availableTags: ["Verbs"],
    backRef: { current: { blur: jest.fn() } },
    currentStylesState: null,
    frontRef: { current: { blur: jest.fn() } },
    getDraft: jest.fn().mockResolvedValue(draft),
    handleAddTag: jest.fn(),
    handleEditorFocus: jest.fn(),
    handleEditorStateChange: jest.fn(),
    handleToggleStyle: jest.fn(),
    hasOppositeDirection: draft.hasOppositeDirection,
    hasUnsavedChanges: jest.fn().mockResolvedValue(false),
    resetForm: jest.fn(),
    setHasOppositeDirection: jest.fn(),
    setTags: jest.fn(),
    tagInputRef: { current: null },
    tags: draft.tags,
  }
}

describe("EditCardScreen", () => {
  const addCard = jest.fn()
  const updateCard = jest.fn()
  const onClose = jest.fn()
  let audioMock: ReturnType<typeof createAudioMock>
  let formMock: ReturnType<typeof createFormMock>

  beforeEach(() => {
    jest.clearAllMocks()
    mockFeatureFlags.audioCreation = true
    audioMock = createAudioMock()
    formMock = createFormMock()
    mockUseEditCard.mockReturnValue({
      addCard,
      updateCard,
    })
    mockUseEditCardAudio.mockImplementation(
      ({ enabled }: { enabled?: boolean }) => {
        audioMock.getPersistedSelection.mockReturnValue(
          enabled === false
            ? {}
            : {
                front: {
                  locale: "de-DE",
                  assetId: "asset-front",
                },
              },
        )
        return audioMock
      },
    )
    mockUseEditCardForm.mockReturnValue(formMock)
    addCard.mockReturnValue({
      cardSetId: "set-new",
      metadataPersisted: Promise.resolve(),
    })
    updateCard.mockReturnValue({
      cardSetId: "set-existing",
      metadataPersisted: Promise.resolve(),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("saves a new card with both variants when opposite direction is enabled", async () => {
    render(<EditCardScreen onClose={onClose} />)

    fireEvent.press(screen.getByLabelText("save-card"))

    await waitFor(() => {
      expect(addCard).toHaveBeenCalledWith({
        tags: ["German", "Travel"],
        frontHtml: "<p>Visible front</p>",
        backHtml: "<p>Visible back</p>",
        tts: {
          front: {
            locale: "de-DE",
            assetId: "asset-front",
          },
        },
        variants: ["forward", "reverse"],
      })
    })
    expect(audioMock.persistCardAudio).toHaveBeenCalledWith("set-new")
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(updateCard).not.toHaveBeenCalled()
  })

  it("saves an existing card through the update flow", async () => {
    const initialCard = createInitialCard()

    render(<EditCardScreen initialCard={initialCard} onClose={onClose} />)

    fireEvent.press(screen.getByLabelText("save-card"))

    await waitFor(() => {
      expect(updateCard).toHaveBeenCalledWith({
        id: "card-1",
        cardSetId: "set-1",
        previousTags: ["German"],
        variant: "forward",
        tags: ["German", "Travel"],
        frontHtml: "<p>Visible front</p>",
        backHtml: "<p>Visible back</p>",
        tts: {
          front: {
            locale: "de-DE",
            assetId: "asset-front",
          },
        },
      })
    })
    expect(audioMock.persistCardAudio).toHaveBeenCalledWith("set-existing")
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(addCard).not.toHaveBeenCalled()
  })

  it("hides and omits audio authoring when the feature is disabled", async () => {
    mockFeatureFlags.audioCreation = false

    render(<EditCardScreen onClose={onClose} />)

    expect(screen.queryByLabelText("Front-audio-action")).toBeNull()
    expect(screen.queryByLabelText("Front-audio-preview")).toBeNull()
    expect(screen.queryByLabelText("Back-audio-action")).toBeNull()
    expect(screen.queryByLabelText("Back-audio-preview")).toBeNull()

    fireEvent.press(screen.getByLabelText("save-card"))

    await waitFor(() => {
      expect(addCard).toHaveBeenCalledWith({
        tags: ["German", "Travel"],
        frontHtml: "<p>Visible front</p>",
        backHtml: "<p>Visible back</p>",
        tts: {},
        variants: ["forward", "reverse"],
      })
    })
    expect(audioMock.getPersistedSelection).toHaveBeenCalledTimes(1)
    expect(audioMock.persistCardAudio).not.toHaveBeenCalled()
  })

  it("preserves existing audio metadata by omitting the patch when disabled", async () => {
    mockFeatureFlags.audioCreation = false
    const initialCard = createInitialCard({
      frontTtsLocale: "de-DE",
      frontHasSound: true,
    })

    render(<EditCardScreen initialCard={initialCard} onClose={onClose} />)

    fireEvent.press(screen.getByLabelText("save-card"))

    await waitFor(() => {
      expect(updateCard).toHaveBeenCalledWith({
        id: "card-1",
        cardSetId: "set-1",
        previousTags: ["German"],
        variant: "forward",
        tags: ["German", "Travel"],
        frontHtml: "<p>Visible front</p>",
        backHtml: "<p>Visible back</p>",
        tts: {},
      })
    })
    expect(audioMock.getPersistedSelection).toHaveBeenCalledTimes(1)
    expect(audioMock.persistCardAudio).not.toHaveBeenCalled()
  })

  it("adds another card, then resets the audio draft and form without closing", async () => {
    render(<EditCardScreen onClose={onClose} />)

    fireEvent.press(screen.getByLabelText("add-another-card"))

    await waitFor(() => {
      expect(addCard).toHaveBeenCalledWith({
        tags: ["German", "Travel"],
        frontHtml: "<p>Visible front</p>",
        backHtml: "<p>Visible back</p>",
        tts: {
          front: {
            locale: "de-DE",
            assetId: "asset-front",
          },
        },
        variants: ["forward", "reverse"],
      })
    })
    expect(audioMock.persistCardAudio).toHaveBeenCalledWith("set-new")
    expect(audioMock.resetDraft).toHaveBeenCalledTimes(1)
    expect(formMock.resetForm).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it("shows an alert when audio persistence fails after saving", async () => {
    audioMock.persistCardAudio.mockResolvedValue({
      ok: false,
      message: "HTTP 500: Attach failed",
    })
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn())

    render(<EditCardScreen onClose={onClose} />)

    fireEvent.press(screen.getByLabelText("save-card"))

    await waitFor(() => {
      expect(addCard).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("HTTP 500: Attach failed")
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("shows and clears background audio errors from the hook", async () => {
    audioMock.error = {
      id: 1,
      message: "HTTP 502: TTS provider failed",
    }
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn())

    render(<EditCardScreen onClose={onClose} />)

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("HTTP 502: TTS provider failed")
    })
    expect(audioMock.clearError).toHaveBeenCalledTimes(1)
  })

  it("ignores invalid save attempts when either card side has no meaningful html", async () => {
    formMock = createFormMock({
      frontHtml: "",
      backHtml: "<p>Visible back</p>",
    })
    mockUseEditCardForm.mockReturnValue(formMock)

    render(<EditCardScreen onClose={onClose} />)

    fireEvent.press(screen.getByLabelText("save-card"))

    await waitFor(() => {
      expect(formMock.getDraft).toHaveBeenCalledTimes(1)
    })
    expect(addCard).not.toHaveBeenCalled()
    expect(updateCard).not.toHaveBeenCalled()
    expect(audioMock.persistCardAudio).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it("closes immediately when there are no unsaved changes", async () => {
    render(<EditCardScreen onClose={onClose} />)

    fireEvent.press(screen.getByLabelText("close-card"))

    await waitFor(() => {
      expect(formMock.hasUnsavedChanges).toHaveBeenCalledTimes(1)
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("shows discard confirmation for unsaved changes and closes on confirm", async () => {
    formMock = createFormMock()
    formMock.hasUnsavedChanges.mockResolvedValue(true)
    mockUseEditCardForm.mockReturnValue(formMock)
    jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        buttons?.[1]?.onPress?.()
      })

    render(<EditCardScreen onClose={onClose} />)

    fireEvent.press(screen.getByLabelText("close-card"))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Discard changes?",
        "Your changes will be lost.",
        expect.any(Array),
      )
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
