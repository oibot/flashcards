import { useDb } from "@/db/db-context"

export function useTags() {
  const { cardStore } = useDb()
  const { useTagsQuery } = cardStore
  const { tags, error, isLoading } = useTagsQuery()

  return {
    tags,
    error,
    isLoading,
  }
}
