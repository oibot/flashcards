import { Stack, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import ActiveReviewState from "@/components/review/active-review-state"
import CompletedReviewState from "@/components/review/completed-review-state"
import HeaderButtonIcon from "@/components/UI/header-button-icon"
import { useCards } from "@/hooks/useCards"

export default function ReviewSessionScene() {
  const { theme } = useUnistyles()
  const { dismiss } = useRouter()
  const { cards, isLoading, error } = useCards()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isBackVisible, setIsBackVisible] = useState(false)
  const [isSessionComplete, setIsSessionComplete] = useState(false)

  const currentCard = cards[currentIndex] ?? null
  const isLastCard = cards.length > 0 && currentIndex === cards.length - 1
  const progressLabel =
    cards.length > 0 ? `${currentIndex + 1} / ${cards.length}` : "0 / 0"
  const visibleSide = isBackVisible ? "back" : "front"
  const visibleHtml = currentCard
    ? isBackVisible
      ? currentCard.backHtml
      : currentCard.frontHtml
    : ""

  useEffect(() => {
    if (cards.length === 0) {
      setCurrentIndex(0)
      setIsBackVisible(false)
      setIsSessionComplete(false)
      return
    }

    if (currentIndex >= cards.length) {
      setCurrentIndex(cards.length - 1)
    }
  }, [cards.length, currentIndex])

  useEffect(() => {
    if (!isLoading && !error && cards.length === 0) {
      dismiss()
    }
  }, [cards.length, dismiss, error, isLoading])

  const handleClose = () => {
    dismiss()
  }

  const handleReveal = () => {
    setIsBackVisible(true)
  }

  const handleNext = () => {
    if (isLastCard) {
      setIsSessionComplete(true)
      return
    }

    setCurrentIndex((index) => index + 1)
    setIsBackVisible(false)
  }

  if (isLoading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator color={theme.colors.accent} />
        <Text style={styles.supportingText}>Loading cards…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.title}>Couldn’t load cards</Text>
        <Text style={styles.supportingText}>{error.message}</Text>
      </View>
    )
  }

  if (cards.length === 0) {
    return null
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Review",
          headerLeft: () => (
            <HeaderButtonIcon
              icon="xmark"
              accessibilityLabel="Close review"
              onPress={handleClose}
              style={styles.headerButton}
              tintColor={theme.colors.primary}
            />
          ),
        }}
      />
      <View style={styles.container}>
        {isSessionComplete ? (
          <CompletedReviewState
            cardCount={cards.length}
            onClose={handleClose}
          />
        ) : (
          <ActiveReviewState
            cardId={currentCard?.id ?? String(currentIndex)}
            tag={currentCard?.tag ?? ""}
            progressLabel={progressLabel}
            visibleSide={visibleSide}
            visibleHtml={visibleHtml}
            actionLabel={
              !isBackVisible ? "Reveal Answer" : isLastCard ? "Finish" : "Next"
            }
            onPrimaryAction={!isBackVisible ? handleReveal : handleNext}
          />
        )}
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
