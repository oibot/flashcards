import { act, renderHook } from "@testing-library/react-native"

import { useEditCardEditors } from "@/features/cards/edit/hooks/use-edit-card-editors"
import {
  createEmptyRichTextEditorState,
  getRichTextAlignment,
  getRichTextSize,
  type RichTextEditorHandle,
} from "@/features/cards/edit/lib/rich-text-editor"

const createEditorHandle = (): jest.Mocked<RichTextEditorHandle> => ({
  blur: jest.fn(),
  focus: jest.fn(),
  getHTML: jest.fn().mockResolvedValue(""),
  setTextAlignment: jest.fn(),
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
  it("sends inline formatting commands only to the focused editor", () => {
    const { result } = renderHook(() => useEditCardEditors())
    const frontEditor = createEditorHandle()
    const backEditor = createEditorHandle()
    result.current.frontRef.current = frontEditor
    result.current.backRef.current = backEditor

    act(() => {
      result.current.handleEditorFocus("back")
      result.current.handleToggleInlineStyle("bold")
    })

    expect(backEditor.toggleBold).toHaveBeenCalledTimes(1)
    expect(frontEditor.toggleBold).not.toHaveBeenCalled()

    act(() => {
      result.current.handleEditorFocus("front")
      result.current.handleToggleInlineStyle("italic")
    })

    expect(frontEditor.toggleItalic).toHaveBeenCalledTimes(1)
    expect(backEditor.toggleItalic).not.toHaveBeenCalled()
  })

  it("applies paragraph alignment to the focused editor", () => {
    const { result } = renderHook(() => useEditCardEditors())
    const frontEditor = createEditorHandle()
    const backEditor = createEditorHandle()
    result.current.frontRef.current = frontEditor
    result.current.backRef.current = backEditor

    act(() => {
      result.current.handleEditorFocus("front")
      result.current.handleSetAlignment("center")
    })

    expect(frontEditor.setTextAlignment).toHaveBeenCalledWith("center")
    expect(backEditor.setTextAlignment).not.toHaveBeenCalled()
  })

  it("maps Body, Large, and Title to paragraph and heading commands", () => {
    const { result } = renderHook(() => useEditCardEditors())
    const editor = createEditorHandle()
    result.current.frontRef.current = editor

    act(() => {
      result.current.handleEditorFocus("front")
      result.current.handleSetTextSize("large")
    })
    expect(editor.toggleH3).toHaveBeenCalledTimes(1)

    const largeState = createEmptyRichTextEditorState()
    largeState.h3.isActive = true
    act(() => {
      result.current.handleEditorStateChange("front", largeState)
      result.current.handleSetTextSize("title")
    })
    expect(editor.toggleH1).toHaveBeenCalledTimes(1)

    const titleState = createEmptyRichTextEditorState()
    titleState.h1.isActive = true
    act(() => {
      result.current.handleEditorStateChange("front", titleState)
      result.current.handleSetTextSize("body")
    })
    expect(editor.toggleH1).toHaveBeenCalledTimes(2)
  })

  it("shows the formatting state of the focused editor", () => {
    const { result } = renderHook(() => useEditCardEditors())
    const frontState = createEmptyRichTextEditorState()
    frontState.alignment = "right"
    frontState.bold.isActive = true
    frontState.h1.isActive = true
    const backState = createEmptyRichTextEditorState()

    act(() => {
      result.current.handleEditorFocus("front")
      result.current.handleEditorStateChange("front", frontState)
      result.current.handleEditorStateChange("back", backState)
    })
    expect(result.current.currentStylesState?.bold.isActive).toBe(true)
    expect(getRichTextAlignment(result.current.currentStylesState)).toBe(
      "right",
    )
    expect(getRichTextSize(result.current.currentStylesState)).toBe("title")

    act(() => {
      result.current.handleEditorFocus("back")
    })
    expect(result.current.currentStylesState?.bold.isActive).toBe(false)
    expect(getRichTextAlignment(result.current.currentStylesState)).toBe("left")
    expect(getRichTextSize(result.current.currentStylesState)).toBe("body")
  })
})
