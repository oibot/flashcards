import { useTranslation } from "react-i18next"
import { Pressable, Text, View } from "react-native"
import { EnrichedTextInput } from "react-native-enriched"
import { StyleSheet } from "react-native-unistyles"

import type { ReviewGrade } from "@/domain/review-scheduler"

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
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={onReveal}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonLabel}>{t("revealAnswer")}</Text>
          </Pressable>
        )}
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
  gradeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  gradeButton: {
    flexGrow: 1,
    flexBasis: "47%",
    minHeight: 52,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  gradeButtonAccent: {
    backgroundColor: theme.colors.accent,
  },
  gradeButtonNeutral: {
    backgroundColor: theme.colors.secondaryBackground,
  },
  gradeButtonLabel: {
    ...theme.typography.styles.headline,
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
