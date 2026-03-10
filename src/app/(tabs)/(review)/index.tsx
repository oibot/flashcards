import { useRouter } from "expo-router"

import ReviewPrepScene from "@/components/review/review-prep-scene"

export default function Page() {
  const { push } = useRouter()

  const handleNewCard = () => {
    push("/new-card")
  }

  const handleOnReviewStart = () => {
    push("/review-session")
  }

  return (
    <ReviewPrepScene
      onNewCard={handleNewCard}
      onReviewStart={handleOnReviewStart}
    />
  )
}
