import { useRouter } from "expo-router"

import EditCardScreen from "@/features/cards/edit/screens/edit-card-screen"

export default function NewCardRoute() {
  const { dismiss } = useRouter()

  const handleClose = () => {
    dismiss()
  }

  return <EditCardScreen onClose={handleClose} />
}
