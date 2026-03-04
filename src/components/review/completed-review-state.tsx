import { Pressable, Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

type Props = {
  cardCount: number
  onClose: () => void
}

export default function CompletedReviewState({ cardCount, onClose }: Props) {
  return (
    <View style={styles.centerContent}>
      <Text style={styles.title}>Review complete</Text>
      <Text style={styles.supportingText}>
        You reviewed {cardCount} {cardCount === 1 ? "card" : "cards"}.
      </Text>
      <View style={styles.actions}>
        <Pressable onPress={onClose} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonLabel}>Close</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  actions: {
    gap: 12,
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
  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: theme.colors.chromeMuted,
  },
  secondaryButtonLabel: {
    ...theme.typography.styles.headline,
    color: theme.colors.primary,
  },
}))
