import { SymbolView } from "expo-symbols"
import { useTranslation } from "react-i18next"
import { Alert, Pressable, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import type { EditCardAudioSideState } from "@/features/cards/audio/hooks/use-edit-card-audio"
import {
  IconButtonAudio,
  IconButtonAudioNone,
  IconButtonAudioSelected,
  IconButtonAudioStale,
} from "@/shared/ui/icon-button"

const chevronIconName = "chevron.right" as const

type Props = {
  audio: EditCardAudioSideState
  onConfigure: () => void
}

export default function EditCardAudioControls({ audio, onConfigure }: Props) {
  const { t } = useTranslation("editCard")
  const { theme } = useUnistyles()
  const audioPreviewTintColor =
    audio.previewState === "ready"
      ? theme.colors.accent
      : theme.colors.secondary
  const audioPreviewBorderStyle =
    audio.previewState === "ready" ? styles.audioPreviewButtonReady : null
  const AudioPreviewButton =
    audio.previewState === "none"
      ? IconButtonAudioNone
      : audio.previewState === "selected"
        ? IconButtonAudioSelected
        : audio.previewState === "stale"
          ? IconButtonAudioStale
          : IconButtonAudio

  const handlePreview = async () => {
    const result = await audio.playPreview()

    if (!result.ok) {
      Alert.alert(result.message)
    }
  }

  return (
    <View style={styles.audioControls}>
      <Pressable
        accessibilityRole="button"
        disabled={audio.isActionDisabled}
        onPress={onConfigure}
        style={({ pressed }) => [
          styles.audioRow,
          audio.isActionDisabled ? styles.audioRowDisabled : null,
          pressed ? styles.audioRowPressed : null,
        ]}
      >
        <Text style={styles.audioActionLabel}>{t("audioLabel")}</Text>
        <View style={styles.audioValueGroup}>
          <Text style={styles.audioValueLabel}>{audio.valueLabel}</Text>
          <SymbolView
            name={chevronIconName}
            size={16}
            tintColor={theme.colors.secondary}
          />
        </View>
      </Pressable>
      <AudioPreviewButton
        accessibilityLabel={t("previewAudioAccessibilityLabel")}
        disabled={audio.isPreviewDisabled}
        loading={audio.isPreviewLoading}
        onPress={() => {
          void handlePreview()
        }}
        size={20}
        style={[styles.audioPreviewButton, audioPreviewBorderStyle]}
        tintColor={audioPreviewTintColor}
      />
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
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
