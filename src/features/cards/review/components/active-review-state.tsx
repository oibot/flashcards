import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import type { ReviewGrade } from "@/features/cards/model/review-scheduler"

import ReviewActionButton from "./review-action-button"
import ReviewCard from "./review-card"

type Props = {
  cardId: string
  tags: string[]
  progressLabel: string
  visibleSide: "front" | "back"
  visibleHtml: string
  visibleSideHasSound: boolean
  isSubmitting: boolean
  errorMessage: string | null
  onReveal: () => void
  onGrade: (grade: ReviewGrade) => void
}

const formatCardTags = (tags: string[]) => {
  return tags.join(" • ")
}

export default function ActiveReviewState({
  cardId,
  tags,
  progressLabel,
  visibleSide,
  visibleHtml,
  visibleSideHasSound,
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
        headerLabel={formatCardTags(tags)}
        hasSound={visibleSideHasSound}
        isSubmitting={isSubmitting}
        onReveal={onReveal}
        visibleHtml={visibleHtml}
        visibleSide={visibleSide}
      />

      <View style={styles.actions}>
        <View style={styles.actionRow}>
          {isAnswerVisible ? (
            gradeActions.map((grade) => (
              <ReviewActionButton
                key={grade}
                disabled={isSubmitting}
                label={t(grade)}
                onPress={() => onGrade(grade)}
                variant={grade}
              />
            ))
          ) : (
            <ReviewActionButton
              disabled={isSubmitting}
              label={t("revealAnswer")}
              onPress={onReveal}
              variant="plain"
            />
          )}
        </View>
        {errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme, rt) => ({
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
    paddingBottom: rt.insets.bottom,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  errorMessage: {
    ...theme.typography.styles.footnote,
    color: theme.colors.secondary,
    textAlign: "center",
  },
}))
