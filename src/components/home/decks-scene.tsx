import { useDecks } from "@/hooks/useDecks"
import DecksList from "@/components/home/decks-list"
import EditCard from "./edit-card"

export default function DecksScene() {
  const { decks } = useDecks()

  return (
    <EditCard />
  )
}
