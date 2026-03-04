import ReviewScene from "@/components/review/review-scene"
import { useRouter } from "expo-router"

export default function Page() {
  const router = useRouter()

  function handleNewCard() {
    router.push("/new-card")
  }

  return <ReviewScene onNewCard={handleNewCard} />
}
