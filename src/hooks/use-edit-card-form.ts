import { useRouter } from "expo-router"
import { type RefObject, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"
import type {
  EnrichedTextInputInstance,
  OnChangeStateEvent,
} from "react-native-enriched"

import { type TagInputHandle } from "@/components/UI/tag-input"
import {
  type SharedToolbarState,
  stateKeyByItemName,
  type ToolbarItem,
  type ToolbarStyleKey,
} from "@/components/UI/toolbar"
import type { Card } from "@/domain/card"
import { parseTags } from "@/domain/card"
import { useCard } from "@/hooks/use-card"
import { useCards } from "@/hooks/use-cards"

type EditorSide = "front" | "back"

const DEFAULT_SHARED_STYLES: SharedToolbarState = {
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  h1: false,
  h2: false,
  h3: false,
}

const toggleEditorStyle = (
  editorRef: RefObject<EnrichedTextInputInstance | null>,
  styleKey: ToolbarStyleKey,
) => {
  const editor = editorRef.current
  if (!editor) return

  switch (styleKey) {
    case "bold":
      editor.toggleBold()
      break
    case "italic":
      editor.toggleItalic()
      break
    case "underline":
      editor.toggleUnderline()
      break
    case "strikeThrough":
      editor.toggleStrikeThrough()
      break
    case "h1":
      editor.toggleH1()
      break
    case "h2":
      editor.toggleH2()
      break
    case "h3":
      editor.toggleH3()
      break
  }
}

const getSharedStylesFromState = (
  stylesState: OnChangeStateEvent | null,
): SharedToolbarState => {
  if (!stylesState) return DEFAULT_SHARED_STYLES

  return {
    bold: stylesState.bold.isActive,
    italic: stylesState.italic.isActive,
    underline: stylesState.underline.isActive,
    strikeThrough: stylesState.strikeThrough.isActive,
    h1: stylesState.h1.isActive,
    h2: stylesState.h2.isActive,
    h3: stylesState.h3.isActive,
  }
}

const hasMeaningfulHtmlContent = (html: string) => {
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0
  )
}

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
  const { addCard, cards } = useCards()
  const { updateCard } = useCard(initialCard?.id)
  const { back, canGoBack, replace } = useRouter()
  const { t } = useTranslation("common", { keyPrefix: "editCard" })
  const tagInputRef = useRef<TagInputHandle>(null)
  const frontRef = useRef<EnrichedTextInputInstance>(null)
  const backRef = useRef<EnrichedTextInputInstance>(null)
  const [tags, setTags] = useState<string[]>([])
  const [focusedEditor, setFocusedEditor] = useState<EditorSide | null>(null)
  const [currentStylesState, setCurrentStylesState] =
    useState<OnChangeStateEvent | null>(null)
  const hydratedCardIdRef = useRef<string | null>(null)
  const existingTags = [...new Set(cards.flatMap((card) => card.tags))].sort()
  const availableTags = existingTags.filter((tag) => !tags.includes(tag))

  useEffect(() => {
    if (!initialCard || hydratedCardIdRef.current === initialCard.id) {
      return
    }

    setTags(initialCard.tags)
    frontRef.current?.setValue(initialCard.frontHtml)
    backRef.current?.setValue(initialCard.backHtml)
    hydratedCardIdRef.current = initialCard.id
  }, [initialCard])

  const handleEditorFocus = (editor: EditorSide) => {
    setFocusedEditor(editor)
  }

  const handleEditorStateChange = (
    editor: EditorSide,
    nextState: OnChangeStateEvent,
  ) => {
    if (focusedEditor === null || focusedEditor === editor) {
      setCurrentStylesState(nextState)
    }
  }

  const handleToggleStyle = (item: ToolbarItem) => {
    const styleKey = stateKeyByItemName[item.name]

    toggleEditorStyle(frontRef, styleKey)
    toggleEditorStyle(backRef, styleKey)
  }

  const handleAddTag = (tag: string) => {
    setTags((currentTags) => parseTags([...currentTags, tag]))
  }

  const close = () => {
    if (canGoBack()) {
      back()
      return
    }

    replace("/(tabs)/(review)")
  }

  const hasUnsavedChanges = async () => {
    const frontHtml = (await frontRef.current?.getHTML()) ?? ""
    const backHtml = (await backRef.current?.getHTML()) ?? ""
    const initialTags = initialCard?.tags ?? []
    const initialFrontHtml = initialCard?.frontHtml ?? ""
    const initialBackHtml = initialCard?.backHtml ?? ""

    return (
      !areTagsEqual(tags, initialTags) ||
      tagInputRef.current?.hasPendingInput() === true ||
      frontHtml !== initialFrontHtml ||
      backHtml !== initialBackHtml
    )
  }

  const handleClose = async () => {
    if (!(await hasUnsavedChanges())) {
      close()
      return
    }

    Alert.alert(t("discard.title"), t("discard.message"), [
      {
        text: t("discard.cancel"),
        style: "cancel",
      },
      {
        text: t("discard.confirm"),
        style: "destructive",
        onPress: close,
      },
    ])
  }

  const resetForm = () => {
    setTags([])
    setFocusedEditor(null)
    setCurrentStylesState(null)
    tagInputRef.current?.clear()
    frontRef.current?.setValue("")
    backRef.current?.setValue("")
    tagInputRef.current?.focus()
  }

  const handleSave = async () => {
    const frontHtml = (await frontRef.current?.getHTML()) ?? ""
    const backHtml = (await backRef.current?.getHTML()) ?? ""
    const nextTags = tagInputRef.current?.commitInput() ?? tags

    if (
      !hasMeaningfulHtmlContent(frontHtml) ||
      !hasMeaningfulHtmlContent(backHtml)
    ) {
      return
    }

    if (initialCard) {
      await updateCard({
        id: initialCard.id,
        tags: nextTags,
        frontHtml,
        backHtml,
      })
      close()
      return
    }

    await addCard({
      tags: nextTags,
      frontHtml,
      backHtml,
    })
    resetForm()
  }

  return {
    activeStyles: getSharedStylesFromState(currentStylesState),
    backRef,
    currentStylesState,
    frontRef,
    handleAddTag,
    handleClose,
    handleEditorFocus,
    handleEditorStateChange,
    handleSave,
    handleToggleStyle,
    setTags,
    tagInputRef,
    availableTags,
    tags,
  }
}
