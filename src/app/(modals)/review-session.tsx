import { useRouter } from "expo-router"

import ReviewSessionScene from "@/features/cards/review/review-session-scene"

export default function Page() {
  const { dismiss, push } = useRouter()

  return (
    <ReviewSessionScene
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
