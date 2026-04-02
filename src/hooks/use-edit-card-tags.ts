import { useRef, useState } from "react"

import { type TagInputHandle } from "@/components/UI/tag-input"
import { parseTags } from "@/domain/card"
import { useTags } from "@/hooks/use-tags"

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
