import { FlatList, Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"
import type { Deck } from "@/domain/deck"
import { useDecks } from "@/hooks/useDecks"

export default function DecksScene() {
  const { decks } = useDecks()

  const renderItem = ({ item }: { item: Deck }) => {
    const cardCount = item.cardCount ?? "—"

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardCount}>{cardCount} cards</Text>
        </View>
        <Text style={styles.cardDescription}>{item.description ?? ""}</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={decks}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      contentInsetAdjustmentBehavior="automatic"
      renderItem={renderItem}
    />
  )
}

const styles = StyleSheet.create((theme) => ({
  listContent: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  card: {
    borderColor: theme.colors.primary,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.primary,
    flex: 1,
  },
  cardCount: {
    fontSize: 12,
    color: theme.colors.primary,
    opacity: 0.7,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.primary,
    opacity: 0.8,
  },
}))
