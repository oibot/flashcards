import type { RefObject } from "react"
import { Text, View } from "react-native"
import type {
  EnrichedTextInputInstance,
  OnChangeStateEvent,
} from "react-native-enriched"
import { EnrichedTextInput } from "react-native-enriched"
import { StyleSheet } from "react-native-unistyles"

type CardSideFieldProps = {
  label: string
  editorRef: RefObject<EnrichedTextInputInstance | null>
  onBlur: () => void
  onFocus: () => void
  onStateChange: (nextState: OnChangeStateEvent) => void
}

export default function CardSideField({
  label,
  editorRef,
  onBlur,
  onFocus,
  onStateChange,
}: CardSideFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <EnrichedTextInput
        ref={editorRef}
        onBlur={onBlur}
        onChangeState={(event) => onStateChange(event.nativeEvent)}
        onFocus={onFocus}
        style={styles.input}
      />
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
