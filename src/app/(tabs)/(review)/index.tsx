import ReviewPrepScene from "@/components/review/review-prep-scene"
import { useRouter } from "expo-router"

export default function Page() {
  const router = useRouter()

  const handleNewCard = () => {
    router.push("/new-card")
  }

  const handleOnReviewStart = () => {
    router.push("/review")
  }

  return (
    <ReviewPrepScene
      onNewCard={handleNewCard}
      onReviewStart={handleOnReviewStart}
    />
  )
}
