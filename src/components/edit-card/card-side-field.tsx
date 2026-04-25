import { SymbolView } from "expo-symbols"
import type { RefObject } from "react"
import { type NativeSyntheticEvent, Pressable, Text, View } from "react-native"
import type {
  EnrichedTextInputInstance,
  OnChangeHtmlEvent,
  OnChangeStateEvent,
} from "react-native-enriched"
import { EnrichedTextInput } from "react-native-enriched"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import { IconButtonAudio } from "@/components/UI/icon-button"

type CardSideFieldProps = {
  label: string
  editorRef: RefObject<EnrichedTextInputInstance | null>
  onBlur: () => void
  onFocus: () => void
  onChangeHtml?: (html: string) => void
  onStateChange: (nextState: OnChangeStateEvent) => void
  audioActionLabel?: string
  audioActionDisabled?: boolean
  audioPreviewAccessibilityLabel?: string
  audioPreviewLoading?: boolean
  audioValueLabel?: string
  isAudioPreviewDisabled?: boolean
  onPressAudioAction?: () => void
  onPressAudioPreview?: () => void
}

const chevronIconName = {
  ios: "chevron.right",
  android: "chevron_right",
} as const

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
  audioValueLabel,
  isAudioPreviewDisabled = true,
  onPressAudioAction,
  onPressAudioPreview,
}: CardSideFieldProps) {
  const { theme } = useUnistyles()

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <EnrichedTextInput
        ref={editorRef}
        onBlur={onBlur}
        onChangeHtml={(event: NativeSyntheticEvent<OnChangeHtmlEvent>) => {
          onChangeHtml?.(event.nativeEvent.value)
        }}
        onChangeState={(event) => onStateChange(event.nativeEvent)}
        onFocus={onFocus}
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
          <IconButtonAudio
            accessibilityLabel={audioPreviewAccessibilityLabel}
            disabled={isAudioPreviewDisabled}
            loading={audioPreviewLoading}
            onPress={onPressAudioPreview}
            size={20}
            style={styles.audioPreviewButton}
            tintColor={theme.colors.primary}
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
    textAlignVertical: "top",
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
}))
