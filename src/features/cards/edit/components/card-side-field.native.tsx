import type { RefObject } from "react"
import { type NativeSyntheticEvent, Text, View } from "react-native"
import {
  EnrichedTextInput,
  type EnrichedTextInputInstance,
} from "react-native-enriched-html"
import { StyleSheet } from "react-native-unistyles"

import type { RichTextEditorHtmlChangeEvent } from "@/features/cards/edit/lib/rich-text-editor"

import type { CardSideFieldProps } from "./card-side-field.types"

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
      <EnrichedTextInput
        ref={
          editorRef as unknown as RefObject<EnrichedTextInputInstance | null>
        }
        onBlur={onBlur}
        onChangeHtml={(
          event: NativeSyntheticEvent<RichTextEditorHtmlChangeEvent>,
        ) => {
          onChangeHtml?.(event.nativeEvent.value)
        }}
        onChangeState={(event) => onStateChange(event.nativeEvent)}
        onFocus={onFocus}
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
    textAlignVertical: "top",
  },
}))
