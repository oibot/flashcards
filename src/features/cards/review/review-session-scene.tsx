import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import ActiveReviewState from "@/features/cards/review/active-review-state"
import CompletedReviewState from "@/features/cards/review/completed-review-state"
import ReviewSessionHeader from "@/features/cards/review/review-session-header"
import { consumePendingReviewSessionSeed } from "@/features/cards/review/review-session-seed-store"
import { useReviewSession } from "@/features/cards/review/use-review-session"

type ReviewSessionSceneProps = {
  onClose: () => void
  onEditCard: (cardId: string) => void
}

export default function ReviewSessionScene({
  onClose,
  onEditCard,
}: ReviewSessionSceneProps) {
  const { theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "reviewSession" })
  const [initialSeed] = useState(() => consumePendingReviewSessionSeed())
  const session = useReviewSession({ initialSeed: initialSeed ?? undefined })

  useEffect(() => {
    if (session.shouldClose) {
      onClose()
    }
  }, [onClose, session.shouldClose])

  if (session.isComplete) {
    return (
      <>
        <ReviewSessionHeader
          isComplete
          isMutating={session.isMutatingCard}
          onClose={onClose}
          onDelete={session.deleteCurrent}
          onEdit={() => {
            if (session.currentCard) {
              onEditCard(session.currentCard.id)
            }
          }}
        />
        <View style={styles.container}>
          <CompletedReviewState
            cardCount={session.reviewedCount}
            onClose={onClose}
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
        onClose={onClose}
        onDelete={session.deleteCurrent}
        onEdit={() => {
          onEditCard(session.currentCard.id)
        }}
        onShowFront={session.showFront}
      />
      <View style={styles.container}>
        <ActiveReviewState
          cardId={session.currentCard.id}
          tags={session.currentCard.tags}
          progressLabel={session.progressLabel}
          visibleSide={session.visibleSide}
          visibleHtml={session.visibleHtml}
          visibleSideHasSound={
            session.visibleSide === "front"
              ? session.currentCard.frontHasSound
              : session.currentCard.backHasSound
          }
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
