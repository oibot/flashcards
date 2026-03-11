import { useTranslation } from "react-i18next"
import { ActivityIndicator, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import ActiveReviewState from "@/components/review/active-review-state"
import CompletedReviewState from "@/components/review/completed-review-state"
import ReviewSessionHeader from "@/components/review/review-session-header"
import { useReviewSession } from "@/hooks/useReviewSession"

export default function ReviewSessionScene() {
  const { theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "reviewSession" })
  const session = useReviewSession()

  if (session.isComplete) {
    return (
      <>
        <ReviewSessionHeader
          isComplete
          isMutating={session.isMutatingCard}
          onClose={session.close}
          onDelete={session.deleteCurrent}
        />
        <View style={styles.container}>
          <CompletedReviewState
            cardCount={session.reviewedCount}
            onClose={session.close}
          />
        </View>
      </>
    )
  }

  if (session.isLoading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator color={theme.colors.accent} />
        <Text style={styles.supportingText}>{t("loading")}</Text>
      </View>
    )
  }

  if (session.error) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.title}>{t("loadErrorTitle")}</Text>
        <Text style={styles.supportingText}>{session.error.message}</Text>
      </View>
    )
  }

  if (!session.currentCard) {
    return null
  }

  return (
    <>
      <ReviewSessionHeader
        isComplete={false}
        isMutating={session.isMutatingCard}
        visibleSide={session.visibleSide}
        onClose={session.close}
        onDelete={session.deleteCurrent}
        onShowFront={session.showFront}
      />
      <View style={styles.container}>
        <ActiveReviewState
          cardId={session.currentCard.id}
          tag={session.currentCard.tag}
          progressLabel={session.progressLabel}
          visibleSide={session.visibleSide}
          visibleHtml={session.visibleHtml}
          isSubmitting={session.isMutatingCard}
          errorMessage={session.mutationError}
          onReveal={session.reveal}
          onGrade={(grade) => {
            void session.grade(grade)
          }}
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
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
}))
