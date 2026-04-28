import { useRouter } from "expo-router"

import ReviewPrepScene from "@/features/cards/review/review-prep-scene"

export default function Page() {
  const { push } = useRouter()

  const handleNewCard = () => {
    push("/new-card")
  }

  const handleOnReviewStart = () => {
    push("/review-session")
  }

  const handleOnReviewAllStart = () => {
    push("/review-session")
  }

  return (
    <ReviewPrepScene
      onNewCard={handleNewCard}
      onReviewAllStart={handleOnReviewAllStart}
      onReviewStart={handleOnReviewStart}
    />
  )
}
