import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Pressable, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import { useReviewPrepCards } from "@/features/cards/review/hooks/use-review-prep-cards"
import { setPendingReviewSessionSeed } from "@/features/cards/review/lib/review-session-seed-store"

type Props = {
  onNewCard: () => void
  onReviewAllStart: () => void
  onReviewStart: () => void
}

export default function ReviewPrepScreen({
  onNewCard,
  onReviewAllStart,
  onReviewStart,
}: Props) {
  const { theme } = useUnistyles()
  const { t } = useTranslation("reviewPrep")
  const { allCardCount, dueCardCount, error, isLoading, prepareCards } =
    useReviewPrepCards()
  const isReviewDisabled = isLoading || !!error || dueCardCount === 0
  const isReviewAllDisabled = isLoading || !!error || allCardCount === 0

  const handleReviewStart = () => {
    if (isReviewDisabled) return
    setPendingReviewSessionSeed({ cards: prepareCards("due") })
    onReviewStart()
  }

  const handleReviewAllStart = () => {
    if (isReviewAllDisabled) return
    setPendingReviewSessionSeed({ cards: prepareCards("all") })
    onReviewAllStart()
  }

  const statusLabel = isLoading
    ? t("loading")
    : error
      ? t("loadError")
      : t("dueCount", { count: dueCardCount })

  return (
    <>
      <Stack.Screen
        options={{
          unstable_headerRightItems: () => [
            {
              type: "button",
              label: t("newCardAccessibilityLabel"),
              icon: { type: "sfSymbol", name: "plus" },
              tintColor: theme.colors.accent,
              onPress: onNewCard,
            },
          ],
        }}
      />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{t("title")}</Text>
          <View style={styles.statusBlock}>
            {isLoading ? (
              <ActivityIndicator color={theme.colors.accent} />
            ) : null}
            <Text style={styles.statusLabel}>{statusLabel}</Text>
            {!isLoading && !error && dueCardCount === 0 ? (
              <Text style={styles.emptyState}>{t("emptyState")}</Text>
            ) : null}
          </View>
          <View style={styles.buttonGroup}>
            <Pressable
              accessibilityRole="button"
              disabled={isReviewDisabled}
              onPress={handleReviewStart}
              style={[
                styles.button,
                isReviewDisabled ? styles.buttonDisabled : null,
              ]}
            >
              <Text
                style={[
                  styles.buttonLabel,
                  isReviewDisabled ? styles.buttonLabelDisabled : null,
                ]}
              >
                {t("startReview")}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isReviewAllDisabled}
              onPress={handleReviewAllStart}
              style={[
                styles.secondaryButton,
                isReviewAllDisabled ? styles.secondaryButtonDisabled : null,
              ]}
            >
              <Text
                style={[
                  styles.secondaryButtonLabel,
                  isReviewAllDisabled
                    ? styles.secondaryButtonLabelDisabled
                    : null,
                ]}
              >
                {t("startAllReviews")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  content: {
    width: "100%",
    paddingHorizontal: 24,
    gap: 24,
    alignItems: "center",
  },
  title: {
    ...theme.typography.styles.title3,
    color: theme.colors.primary,
    textAlign: "center",
  },
  statusBlock: {
    gap: 8,
    alignItems: "center",
  },
  statusLabel: {
    ...theme.typography.styles.body,
    color: theme.colors.primary,
    textAlign: "center",
  },
  emptyState: {
    ...theme.typography.styles.subheadline,
    color: theme.colors.secondary,
    textAlign: "center",
  },
  buttonGroup: {
    width: "100%",
    maxWidth: 260,
    gap: 12,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: theme.colors.accent,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.chromeMuted,
  },
  buttonLabel: {
    ...theme.typography.styles.headline,
    color: theme.colors.background,
  },
  buttonLabelDisabled: {
    color: theme.colors.primary,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.chromeMuted,
  },
  secondaryButtonDisabled: {
    backgroundColor: theme.colors.secondaryBackground,
    borderColor: theme.colors.chromeMuted,
  },
  secondaryButtonLabel: {
    ...theme.typography.styles.headline,
    color: theme.colors.primary,
  },
  secondaryButtonLabelDisabled: {
    color: theme.colors.secondary,
  },
}))
