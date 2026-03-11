import { Stack, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Alert, Platform, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import ActiveReviewState from "@/components/review/active-review-state"
import CompletedReviewState from "@/components/review/completed-review-state"
import AndroidHeader from "@/components/UI/android-header"
import { IconButtonClose, IconButtonTrash } from "@/components/UI/icon-button"
import type { Card } from "@/domain/card"
import type { ReviewGrade } from "@/domain/review-scheduler"
import { useDueCards } from "@/hooks/useDueCards"

export default function ReviewSessionScene() {
  const { theme } = useUnistyles()
  const { dismiss } = useRouter()
  const { t } = useTranslation("common", { keyPrefix: "reviewSession" })
  const {
    cards: dueCards,
    isLoading,
    error,
    removeCard,
    reviewCard,
  } = useDueCards()
  const isIOS = Platform.OS === "ios"
  const isAndroid = Platform.OS === "android"
  const [sessionCards, setSessionCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isBackVisible, setIsBackVisible] = useState(false)
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isDeletingCard, setIsDeletingCard] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const currentCard = sessionCards[currentIndex] ?? null
  const isLastCard = currentIndex === sessionCards.length - 1
  const isMutatingCard = isSubmittingReview || isDeletingCard
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
    if (isSessionComplete || sessionCards.length > 0 || isLoading || error) {
      return
    }

    if (dueCards.length === 0) {
      dismiss()
      return
    }

    setSessionCards(dueCards)
  }, [
    dismiss,
    dueCards,
    error,
    isLoading,
    isSessionComplete,
    sessionCards.length,
  ])

  const handleClose = () => {
    dismiss()
  }

  const handleReveal = () => {
    setIsBackVisible(true)
  }

  const handleGrade = async (grade: ReviewGrade) => {
    if (!currentCard || isMutatingCard) return

    setIsSubmittingReview(true)
    setMutationError(null)

    try {
      await reviewCard(currentCard, grade)
      setReviewedCount((count) => count + 1)

      if (isLastCard) {
        setIsSessionComplete(true)
        setIsBackVisible(false)
        return
      }

      setCurrentIndex((index) => index + 1)
      setIsBackVisible(false)
    } catch (reviewMutationError) {
      setMutationError(
        reviewMutationError instanceof Error
          ? reviewMutationError.message
          : t("saveErrorTitle"),
      )
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!currentCard || isMutatingCard) return

    setIsDeletingCard(true)
    setMutationError(null)

    try {
      await removeCard(currentCard.id)

      const nextSessionCards = sessionCards.filter(
        (card) => card.id !== currentCard.id,
      )

      setSessionCards(nextSessionCards)
      setCurrentIndex(
        nextSessionCards.length === 0
          ? 0
          : Math.min(currentIndex, nextSessionCards.length - 1),
      )
      setIsBackVisible(false)

      if (nextSessionCards.length === 0) {
        setIsSessionComplete(true)
      }
    } catch (removeCardError) {
      setMutationError(
        removeCardError instanceof Error
          ? removeCardError.message
          : t("delete.error"),
      )
    } finally {
      setIsDeletingCard(false)
    }
  }

  const handleDelete = () => {
    if (!currentCard || isMutatingCard) return

    Alert.alert(t("delete.title"), t("delete.message"), [
      {
        text: t("delete.cancel"),
        style: "cancel",
      },
      {
        text: t("delete.confirm"),
        style: "destructive",
        onPress: () => {
          void handleDeleteConfirmed()
        },
      },
    ])
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
            cardCount={reviewedCount}
            onClose={handleClose}
          />
        </View>
      </>
    )
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
                unstable_headerRightItems: () => [
                  {
                    type: "button",
                    label: t("delete.accessibilityLabel"),
                    icon: { type: "sfSymbol", name: "trash" },
                    tintColor: theme.colors.destructive,
                    onPress: handleDelete,
                  },
                ],
              }
            : {
                header: () =>
                  isAndroid ? (
                    <AndroidHeader
                      closeAccessibilityLabel={t("closeAccessibilityLabel")}
                      onClose={handleClose}
                      rightAction={
                        <IconButtonTrash
                          accessibilityLabel={t("delete.accessibilityLabel")}
                          disabled={isMutatingCard}
                          onPress={handleDelete}
                          style={styles.headerButton}
                          tintColor={theme.colors.destructive}
                        />
                      }
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
          isSubmitting={isMutatingCard}
          errorMessage={mutationError}
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
