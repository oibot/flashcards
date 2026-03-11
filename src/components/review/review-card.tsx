import { Pressable, Text, View } from "react-native"
import { EnrichedTextInput } from "react-native-enriched"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

const cardLayers = [
  {
    key: "far",
    width: "94%",
    heightRatio: 0.61,
    overlapRatio: 0,
    opacity: 0.5,
    zIndex: 1,
  },
  {
    key: "near",
    width: "97%",
    heightRatio: 0.63,
    overlapRatio: 0.92,
    opacity: 0.78,
    zIndex: 2,
  },
] as const

const mainCard = {
  heightRatio: 0.65,
  overlapRatio: 0.94,
  zIndex: 3,
} as const

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
  const cardHeight = rt.screen.height * mainCard.heightRatio

  return (
    <View style={styles.cardStage}>
      <View style={styles.stackColumn}>
        {cardLayers.map((layer, index) => (
          <View
            key={layer.key}
            style={[
              styles.cardLayer,
              {
                height: rt.screen.height * layer.heightRatio,
                marginTop: index === 0 ? 0 : -cardHeight * layer.overlapRatio,
                opacity: layer.opacity,
                width: layer.width,
                zIndex: layer.zIndex,
              },
            ]}
          />
        ))}
        <Pressable
          accessibilityRole={!isAnswerVisible ? "button" : undefined}
          disabled={isSubmitting || isAnswerVisible}
          onPress={onReveal}
          style={[
            styles.cardSurface,
            {
              marginTop: -cardHeight * mainCard.overlapRatio,
              minHeight: cardHeight,
              zIndex: mainCard.zIndex,
            },
          ]}
        >
          <Text numberOfLines={1} style={styles.tagLabel}>
            {headerLabel}
          </Text>
          <View pointerEvents="none" style={styles.cardContainer}>
            <EnrichedTextInput
              key={`${cardId}-${visibleSide}`}
              defaultValue={visibleHtml}
              editable={false}
              scrollEnabled={false}
              style={styles.cardContent}
            />
          </View>
        </Pressable>
      </View>
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
  stackColumn: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  cardLayer: {
    alignSelf: "center",
    borderRadius: 28,
    borderCurve: "continuous",
    backgroundColor: theme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: theme.colors.chromeMuted,
  },
  cardSurface: {
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 18,
    borderRadius: 28,
    borderCurve: "continuous",
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.chromeMuted,
    justifyContent: "space-between",
    boxShadow: `0 18px 30px ${theme.colors.chromeMuted}`,
  },
  tagLabel: {
    ...theme.typography.styles.caption,
    color: theme.colors.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardContainer: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
    color: theme.colors.primary,
    padding: 8,
  },
}))
