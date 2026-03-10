import { Stack, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Platform, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import ActiveReviewState from "@/components/review/active-review-state"
import CompletedReviewState from "@/components/review/completed-review-state"
import AndroidHeader from "@/components/UI/android-header"
import { IconButtonClose } from "@/components/UI/icon-button"
import type { Card } from "@/domain/card"
import type { ReviewGrade } from "@/domain/review-scheduler"
import { useDueCards } from "@/hooks/useDueCards"

export default function ReviewSessionScene() {
  const { theme } = useUnistyles()
  const { dismiss } = useRouter()
  const { t } = useTranslation("common", { keyPrefix: "reviewSession" })
  const { cards: dueCards, isLoading, error, reviewCard } = useDueCards()
  const isIOS = Platform.OS === "ios"
  const isAndroid = Platform.OS === "android"
  const [sessionCards, setSessionCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isBackVisible, setIsBackVisible] = useState(false)
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const currentCard = sessionCards[currentIndex] ?? null
  const isLastCard = currentIndex === sessionCards.length - 1
  const progressLabel =
    sessionCards.length > 0
      ? `${currentIndex + 1} / ${sessionCards.length}`
      : "0 / 0"
  const visibleSide = isBackVisible ? "back" : "front"
  const visibleHtml = currentCard
    ? isBackVisible
      ? currentCard.backHtml
      : currentCard.frontHtml
    : ""

  useEffect(() => {
    if (sessionCards.length > 0 || isLoading || error) return

    if (dueCards.length === 0) {
      dismiss()
      return
    }

    setSessionCards(dueCards)
  }, [dismiss, dueCards, error, isLoading, sessionCards.length])

  const handleClose = () => {
    dismiss()
  }

  const handleReveal = () => {
    setIsBackVisible(true)
  }

  const handleGrade = async (grade: ReviewGrade) => {
    if (!currentCard || isSubmittingReview) return

    setIsSubmittingReview(true)
    setReviewError(null)

    try {
      await reviewCard(currentCard, grade)

      if (isLastCard) {
        setIsSessionComplete(true)
        return
      }

      setCurrentIndex((index) => index + 1)
      setIsBackVisible(false)
    } catch (reviewMutationError) {
      setReviewError(
        reviewMutationError instanceof Error
          ? reviewMutationError.message
          : t("saveErrorTitle"),
      )
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (isLoading || (!error && sessionCards.length === 0)) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator color={theme.colors.accent} />
        <Text style={styles.supportingText}>{t("loading")}</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.title}>{t("loadErrorTitle")}</Text>
        <Text style={styles.supportingText}>{error.message}</Text>
      </View>
    )
  }

  if (sessionCards.length === 0) {
    return null
  }

  const handleReviewGrade = (grade: ReviewGrade) => {
    void handleGrade(grade)
  }

  if (isSessionComplete) {
    return (
      <>
        <Stack.Screen
          options={{
            title: isIOS ? "" : undefined,
            headerTransparent: isIOS,
            headerShadowVisible: false,
            ...(isIOS
              ? {
                  headerLeft: () => (
                    <IconButtonClose
                      accessibilityLabel={t("closeAccessibilityLabel")}
                      onPress={handleClose}
                      style={styles.headerButton}
                      tintColor={theme.colors.primary}
                    />
                  ),
                }
              : {
                  header: () =>
                    isAndroid ? (
                      <AndroidHeader
                        closeAccessibilityLabel={t("closeAccessibilityLabel")}
                        onClose={handleClose}
                      />
                    ) : null,
                }),
          }}
        />
        <View style={styles.container}>
          <CompletedReviewState
            cardCount={sessionCards.length}
            onClose={handleClose}
          />
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isIOS ? "" : undefined,
          headerTransparent: isIOS,
          headerShadowVisible: false,
          ...(isIOS
            ? {
                headerLeft: () => (
                  <IconButtonClose
                    accessibilityLabel={t("closeAccessibilityLabel")}
                    onPress={handleClose}
                    style={styles.headerButton}
                    tintColor={theme.colors.primary}
                  />
                ),
              }
            : {
                header: () =>
                  isAndroid ? (
                    <AndroidHeader
                      closeAccessibilityLabel={t("closeAccessibilityLabel")}
                      onClose={handleClose}
                    />
                  ) : null,
              }),
        }}
      />
      <View style={styles.container}>
        <ActiveReviewState
          cardId={currentCard?.id ?? String(currentIndex)}
          tag={currentCard?.tag ?? ""}
          progressLabel={progressLabel}
          visibleSide={visibleSide}
          visibleHtml={visibleHtml}
          isSubmitting={isSubmittingReview}
          errorMessage={reviewError}
          onReveal={handleReveal}
          onGrade={handleReviewGrade}
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
  headerButton: {
    backgroundColor: theme.colors.chromeMuted,
  },
}))
