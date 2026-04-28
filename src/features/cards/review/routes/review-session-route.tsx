import { useRouter } from "expo-router"

import ReviewSessionScreen from "@/features/cards/review/screens/review-session-screen"

export default function ReviewSessionRoute() {
  const { dismiss, push } = useRouter()

  return (
    <ReviewSessionScreen
      onClose={dismiss}
      onEditCard={(cardId) => {
        push({
          pathname: "/edit-card/[id]",
          params: {
            id: cardId,
          },
        })
      }}
    />
  )
}
