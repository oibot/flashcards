import type { RefObject } from "react"
import { Pressable, Text, View } from "react-native"
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
  soundActionLabel?: string
  onPressSoundAction?: () => void
}

export default function CardSideField({
  label,
  editorRef,
  onBlur,
  onFocus,
  onStateChange,
  soundActionLabel,
  onPressSoundAction,
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
      {soundActionLabel && onPressSoundAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPressSoundAction}
          style={({ pressed }) => [
            styles.soundButton,
            pressed ? styles.soundButtonPressed : null,
          ]}
        >
          <Text style={styles.soundButtonLabel}>{soundActionLabel}</Text>
        </Pressable>
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
    textAlignVertical: "top",
  },
  soundButton: {
    minHeight: 42,
    borderRadius: 14,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: theme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: theme.colors.chromeMuted,
  },
  soundButtonPressed: {
    opacity: 0.85,
  },
  soundButtonLabel: {
    ...theme.typography.styles.subheadline,
    color: theme.colors.primary,
    fontWeight: "600",
  },
}))
