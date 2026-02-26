import { StyleSheet, useUnistyles } from "react-native-unistyles"
import { useDecks } from "@/hooks/useDecks"
import DecksList from "@/components/home/decks-list"

export default function DecksScene() {
  const { decks } = useDecks()


  return (
    <DecksList decks={decks}/>
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
