import { useRouter } from "expo-router"

import EditCardScreen from "@/features/cards/edit/screens/edit-card-screen"

export default function NewCardRoute() {
  const { canDismiss, dismiss, replace } = useRouter()

  const handleClose = () => {
    if (canDismiss()) {
      dismiss()
      return
    }

    replace("/")
  }

  return <EditCardScreen onClose={handleClose} />
}
