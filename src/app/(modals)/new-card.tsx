import { useRouter } from "expo-router"

import EditCard from "@/features/cards/edit/edit-card"

export default function Page() {
  const { dismiss } = useRouter()

  return <EditCard onClose={dismiss} />
}
