import {
  forwardRef,
  type Ref,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import type { StyleProp, TextStyle, ViewStyle } from "react-native"
import { Text, TextInput, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import {
  EMPTY_RICH_TEXT_EDITOR_STATE,
  type RichTextEditorHandle,
} from "@/features/cards/edit/lib/rich-text-editor"
import { extractPlainTextFromHtml } from "@/shared/lib/html"

import type { CardSideFieldProps } from "./card-side-field.types"

type PlainTextEditorProps = Pick<
  CardSideFieldProps,
  "onBlur" | "onChangeHtml" | "onFocus" | "onStateChange"
> & {
  style: StyleProp<TextStyle | ViewStyle>
}

const escapeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

const createHtmlFromPlainText = (value: string) => {
  return escapeHtml(value).replaceAll("\n", "<br>")
}

const PlainTextEditor = forwardRef(function PlainTextEditor(
  { onBlur, onChangeHtml, onFocus, onStateChange, style }: PlainTextEditorProps,
  ref: Ref<RichTextEditorHandle>,
) {
  const inputRef = useRef<TextInput>(null)
  const htmlRef = useRef("")
  const [textValue, setTextValue] = useState("")

  useImperativeHandle(
    ref,
    () => ({
      blur: () => {
        inputRef.current?.blur()
      },
      focus: () => {
        inputRef.current?.focus()
      },
      getHTML: async () => {
        return htmlRef.current
      },
      setValue: (value: string) => {
        htmlRef.current = value
        setTextValue(extractPlainTextFromHtml(value))
      },
      toggleBold: () => {},
      toggleItalic: () => {},
      toggleUnderline: () => {},
      toggleStrikeThrough: () => {},
      toggleH1: () => {},
      toggleH2: () => {},
      toggleH3: () => {},
    }),
    [],
  )

  return (
    <TextInput
      multiline
      onBlur={onBlur}
      onChangeText={(nextValue) => {
        const nextHtml = createHtmlFromPlainText(nextValue)
        htmlRef.current = nextHtml
        setTextValue(nextValue)
        onChangeHtml?.(nextHtml)
        onStateChange(EMPTY_RICH_TEXT_EDITOR_STATE)
      }}
      onFocus={() => {
        onFocus()
        onStateChange(EMPTY_RICH_TEXT_EDITOR_STATE)
      }}
      ref={inputRef}
      style={style}
      textAlignVertical="top"
      value={textValue}
    />
  )
})

export default function CardSideField({
  label,
  editorRef,
  onBlur,
  onFocus,
  onChangeHtml,
  onStateChange,
  footer,
}: CardSideFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <PlainTextEditor
        onBlur={onBlur}
        onChangeHtml={onChangeHtml}
        onFocus={onFocus}
        onStateChange={onStateChange}
        ref={editorRef}
        style={styles.input}
      />
      {footer}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  input: {
    width: "100%",
    minHeight: 180,
    fontSize: 20,
    color: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.colors.secondaryBackground,
    borderRadius: 14,
    borderCurve: "continuous",
  },
}))
