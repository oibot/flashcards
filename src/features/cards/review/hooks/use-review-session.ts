import { useEffect, useMemo, useReducer, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import type { Card } from "@/features/cards/model/card"
import type { ReviewGrade } from "@/features/cards/model/review-scheduler"
import type { ReviewSessionSeed } from "@/features/cards/model/review-session"
import { useCards } from "@/features/cards/queries/use-cards"

type UseReviewSessionOptions = {
  initialSeed?: ReviewSessionSeed
}

type SessionCardsAction =
  | { cards: Card[]; type: "initialize" }
  | { cards: Card[]; type: "replace" }
  | { liveCardById: Map<string, Card>; type: "sync-live" }

function sessionCardsReducer(
  sessionCards: Card[],
  action: SessionCardsAction,
): Card[] {
  switch (action.type) {
    case "initialize":
    case "replace":
      return action.cards
    case "sync-live": {
      let didChange = false
      const nextSessionCards = sessionCards.map((card) => {
        const liveCard = action.liveCardById.get(card.id)

        if (!liveCard || areCardsEquivalent(liveCard, card)) {
          return card
        }

        didChange = true
        return liveCard
      })

      return didChange ? nextSessionCards : sessionCards
    }
  }
}

const areCardsEquivalent = (left: Card, right: Card) => {
  return (
    left.id === right.id &&
    left.cardSetId === right.cardSetId &&
    left.variant === right.variant &&
    left.frontHtml === right.frontHtml &&
    left.backHtml === right.backHtml &&
    left.frontHasSound === right.frontHasSound &&
    left.backHasSound === right.backHasSound &&
    left.updatedAt === right.updatedAt &&
    left.tags.length === right.tags.length &&
    left.tags.every((tag, index) => tag === right.tags[index])
  )
}

export function useReviewSession({
  initialSeed,
}: UseReviewSessionOptions = {}) {
  const { t } = useTranslation("common", { keyPrefix: "reviewSession" })
  const {
    cards: liveCards,
    isLoading: areCardsLoading,
    error: cardsError,
    removeCard,
    reviewCard,
  } = useCards()
  const [sessionCards, dispatchSessionCards] = useReducer(
    sessionCardsReducer,
    [],
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isBackVisible, setIsBackVisible] = useState(false)
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [isDeletingCard, setIsDeletingCard] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const hasInitialSeed = initialSeed !== undefined
  const initialCards = initialSeed?.cards ?? liveCards
  const currentCard = sessionCards[currentIndex] ?? null
  const isLastCard = currentIndex === sessionCards.length - 1
  const isMutatingCard = isDeletingCard
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
  const liveCardById = useMemo(
    () => new Map(liveCards.map((card) => [card.id, card])),
    [liveCards],
  )

  useEffect(() => {
    if (
      isSessionComplete ||
      sessionCards.length > 0 ||
      (!hasInitialSeed && areCardsLoading) ||
      (!hasInitialSeed && cardsError) ||
      initialCards.length === 0
    ) {
      return
    }

    dispatchSessionCards({ cards: initialCards, type: "initialize" })
  }, [
    areCardsLoading,
    cardsError,
    hasInitialSeed,
    initialCards,
    isSessionComplete,
    sessionCards.length,
  ])

  useEffect(() => {
    if (sessionCards.length === 0) {
      return
    }

    dispatchSessionCards({ liveCardById, type: "sync-live" })
  }, [liveCardById, sessionCards.length])

  const reveal = () => {
    setIsBackVisible(true)
  }

  const showFront = () => {
    if (isMutatingCard) return

    setIsBackVisible(false)
  }

  const grade = (reviewGrade: ReviewGrade) => {
    if (!currentCard || isMutatingCard) return

    reviewCard(currentCard, reviewGrade)
    setMutationError(null)
    setReviewedCount((count) => count + 1)

    if (isLastCard) {
      setIsSessionComplete(true)
      setIsBackVisible(false)
      return
    }

    setCurrentIndex((index) => index + 1)
    setIsBackVisible(false)
  }

  const deleteCurrentConfirmed = async () => {
    if (!currentCard || isMutatingCard) return

    setIsDeletingCard(true)
    setMutationError(null)

    try {
      await removeCard(currentCard.id)

      const nextSessionCards = sessionCards.filter(
        (card) => card.cardSetId !== currentCard.cardSetId,
      )

      dispatchSessionCards({ cards: nextSessionCards, type: "replace" })
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
    error: hasInitialSeed ? null : cardsError,
    isComplete: isSessionComplete,
    isLoading:
      (!hasInitialSeed && areCardsLoading) ||
      (!hasInitialSeed &&
        !cardsError &&
        !isSessionComplete &&
        sessionCards.length === 0),
    isMutatingCard,
    mutationError,
    progressLabel,
    reviewedCount,
    shouldClose:
      (!hasInitialSeed ? !areCardsLoading && !cardsError : true) &&
      !isSessionComplete &&
      sessionCards.length === 0 &&
      initialCards.length === 0,
    visibleHtml,
    visibleSide,
    deleteCurrent,
    grade,
    reveal,
    showFront,
  }
}
