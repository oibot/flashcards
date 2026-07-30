import { type RefObject, useRef, useState } from "react"

import type {
  RichTextAlignment,
  RichTextEditorHandle,
  RichTextEditorState,
  RichTextInlineStyle,
  RichTextSize,
} from "@/features/cards/edit/lib/rich-text-editor"

type EditorSide = "front" | "back"

const getFocusedEditor = (
  side: EditorSide | null,
  frontRef: RefObject<RichTextEditorHandle | null>,
  backRef: RefObject<RichTextEditorHandle | null>,
) => {
  if (!side) return null
  return side === "front" ? frontRef.current : backRef.current
}

const resetHeading = (
  editor: RichTextEditorHandle,
  state: RichTextEditorState | null,
) => {
  if (state?.h1.isActive) {
    editor.toggleH1()
  } else if (state?.h2.isActive) {
    editor.toggleH2()
  } else if (state?.h3.isActive) {
    editor.toggleH3()
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

  const handleToggleInlineStyle = (style: RichTextInlineStyle) => {
    const editor = getFocusedEditor(focusedEditorRef.current, frontRef, backRef)
    if (!editor) return

    if (style === "bold") {
      editor.toggleBold()
    } else {
      editor.toggleItalic()
    }
  }

  const handleSetAlignment = (alignment: RichTextAlignment) => {
    const editor = getFocusedEditor(focusedEditorRef.current, frontRef, backRef)
    editor?.setTextAlignment(alignment)
  }

  const handleSetTextSize = (size: RichTextSize) => {
    const focusedEditor = focusedEditorRef.current
    const editor = getFocusedEditor(focusedEditor, frontRef, backRef)
    if (!focusedEditor || !editor) return

    const state = editorStatesRef.current[focusedEditor]

    if (size === "body") {
      resetHeading(editor, state)
      return
    }

    if (size === "large") {
      if (!state?.h3.isActive) editor.toggleH3()
      return
    }

    if (!state?.h1.isActive) editor.toggleH1()
  }

  const resetEditors = () => {
    focusedEditorRef.current = null
    editorStatesRef.current = { front: null, back: null }
    setCurrentStylesState(null)
    frontRef.current?.setValue("")
    backRef.current?.setValue("")
  }

  return {
    backRef,
    currentStylesState,
    frontRef,
    handleEditorFocus,
    handleEditorStateChange,
    handleSetAlignment,
    handleSetTextSize,
    handleToggleInlineStyle,
    resetEditors,
  }
}
