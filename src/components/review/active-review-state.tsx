import { useTranslation } from "react-i18next"
import { Pressable, Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import type { ReviewGrade } from "@/domain/review-scheduler"

import ReviewCard from "./review-card"

type Props = {
  cardId: string
  tag: string
  progressLabel: string
  visibleSide: "front" | "back"
  visibleHtml: string
  isSubmitting: boolean
  errorMessage: string | null
  onReveal: () => void
  onGrade: (grade: ReviewGrade) => void
}

export default function ActiveReviewState({
  cardId,
  tag,
  progressLabel,
  visibleSide,
  visibleHtml,
  isSubmitting,
  errorMessage,
  onReveal,
  onGrade,
}: Props) {
  const { t } = useTranslation("common", { keyPrefix: "reviewSession.active" })
  const isAnswerVisible = visibleSide === "back"
  const gradeActions: ReviewGrade[] = ["again", "hard", "good", "easy"]

  return (
    <View style={styles.session}>
      <View style={styles.metaRow}>
        <Text style={styles.progressLabel}>{progressLabel}</Text>
      </View>

      <ReviewCard
        cardId={cardId}
        headerLabel={tag}
        isSubmitting={isSubmitting}
        onReveal={onReveal}
        visibleHtml={visibleHtml}
        visibleSide={visibleSide}
      />

      <View style={styles.actions}>
        {isAnswerVisible ? (
          <View style={styles.gradeGrid}>
            {gradeActions.map((grade) => {
              const isAccentAction = grade === "good" || grade === "easy"

              return (
                <Pressable
                  key={grade}
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => onGrade(grade)}
                  style={[
                    styles.gradeButton,
                    isAccentAction
                      ? styles.gradeButtonAccent
                      : styles.gradeButtonNeutral,
                  ]}
                >
                  <Text
                    style={[
                      styles.gradeButtonLabel,
                      isAccentAction
                        ? styles.gradeButtonLabelAccent
                        : styles.gradeButtonLabelNeutral,
                    ]}
                  >
                    {t(grade)}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}
        {errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  session: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    paddingVertical: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  progressLabel: {
    ...theme.typography.styles.footnote,
    color: theme.colors.secondary,
    fontVariant: ["tabular-nums"],
  },
  actions: {
    width: "100%",
    maxWidth: 340,
    gap: 12,
  },
  gradeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gradeButton: {
    flexGrow: 1,
    flexBasis: "47%",
    minHeight: 48,
    borderRadius: 14,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.chromeMuted,
  },
  gradeButtonAccent: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  gradeButtonNeutral: {
    backgroundColor: theme.colors.background,
  },
  gradeButtonLabel: {
    ...theme.typography.styles.subheadline,
    fontWeight: "600",
  },
  gradeButtonLabelAccent: {
    color: theme.colors.background,
  },
  gradeButtonLabelNeutral: {
    color: theme.colors.primary,
  },
  errorMessage: {
    ...theme.typography.styles.footnote,
    color: theme.colors.secondary,
    textAlign: "center",
  },
}))
