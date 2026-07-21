import type { ReactNode, RefObject } from "react"

import type {
  RichTextEditorHandle,
  RichTextEditorState,
} from "@/features/cards/edit/lib/rich-text-editor"

export type CardSideFieldProps = {
  label: string
  editorRef: RefObject<RichTextEditorHandle | null>
  onBlur: () => void
  onFocus: () => void
  onChangeHtml?: (html: string) => void
  onStateChange: (nextState: RichTextEditorState) => void
  footer?: ReactNode
}
