import { useDecks } from "@/hooks/useDecks"
import DecksList from "@/components/home/decks-list"

export default function DecksScene() {
  const { decks } = useDecks()

  return (
    <DecksList decks={decks} />
  )
}
