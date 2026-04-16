import { useEffect, useRef, useState } from "react"

import type { Card } from "@/domain/card"
import { useEditCardEditors } from "@/hooks/use-edit-card-editors"
import { useEditCardTags } from "@/hooks/use-edit-card-tags"
import { normalizeHtmlForComparison } from "@/utils/html"

type UseEditCardFormOptions = {
  initialCard?: Card
}

const areTagsEqual = (left: string[], right: string[]) => {
  return (
    left.length === right.length &&
    left.every((tag, index) => tag === right[index])
  )
}

export function useEditCardForm({ initialCard }: UseEditCardFormOptions = {}) {
  const {
    activeStyles,
    backRef,
    currentStylesState,
    frontRef,
    handleEditorFocus,
    handleEditorStateChange,
    handleToggleStyle,
    resetEditors,
  } = useEditCardEditors()
  const { availableTags, handleAddTag, resetTags, setTags, tagInputRef, tags } =
    useEditCardTags()
  const hydratedCardIdRef = useRef<string | null>(null)
  const [hasOppositeDirection, setHasOppositeDirection] = useState(false)

  useEffect(() => {
    if (!initialCard || hydratedCardIdRef.current === initialCard.id) {
      return
    }

    setTags(initialCard.tags)
    frontRef.current?.setValue(initialCard.frontHtml)
    backRef.current?.setValue(initialCard.backHtml)
    hydratedCardIdRef.current = initialCard.id
  }, [backRef, frontRef, initialCard, setTags])

  const hasUnsavedChanges = async () => {
    const frontHtml = normalizeHtmlForComparison(
      await frontRef.current?.getHTML(),
    )
    const backHtml = normalizeHtmlForComparison(
      await backRef.current?.getHTML(),
    )
    const initialTags = initialCard?.tags ?? []
    const initialFrontHtml = normalizeHtmlForComparison(initialCard?.frontHtml)
    const initialBackHtml = normalizeHtmlForComparison(initialCard?.backHtml)

    return (
      !areTagsEqual(tags, initialTags) ||
      (!initialCard && hasOppositeDirection) ||
      tagInputRef.current?.hasPendingInput() === true ||
      frontHtml !== initialFrontHtml ||
      backHtml !== initialBackHtml
    )
  }

  const getDraft = async () => {
    const frontHtml = (await frontRef.current?.getHTML()) ?? ""
    const backHtml = (await backRef.current?.getHTML()) ?? ""
    const nextTags = tagInputRef.current?.commitInput() ?? tags
    return {
      backHtml,
      hasOppositeDirection,
      frontHtml,
      tags: nextTags,
    }
  }

  const resetForm = () => {
    setHasOppositeDirection(false)
    resetTags()
    resetEditors()
  }

  return {
    activeStyles,
    backRef,
    currentStylesState,
    frontRef,
    getDraft,
    handleAddTag,
    handleEditorFocus,
    handleEditorStateChange,
    handleToggleStyle,
    hasUnsavedChanges,
    hasOppositeDirection,
    resetForm,
    setHasOppositeDirection,
    setTags,
    tagInputRef,
    availableTags,
    tags,
  }
}
