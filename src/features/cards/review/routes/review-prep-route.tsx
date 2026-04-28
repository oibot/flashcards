import { useRouter } from "expo-router"

import ReviewPrepScreen from "@/features/cards/review/screens/review-prep-screen"

export default function ReviewPrepRoute() {
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
    <ReviewPrepScreen
      onNewCard={handleNewCard}
      onReviewAllStart={handleOnReviewAllStart}
      onReviewStart={handleOnReviewStart}
    />
  )
}
