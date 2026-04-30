import type { RefObject } from "react"

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
  audioActionLabel?: string
  audioActionDisabled?: boolean
  audioPreviewAccessibilityLabel?: string
  audioPreviewLoading?: boolean
  audioPreviewState?: "none" | "selected" | "stale" | "ready"
  audioValueLabel?: string
  isAudioPreviewDisabled?: boolean
  onPressAudioAction?: () => void
  onPressAudioPreview?: () => void
}
