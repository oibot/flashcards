export type RichTextStyleState = {
  isActive: boolean
  isBlocking: boolean
  isConflicting: boolean
}

export type RichTextEditorState = {
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
  bold: createInactiveStyleState(),
  italic: createInactiveStyleState(),
  underline: createInactiveStyleState(),
  strikeThrough: createInactiveStyleState(),
  h1: createInactiveStyleState(),
  h2: createInactiveStyleState(),
  h3: createInactiveStyleState(),
})

export const EMPTY_RICH_TEXT_EDITOR_STATE = createEmptyRichTextEditorState()
