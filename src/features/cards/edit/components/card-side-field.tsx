import { SymbolView } from "expo-symbols"
import {
  forwardRef,
  type Ref,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import type { StyleProp, TextStyle, ViewStyle } from "react-native"
import { Pressable, Text, TextInput, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import {
  EMPTY_RICH_TEXT_EDITOR_STATE,
  type RichTextEditorHandle,
} from "@/features/cards/edit/lib/rich-text-editor"
import { extractPlainTextFromHtml } from "@/shared/lib/html"
import {
  IconButtonAudio,
  IconButtonAudioNone,
  IconButtonAudioSelected,
  IconButtonAudioStale,
} from "@/shared/ui/icon-button"

import type { CardSideFieldProps } from "./card-side-field.types"

const chevronIconName = "chevron.right" as const

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
  audioActionLabel,
  audioActionDisabled = false,
  audioPreviewAccessibilityLabel,
  audioPreviewLoading = false,
  audioPreviewState = "none",
  audioValueLabel,
  isAudioPreviewDisabled = true,
  onPressAudioAction,
  onPressAudioPreview,
}: CardSideFieldProps) {
  const { theme } = useUnistyles()
  const audioPreviewTintColor =
    audioPreviewState === "ready" ? theme.colors.accent : theme.colors.secondary
  const audioPreviewBorderStyle =
    audioPreviewState === "ready" ? styles.audioPreviewButtonReady : null
  const AudioPreviewButton =
    audioPreviewState === "none"
      ? IconButtonAudioNone
      : audioPreviewState === "selected"
        ? IconButtonAudioSelected
        : audioPreviewState === "stale"
          ? IconButtonAudioStale
          : IconButtonAudio

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
      {audioActionLabel &&
      audioPreviewAccessibilityLabel &&
      audioValueLabel &&
      onPressAudioAction &&
      onPressAudioPreview ? (
        <View style={styles.audioControls}>
          <Pressable
            accessibilityRole="button"
            disabled={audioActionDisabled}
            onPress={onPressAudioAction}
            style={({ pressed }) => [
              styles.audioRow,
              audioActionDisabled ? styles.audioRowDisabled : null,
              pressed ? styles.audioRowPressed : null,
            ]}
          >
            <Text style={styles.audioActionLabel}>{audioActionLabel}</Text>
            <View style={styles.audioValueGroup}>
              <Text style={styles.audioValueLabel}>{audioValueLabel}</Text>
              <SymbolView
                name={chevronIconName}
                size={16}
                tintColor={theme.colors.secondary}
              />
            </View>
          </Pressable>
          <AudioPreviewButton
            accessibilityLabel={audioPreviewAccessibilityLabel}
            disabled={isAudioPreviewDisabled}
            loading={audioPreviewLoading}
            onPress={onPressAudioPreview}
            size={20}
            style={[styles.audioPreviewButton, audioPreviewBorderStyle]}
            tintColor={audioPreviewTintColor}
          />
        </View>
      ) : null}
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
  audioControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  audioRow: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    backgroundColor: theme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: theme.colors.chromeMuted,
  },
  audioRowPressed: {
    opacity: 0.85,
  },
  audioRowDisabled: {
    opacity: 0.5,
  },
  audioActionLabel: {
    ...theme.typography.styles.subheadline,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  audioValueGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  audioValueLabel: {
    ...theme.typography.styles.subheadline,
    color: theme.colors.secondary,
  },
  audioPreviewButton: {
    width: 42,
    height: 42,
    backgroundColor: theme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: theme.colors.chromeMuted,
  },
  audioPreviewButtonReady: {
    borderColor: theme.colors.accent,
  },
}))
