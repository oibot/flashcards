import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import type { ReviewGrade } from "@/domain/review-scheduler"

import ReviewCard from "./review-card"
import ReviewGradeButton from "./review-grade-button"

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
  const gradeActions: ReviewGrade[] = ["again", "hard", "good"]

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
            {gradeActions.map((grade) => (
              <ReviewGradeButton
                key={grade}
                disabled={isSubmitting}
                grade={grade}
                label={t(grade)}
                onPress={onGrade}
              />
            ))}
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
    gap: 10,
  },
  errorMessage: {
    ...theme.typography.styles.footnote,
    color: theme.colors.secondary,
    textAlign: "center",
  },
}))
