import { Pressable, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import ReviewCardContent from "./review-card-content"

const CARD_HEIGHT_RATIO = 0.65

type Props = {
  cardId: string
  headerLabel: string
  visibleSide: "front" | "back"
  visibleHtml: string
  isSubmitting: boolean
  onReveal: () => void
}

export default function ReviewCard({
  cardId,
  headerLabel,
  visibleSide,
  visibleHtml,
  isSubmitting,
  onReveal,
}: Props) {
  const { rt } = useUnistyles()
  const isAnswerVisible = visibleSide === "back"
  const cardHeight = rt.screen.height * CARD_HEIGHT_RATIO

  return (
    <View style={styles.cardStage}>
      <Pressable
        accessibilityRole={!isAnswerVisible ? "button" : undefined}
        disabled={isSubmitting || isAnswerVisible}
        onPress={onReveal}
        style={[styles.cardSurface, { minHeight: cardHeight }]}
      >
        <Text numberOfLines={1} style={styles.tagLabel}>
          {headerLabel}
        </Text>
        <View pointerEvents="none" style={styles.cardContainer}>
          <ReviewCardContent
            key={`${cardId}-${visibleSide}`}
            html={visibleHtml}
          />
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  cardStage: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cardSurface: {
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 18,
    gap: 16,
    borderRadius: 28,
    borderCurve: "continuous",
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.chromeMuted,
    boxShadow: `0 18px 30px ${theme.colors.shadowSoft}`,
  },
  tagLabel: {
    ...theme.typography.styles.caption,
    textAlign: "center",
    color: theme.colors.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
}))
