import { useDb } from "@/features/cards/data/db-context"

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
