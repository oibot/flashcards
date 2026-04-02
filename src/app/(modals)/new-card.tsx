import { useRouter } from "expo-router"

import EditCard from "@/components/edit-card/edit-card"

export default function Page() {
  const { dismiss } = useRouter()

  return <EditCard onClose={dismiss} />
}
