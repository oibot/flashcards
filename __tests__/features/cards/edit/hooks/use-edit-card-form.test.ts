const mockUseEditCardEditors = jest.fn()
const mockUseEditCardTags = jest.fn()

jest.mock("@/features/cards/edit/hooks/use-edit-card-editors", () => ({
  useEditCardEditors: () => mockUseEditCardEditors(),
}))

jest.mock("@/features/cards/edit/hooks/use-edit-card-tags", () => ({
  useEditCardTags: () => mockUseEditCardTags(),
}))

import { act, renderHook, waitFor } from "@testing-library/react-native"

import { useEditCardForm } from "@/features/cards/edit/hooks/use-edit-card-form"
import type { Card } from "@/features/cards/model/card"

type ConfigureFormMockOptions = {
  backHtml?: string
  commitInputResult?: string[]
  frontHtml?: string
  hasPendingInput?: boolean
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

function configureFormMocks({
  backHtml = "<p>Hello</p>",
  commitInputResult,
  frontHtml = "<p>Hallo</p>",
  hasPendingInput = false,
  tags = ["German"],
}: ConfigureFormMockOptions = {}) {
  const frontEditor = {
    getHTML: jest.fn().mockResolvedValue(frontHtml),
    setValue: jest.fn(),
  }
  const backEditor = {
    getHTML: jest.fn().mockResolvedValue(backHtml),
    setValue: jest.fn(),
  }
  const resetEditors = jest.fn()
  const resetTags = jest.fn()
  const setTags = jest.fn()
  const tagInputRef = {
    current: {
      clear: jest.fn(),
      commitInput: jest.fn().mockReturnValue(commitInputResult ?? tags),
      focus: jest.fn(),
      hasPendingInput: jest.fn().mockReturnValue(hasPendingInput),
    },
  }

  mockUseEditCardEditors.mockReturnValue({
    backRef: { current: backEditor },
    currentStylesState: null,
    frontRef: { current: frontEditor },
    handleEditorFocus: jest.fn(),
    handleEditorStateChange: jest.fn(),
    handleSetAlignment: jest.fn(),
    handleSetTextSize: jest.fn(),
    handleToggleInlineStyle: jest.fn(),
    resetEditors,
  })
  mockUseEditCardTags.mockReturnValue({
    availableTags: ["Travel"],
    handleAddTag: jest.fn(),
    resetTags,
    setTags,
    tagInputRef,
    tags,
  })

  return {
    backEditor,
    frontEditor,
    resetEditors,
    resetTags,
    setTags,
    tagInputRef,
  }
}

describe("useEditCardForm", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("hydrates the initial card into the tag state and editor refs only once per card id", async () => {
    const initialCard = createInitialCard()
    const { frontEditor, backEditor, setTags } = configureFormMocks({
      tags: [],
      frontHtml: "",
      backHtml: "",
    })
    const { rerender } = renderHook(
      ({ card }: { card?: Card }) => useEditCardForm({ initialCard: card }),
      {
        initialProps: { card: initialCard },
      },
    )

    await waitFor(() => {
      expect(setTags).toHaveBeenCalledWith(["German"])
    })
    expect(frontEditor.setValue).toHaveBeenCalledWith("<p>Hallo</p>")
    expect(backEditor.setValue).toHaveBeenCalledWith("<p>Hello</p>")

    rerender({ card: initialCard })

    expect(setTags).toHaveBeenCalledTimes(1)
    expect(frontEditor.setValue).toHaveBeenCalledTimes(1)
    expect(backEditor.setValue).toHaveBeenCalledTimes(1)
  })

  it("reports no unsaved changes when the draft matches the initial card", async () => {
    const initialCard = createInitialCard()
    configureFormMocks({
      tags: ["German"],
      frontHtml: "<p>Hallo</p>",
      backHtml: "<p>Hello</p>",
    })
    const { result } = renderHook(() => useEditCardForm({ initialCard }))

    await expect(result.current.hasUnsavedChanges()).resolves.toBe(false)
  })

  it("reports unsaved changes for a new card when opposite direction is enabled", async () => {
    configureFormMocks({
      tags: [],
      frontHtml: "",
      backHtml: "",
    })
    const { result } = renderHook(() => useEditCardForm())

    act(() => {
      result.current.setHasOppositeDirection(true)
    })

    await expect(result.current.hasUnsavedChanges()).resolves.toBe(true)
  })

  it("reports unsaved changes when there is pending tag input", async () => {
    const initialCard = createInitialCard()
    configureFormMocks({
      tags: ["German"],
      frontHtml: "<p>Hallo</p>",
      backHtml: "<p>Hello</p>",
      hasPendingInput: true,
    })
    const { result } = renderHook(() => useEditCardForm({ initialCard }))

    await expect(result.current.hasUnsavedChanges()).resolves.toBe(true)
  })

  it("builds a draft from editor html, committed tag input, and opposite-direction state", async () => {
    configureFormMocks({
      tags: ["German"],
      frontHtml: "<p>Visible front</p>",
      backHtml: "<p>Visible back</p>",
      commitInputResult: ["German", "Travel"],
    })
    const { result } = renderHook(() => useEditCardForm())

    act(() => {
      result.current.setHasOppositeDirection(true)
    })

    await expect(result.current.getDraft()).resolves.toEqual({
      backHtml: "<p>Visible back</p>",
      frontHtml: "<p>Visible front</p>",
      hasOppositeDirection: true,
      tags: ["German", "Travel"],
    })
  })

  it("tracks whether both editor sides contain meaningful content", () => {
    configureFormMocks({ frontHtml: "", backHtml: "" })
    const { result } = renderHook(() => useEditCardForm())

    expect(result.current.isDraftValid).toBe(false)

    act(() => {
      result.current.handleEditorHtmlChange("front", "<p>Hallo</p>")
      result.current.handleEditorHtmlChange("back", "<p><br></p>")
    })
    expect(result.current.isDraftValid).toBe(false)

    act(() => {
      result.current.handleEditorHtmlChange("back", "<p>Hello</p>")
    })
    expect(result.current.isDraftValid).toBe(true)
  })

  it("resets all draft state by default", () => {
    const { resetEditors, resetTags } = configureFormMocks()
    const { result } = renderHook(() => useEditCardForm())

    act(() => {
      result.current.setHasOppositeDirection(true)
      result.current.resetForm()
    })

    expect(result.current.hasOppositeDirection).toBe(false)
    expect(result.current.isDraftValid).toBe(false)
    expect(resetTags).toHaveBeenCalledTimes(1)
    expect(resetEditors).toHaveBeenCalledTimes(1)
  })

  it("preserves tags when resetting after add-another", () => {
    const { resetEditors, resetTags } = configureFormMocks()
    const { result } = renderHook(() => useEditCardForm())

    act(() => {
      result.current.resetForm({ preserveTags: true })
    })

    expect(resetTags).not.toHaveBeenCalled()
    expect(resetEditors).toHaveBeenCalledTimes(1)
  })
})
