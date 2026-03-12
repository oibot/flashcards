import { useRouter } from "expo-router"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"
import type {
  EnrichedTextInputInstance,
  OnChangeStateEvent,
} from "react-native-enriched"
import { EnrichedTextInput } from "react-native-enriched"
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from "react-native-keyboard-controller"
import { StyleSheet } from "react-native-unistyles"

import { TagInput, type TagInputHandle } from "@/components/UI/tag-input"
import { useCards } from "@/hooks/useCards"

import EditCardHeader from "./edit-card-header"
import Toolbar, {
  type SharedToolbarState,
  stateKeyByItemName,
  type ToolbarItem,
  type ToolbarStyleKey,
} from "./toolbar"

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
  editorRef: React.RefObject<EnrichedTextInputInstance | null>,
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

export default function EditCard() {
  const { t } = useTranslation("common", { keyPrefix: "editCard" })
  const { addCard } = useCards()
  const router = useRouter()
  const tagInputRef = useRef<TagInputHandle>(null)
  const frontRef = useRef<EnrichedTextInputInstance>(null)
  const backRef = useRef<EnrichedTextInputInstance>(null)
  const [tags, setTags] = useState<string[]>([])
  const [focusedEditor, setFocusedEditor] = useState<EditorSide | null>(null)
  const [currentStylesState, setCurrentStylesState] =
    useState<OnChangeStateEvent | null>(null)
  const activeStyles = getSharedStylesFromState(currentStylesState)

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

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back()
      return
    }

    router.replace("/(tabs)/(review)")
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

    await addCard({
      tags: nextTags,
      frontHtml,
      backHtml,
    })
    resetForm()
  }

  return (
    <>
      <EditCardHeader onClose={handleClose} onSave={handleSave} />
      <KeyboardAwareScrollView
        style={styles.container}
        bottomOffset={44}
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.fields}>
          <TagInput onChange={setTags} ref={tagInputRef} tags={tags} />
          <View style={styles.field}>
            <Text style={styles.label}>{t("frontLabel")}</Text>
            <EnrichedTextInput
              ref={frontRef}
              onChangeState={(e) =>
                handleEditorStateChange("front", e.nativeEvent)
              }
              onFocus={() => handleEditorFocus("front")}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t("backLabel")}</Text>
            <EnrichedTextInput
              ref={backRef}
              onChangeState={(e) =>
                handleEditorStateChange("back", e.nativeEvent)
              }
              onFocus={() => handleEditorFocus("back")}
              style={styles.input}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <KeyboardToolbar>
        <KeyboardToolbar.Content>
          <Toolbar
            activeStyles={activeStyles}
            onToggleStyle={handleToggleStyle}
            stylesState={currentStylesState}
          />
        </KeyboardToolbar.Content>
        <KeyboardToolbar.Done />
      </KeyboardToolbar>
    </>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  fields: {
    gap: 12,
    backgroundColor: theme.colors.background,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  input: {
    width: "100%",
    minHeight: 180,
    fontSize: 20,
    color: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.colors.secondaryBackground,
    borderRadius: 14,
    borderCurve: "continuous",
    textAlignVertical: "top",
  },
}))
