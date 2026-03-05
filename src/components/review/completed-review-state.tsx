import { useTranslation } from "react-i18next"
import { Pressable, Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

type Props = {
  cardCount: number
  onClose: () => void
}

export default function CompletedReviewState({ cardCount, onClose }: Props) {
  const { t } = useTranslation("common", {
    keyPrefix: "reviewSession.completed",
  })

  return (
    <View style={styles.centerContent}>
      <Text style={styles.title}>{t("title")}</Text>
      <Text style={styles.supportingText}>
        {t("summary", { count: cardCount })}
      </Text>
      <View style={styles.actions}>
        <Pressable onPress={onClose} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonLabel}>{t("close")}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  actions: {
    gap: 12,
  },
  title: {
    ...theme.typography.styles.title3,
    color: theme.colors.primary,
    textAlign: "center",
  },
  supportingText: {
    ...theme.typography.styles.body,
    color: theme.colors.secondary,
    textAlign: "center",
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: theme.colors.chromeMuted,
  },
  secondaryButtonLabel: {
    ...theme.typography.styles.headline,
    color: theme.colors.primary,
  },
}))
