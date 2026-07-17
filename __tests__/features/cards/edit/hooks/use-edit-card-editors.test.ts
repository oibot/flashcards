jest.mock("@/shared/ui/toolbar", () => ({
  stateKeyByItemName: {
    bold: "bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "strikeThrough",
    "heading-1": "h1",
    "heading-2": "h2",
    "heading-3": "h3",
  },
  STYLE_ITEMS: [{ name: "bold" }, { name: "italic" }],
}))

import { act, renderHook } from "@testing-library/react-native"

import { useEditCardEditors } from "@/features/cards/edit/hooks/use-edit-card-editors"
import {
  createEmptyRichTextEditorState,
  type RichTextEditorHandle,
} from "@/features/cards/edit/lib/rich-text-editor"
import { STYLE_ITEMS } from "@/shared/ui/toolbar"

const createEditorHandle = (): jest.Mocked<RichTextEditorHandle> => ({
  blur: jest.fn(),
  focus: jest.fn(),
  getHTML: jest.fn().mockResolvedValue(""),
  setValue: jest.fn(),
  toggleBold: jest.fn(),
  toggleItalic: jest.fn(),
  toggleUnderline: jest.fn(),
  toggleStrikeThrough: jest.fn(),
  toggleH1: jest.fn(),
  toggleH2: jest.fn(),
  toggleH3: jest.fn(),
})

describe("useEditCardEditors", () => {
  it("sends toolbar commands only to the focused editor", () => {
    const { result } = renderHook(() => useEditCardEditors())
    const frontEditor = createEditorHandle()
    const backEditor = createEditorHandle()
    result.current.frontRef.current = frontEditor
    result.current.backRef.current = backEditor

    act(() => {
      result.current.handleEditorFocus("back")
      result.current.handleToggleStyle(STYLE_ITEMS[0])
    })

    expect(backEditor.toggleBold).toHaveBeenCalledTimes(1)
    expect(frontEditor.toggleBold).not.toHaveBeenCalled()

    act(() => {
      result.current.handleEditorFocus("front")
      result.current.handleToggleStyle(STYLE_ITEMS[1])
    })

    expect(frontEditor.toggleItalic).toHaveBeenCalledTimes(1)
    expect(backEditor.toggleItalic).not.toHaveBeenCalled()
  })

  it("shows the formatting state of the focused editor", () => {
    const { result } = renderHook(() => useEditCardEditors())
    const frontState = createEmptyRichTextEditorState()
    frontState.bold.isActive = true
    const backState = createEmptyRichTextEditorState()

    act(() => {
      result.current.handleEditorFocus("front")
      result.current.handleEditorStateChange("front", frontState)
      result.current.handleEditorStateChange("back", backState)
    })
    expect(result.current.activeStyles.bold).toBe(true)

    act(() => {
      result.current.handleEditorFocus("back")
    })
    expect(result.current.activeStyles.bold).toBe(false)

    act(() => {
      result.current.handleEditorFocus("front")
    })
    expect(result.current.activeStyles.bold).toBe(true)
  })

  it("uses the newly focused editor for immediate state changes", () => {
    const { result } = renderHook(() => useEditCardEditors())
    const backState = createEmptyRichTextEditorState()
    backState.bold.isActive = true
    const frontState = createEmptyRichTextEditorState()
    frontState.italic.isActive = true

    act(() => {
      result.current.handleEditorFocus("back")
      result.current.handleEditorStateChange("back", backState)
    })
    expect(result.current.activeStyles.bold).toBe(true)

    act(() => {
      result.current.handleEditorFocus("front")
      result.current.handleEditorStateChange("front", frontState)
    })

    expect(result.current.activeStyles.bold).toBe(false)
    expect(result.current.activeStyles.italic).toBe(true)
  })
})
