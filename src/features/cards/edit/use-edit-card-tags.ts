import { useRef, useState } from "react"

import { parseTags } from "@/features/cards/model/card"
import { useTags } from "@/features/cards/queries/use-tags"
import { type TagInputHandle } from "@/shared/ui/tag-input"

export function useEditCardTags() {
  const tagInputRef = useRef<TagInputHandle>(null)
  const [tags, setTags] = useState<string[]>([])
  const { tags: existingTags } = useTags()
  const availableTags = existingTags.filter((tag) => !tags.includes(tag))

  const handleAddTag = (tag: string) => {
    setTags((currentTags) => parseTags([...currentTags, tag]))
  }

  const resetTags = () => {
    setTags([])
    tagInputRef.current?.clear()
    tagInputRef.current?.focus()
  }

  return {
    availableTags,
    handleAddTag,
    resetTags,
    setTags,
    tagInputRef,
    tags,
  }
}
