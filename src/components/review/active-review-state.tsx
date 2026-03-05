import { useTranslation } from "react-i18next"
import { Pressable, Text, View } from "react-native"
import { EnrichedTextInput } from "react-native-enriched"
import { StyleSheet } from "react-native-unistyles"

type Props = {
  cardId: string
  tag: string
  progressLabel: string
  visibleSide: "front" | "back"
  visibleHtml: string
  actionLabel: string
  onPrimaryAction: () => void
}

export default function ActiveReviewState({
  cardId,
  tag,
  progressLabel,
  visibleSide,
  visibleHtml,
  actionLabel,
  onPrimaryAction,
}: Props) {
  const { t } = useTranslation("common", { keyPrefix: "reviewSession.active" })

  return (
    <View style={styles.session}>
      <View style={styles.metaRow}>
        <View style={styles.tagPill}>
          <Text style={styles.tagLabel}>{tag}</Text>
        </View>
        <Text style={styles.progressLabel}>{progressLabel}</Text>
      </View>

      <View style={styles.cardSurface}>
        <Text style={styles.sideLabel}>{t(visibleSide)}</Text>
        <EnrichedTextInput
          key={`${cardId}-${visibleSide}`}
          defaultValue={visibleHtml}
          editable={false}
          scrollEnabled={false}
          style={styles.cardContent}
        />
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onPrimaryAction} style={styles.primaryButton}>
          <Text style={styles.primaryButtonLabel}>{actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  session: {
    flex: 1,
    gap: 20,
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderCurve: "continuous",
    backgroundColor: theme.colors.secondaryBackground,
  },
  tagLabel: {
    ...theme.typography.styles.footnote,
    color: theme.colors.primary,
  },
  progressLabel: {
    ...theme.typography.styles.footnote,
    color: theme.colors.secondary,
  },
  cardSurface: {
    gap: 12,
    padding: 18,
    borderRadius: 24,
    borderCurve: "continuous",
    backgroundColor: theme.colors.secondaryBackground,
    minHeight: 360,
    justifyContent: "flex-start",
  },
  sideLabel: {
    ...theme.typography.styles.subheadline,
    color: theme.colors.secondary,
  },
  cardContent: {
    flex: 1,
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.body,
    backgroundColor: "transparent",
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: theme.colors.accent,
  },
  primaryButtonLabel: {
    ...theme.typography.styles.headline,
    color: theme.colors.background,
  },
}))
