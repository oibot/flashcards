import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import type { Card } from "@/domain/card"
import type { ReviewGrade } from "@/domain/review-scheduler"
import type { ReviewSessionSeed } from "@/domain/review-session"
import { useDueCards } from "@/hooks/useDueCards"

type UseReviewSessionOptions = {
  initialSeed?: ReviewSessionSeed
}

export function useReviewSession({
  initialSeed,
}: UseReviewSessionOptions = {}) {
  const { dismiss } = useRouter()
  const { t } = useTranslation("common", { keyPrefix: "reviewSession" })
  const {
    cards: dueCards,
    isLoading,
    error,
    removeCard,
    reviewCard,
  } = useDueCards()
  const [sessionCards, setSessionCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isBackVisible, setIsBackVisible] = useState(false)
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isDeletingCard, setIsDeletingCard] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const initialCards = initialSeed?.cards ?? dueCards
  const currentCard = sessionCards[currentIndex] ?? null
  const isLastCard = currentIndex === sessionCards.length - 1
  const isMutatingCard = isSubmittingReview || isDeletingCard
  const progressLabel =
    sessionCards.length > 0
      ? `${currentIndex + 1} / ${sessionCards.length}`
      : "0 / 0"
  const visibleSide: "front" | "back" = isBackVisible ? "back" : "front"
  const visibleHtml = currentCard
    ? isBackVisible
      ? currentCard.backHtml
      : currentCard.frontHtml
    : ""

  useEffect(() => {
    if (isSessionComplete || sessionCards.length > 0 || isLoading || error) {
      return
    }

    if (initialCards.length === 0) {
      dismiss()
      return
    }

    setSessionCards(initialCards)
  }, [
    dismiss,
    error,
    initialCards,
    isLoading,
    isSessionComplete,
    sessionCards.length,
  ])

  const close = () => {
    dismiss()
  }

  const reveal = () => {
    setIsBackVisible(true)
  }

  const grade = async (reviewGrade: ReviewGrade) => {
    if (!currentCard || isMutatingCard) return

    setIsSubmittingReview(true)
    setMutationError(null)

    try {
      await reviewCard(currentCard, reviewGrade)
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

  const deleteCurrentConfirmed = async () => {
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

  const deleteCurrent = () => {
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
          void deleteCurrentConfirmed()
        },
      },
    ])
  }

  return {
    currentCard,
    error,
    isComplete: isSessionComplete,
    isLoading:
      isLoading || (!error && !isSessionComplete && sessionCards.length === 0),
    isMutatingCard,
    mutationError,
    progressLabel,
    reviewedCount,
    visibleHtml,
    visibleSide,
    close,
    deleteCurrent,
    grade,
    reveal,
  }
}
