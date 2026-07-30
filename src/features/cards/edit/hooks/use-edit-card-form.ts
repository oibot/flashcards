import { useEffect, useRef, useState } from "react"

import { useEditCardEditors } from "@/features/cards/edit/hooks/use-edit-card-editors"
import { useEditCardTags } from "@/features/cards/edit/hooks/use-edit-card-tags"
import type { Card, VisibleCardSide } from "@/features/cards/model/card"
import {
  hasMeaningfulHtmlContent,
  normalizeHtmlForComparison,
} from "@/shared/lib/html"

type UseEditCardFormOptions = {
  initialCard?: Card
}

export type EditCardDraft = {
  backHtml: string
  frontHtml: string
  hasOppositeDirection: boolean
  tags: string[]
}

type ResetFormOptions = {
  preserveTags?: boolean
}

const areTagsEqual = (left: string[], right: string[]) => {
  return (
    left.length === right.length &&
    left.every((tag, index) => tag === right[index])
  )
}

export function useEditCardForm({ initialCard }: UseEditCardFormOptions = {}) {
  const {
    backRef,
    currentStylesState,
    frontRef,
    handleEditorFocus,
    handleEditorStateChange,
    handleSetAlignment,
    handleSetTextSize,
    handleToggleInlineStyle,
    resetEditors,
  } = useEditCardEditors()
  const { availableTags, handleAddTag, resetTags, setTags, tagInputRef, tags } =
    useEditCardTags()
  const hydratedCardIdRef = useRef<string | null>(null)
  const [editorHtml, setEditorHtml] = useState({
    back: initialCard?.backHtml ?? "",
    front: initialCard?.frontHtml ?? "",
  })
  const [hasOppositeDirection, setHasOppositeDirection] = useState(false)
  const isDraftValid =
    hasMeaningfulHtmlContent(editorHtml.front) &&
    hasMeaningfulHtmlContent(editorHtml.back)

  useEffect(() => {
    if (!initialCard || hydratedCardIdRef.current === initialCard.id) {
      return
    }

    setTags(initialCard.tags)
    frontRef.current?.setValue(initialCard.frontHtml)
    backRef.current?.setValue(initialCard.backHtml)
    setEditorHtml({
      back: initialCard.backHtml,
      front: initialCard.frontHtml,
    })
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

  const handleEditorHtmlChange = (side: VisibleCardSide, html: string) => {
    setEditorHtml((currentHtml) => ({ ...currentHtml, [side]: html }))
  }

  const getDraft = async (): Promise<EditCardDraft> => {
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

  const resetForm = ({ preserveTags = false }: ResetFormOptions = {}) => {
    setHasOppositeDirection(false)
    setEditorHtml({ back: "", front: "" })
    if (!preserveTags) resetTags()
    resetEditors()
  }

  return {
    backRef,
    currentStylesState,
    frontRef,
    getDraft,
    handleAddTag,
    handleEditorFocus,
    handleEditorHtmlChange,
    handleEditorStateChange,
    handleSetAlignment,
    handleSetTextSize,
    handleToggleInlineStyle,
    hasUnsavedChanges,
    hasOppositeDirection,
    isDraftValid,
    resetForm,
    setHasOppositeDirection,
    setTags,
    tagInputRef,
    availableTags,
    tags,
  }
}
