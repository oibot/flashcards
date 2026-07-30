export type RichTextStyleState = {
  isActive: boolean
  isBlocking: boolean
  isConflicting: boolean
}

export type RichTextAlignment = "left" | "center" | "right"
export type RichTextSize = "body" | "large" | "title"
export type RichTextInlineStyle = "bold" | "italic"

export type RichTextEditorState = {
  alignment: string
  bold: RichTextStyleState
  italic: RichTextStyleState
  underline: RichTextStyleState
  strikeThrough: RichTextStyleState
  h1: RichTextStyleState
  h2: RichTextStyleState
  h3: RichTextStyleState
}

export type RichTextEditorHandle = {
  blur: () => void
  focus: () => void
  getHTML: () => Promise<string>
  setTextAlignment: (alignment: RichTextAlignment) => void
  setValue: (value: string) => void
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  toggleStrikeThrough: () => void
  toggleH1: () => void
  toggleH2: () => void
  toggleH3: () => void
}

export type RichTextEditorHtmlChangeEvent = {
  value: string
}

const createInactiveStyleState = (): RichTextStyleState => ({
  isActive: false,
  isBlocking: false,
  isConflicting: false,
})

export const createEmptyRichTextEditorState = (): RichTextEditorState => ({
  alignment: "left",
  bold: createInactiveStyleState(),
  italic: createInactiveStyleState(),
  underline: createInactiveStyleState(),
  strikeThrough: createInactiveStyleState(),
  h1: createInactiveStyleState(),
  h2: createInactiveStyleState(),
  h3: createInactiveStyleState(),
})

export const EMPTY_RICH_TEXT_EDITOR_STATE = createEmptyRichTextEditorState()

export const getRichTextAlignment = (
  state: RichTextEditorState | null,
): RichTextAlignment => {
  if (
    state?.alignment === "center" ||
    state?.alignment === "right" ||
    state?.alignment === "left"
  ) {
    return state.alignment
  }

  return "left"
}

export const getRichTextSize = (
  state: RichTextEditorState | null,
): RichTextSize => {
  if (state?.h1.isActive) return "title"
  if (state?.h2.isActive || state?.h3.isActive) return "large"
  return "body"
}
