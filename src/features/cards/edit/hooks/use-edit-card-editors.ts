import { type RefObject, useRef, useState } from "react"

import type {
  RichTextEditorHandle,
  RichTextEditorState,
} from "@/features/cards/edit/lib/rich-text-editor"
import {
  type SharedToolbarState,
  stateKeyByItemName,
  type ToolbarItem,
  type ToolbarStyleKey,
} from "@/shared/ui/toolbar"

type EditorSide = "front" | "back"

const DEFAULT_SHARED_STYLES: SharedToolbarState = {
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  h1: false,
  h2: false,
  h3: false,
}

const toggleEditorStyle = (
  editorRef: RefObject<RichTextEditorHandle | null>,
  styleKey: ToolbarStyleKey,
) => {
  const editor = editorRef.current
  if (!editor) return

  switch (styleKey) {
    case "bold":
      editor.toggleBold()
      break
    case "italic":
      editor.toggleItalic()
      break
    case "underline":
      editor.toggleUnderline()
      break
    case "strikeThrough":
      editor.toggleStrikeThrough()
      break
    case "h1":
      editor.toggleH1()
      break
    case "h2":
      editor.toggleH2()
      break
    case "h3":
      editor.toggleH3()
      break
  }
}

const getSharedStylesFromState = (
  stylesState: RichTextEditorState | null,
): SharedToolbarState => {
  if (!stylesState) return DEFAULT_SHARED_STYLES

  return {
    bold: stylesState.bold.isActive,
    italic: stylesState.italic.isActive,
    underline: stylesState.underline.isActive,
    strikeThrough: stylesState.strikeThrough.isActive,
    h1: stylesState.h1.isActive,
    h2: stylesState.h2.isActive,
    h3: stylesState.h3.isActive,
  }
}

export function useEditCardEditors() {
  const frontRef = useRef<RichTextEditorHandle | null>(null)
  const backRef = useRef<RichTextEditorHandle | null>(null)
  const focusedEditorRef = useRef<EditorSide | null>(null)
  const editorStatesRef = useRef<
    Record<EditorSide, RichTextEditorState | null>
  >({
    front: null,
    back: null,
  })
  const [currentStylesState, setCurrentStylesState] =
    useState<RichTextEditorState | null>(null)

  const handleEditorFocus = (editor: EditorSide) => {
    focusedEditorRef.current = editor
    setCurrentStylesState(editorStatesRef.current[editor])
  }

  const handleEditorStateChange = (
    editor: EditorSide,
    nextState: RichTextEditorState,
  ) => {
    editorStatesRef.current[editor] = nextState

    const focusedEditor = focusedEditorRef.current
    if (focusedEditor === null || focusedEditor === editor) {
      setCurrentStylesState(nextState)
    }
  }

  const handleToggleStyle = (item: ToolbarItem) => {
    const focusedEditor = focusedEditorRef.current
    if (!focusedEditor) return

    const editorRef = focusedEditor === "front" ? frontRef : backRef
    const styleKey = stateKeyByItemName[item.name]
    toggleEditorStyle(editorRef, styleKey)
  }

  const resetEditors = () => {
    focusedEditorRef.current = null
    editorStatesRef.current = { front: null, back: null }
    setCurrentStylesState(null)
    frontRef.current?.setValue("")
    backRef.current?.setValue("")
  }

  return {
    activeStyles: getSharedStylesFromState(currentStylesState),
    backRef,
    currentStylesState,
    frontRef,
    handleEditorFocus,
    handleEditorStateChange,
    handleToggleStyle,
    resetEditors,
  }
}
