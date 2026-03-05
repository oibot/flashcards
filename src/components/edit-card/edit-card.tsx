import { Stack, useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Text, TextInput, View } from "react-native"
import type {
  EnrichedTextInputInstance,
  OnChangeStateEvent,
} from "react-native-enriched"
import { EnrichedTextInput } from "react-native-enriched"
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from "react-native-keyboard-controller"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import {
  IconButtonCheckmark,
  IconButtonClose,
} from "@/components/UI/icon-button"
import { useCards } from "@/hooks/useCards"

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
  const { theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "editCard" })
  const { addCard } = useCards()
  const router = useRouter()
  const frontRef = useRef<EnrichedTextInputInstance>(null)
  const backRef = useRef<EnrichedTextInputInstance>(null)
  const [tag, setTag] = useState("")
  const [focusedEditor, setFocusedEditor] = useState<EditorSide | null>(null)
  const [frontStylesState, setFrontStylesState] =
    useState<OnChangeStateEvent | null>(null)
  const [backStylesState, setBackStylesState] =
    useState<OnChangeStateEvent | null>(null)
  const [sharedStyles, setSharedStyles] = useState<SharedToolbarState>(
    DEFAULT_SHARED_STYLES,
  )

  const activeEditorRef = focusedEditor === "back" ? backRef : frontRef
  const activeStylesState =
    focusedEditor === "back" ? backStylesState : frontStylesState

  useEffect(() => {
    if (!focusedEditor) return

    const targetRef = focusedEditor === "back" ? backRef : frontRef
    const targetState =
      focusedEditor === "back" ? backStylesState : frontStylesState
    const currentStyles = getSharedStylesFromState(targetState)

    ;(Object.keys(sharedStyles) as ToolbarStyleKey[]).forEach((styleKey) => {
      if (currentStyles[styleKey] !== sharedStyles[styleKey]) {
        toggleEditorStyle(targetRef, styleKey)
      }
    })
  }, [backStylesState, focusedEditor, frontStylesState, sharedStyles])

  const handleEditorFocus = (editor: EditorSide) => {
    setFocusedEditor(editor)
  }

  const handleEditorStateChange = (
    editor: EditorSide,
    nextState: OnChangeStateEvent,
  ) => {
    if (editor === "front") {
      setFrontStylesState(nextState)
    } else {
      setBackStylesState(nextState)
    }

    if (focusedEditor === editor) {
      setSharedStyles(getSharedStylesFromState(nextState))
    }
  }

  const handleToggleStyle = (item: ToolbarItem) => {
    if (!focusedEditor) return

    const styleKey = stateKeyByItemName[item.name]
    toggleEditorStyle(activeEditorRef, styleKey)

    setSharedStyles((currentStyles) => ({
      ...currentStyles,
      [styleKey]: !currentStyles[styleKey],
    }))
  }

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back()
      return
    }

    router.replace("/(tabs)/(review)")
  }

  const handleSave = async () => {
    const trimmedTag = tag.trim()
    const frontHtml = (await frontRef.current?.getHTML()) ?? ""
    const backHtml = (await backRef.current?.getHTML()) ?? ""

    if (
      !trimmedTag ||
      !hasMeaningfulHtmlContent(frontHtml) ||
      !hasMeaningfulHtmlContent(backHtml)
    ) {
      return
    }

    await addCard({
      tag: trimmedTag,
      frontHtml,
      backHtml,
    })
    handleClose()
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t("headerTitle"),
          unstable_headerLeftItems: () => [
            {
              type: "button",
              label: t("cancel"),
              icon: { type: "sfSymbol", name: "xmark" },
              tintColor: theme.colors.primary,
              onPress: handleClose,
            },
          ],
          unstable_headerRightItems: () => [
            {
              type: "button",
              label: t("saveCard"),
              icon: { type: "sfSymbol", name: "checkmark" },
              tintColor: theme.colors.accent,
              variant: "prominent",
              onPress: handleSave,
            },
          ],
          headerLeft: () => (
            <IconButtonClose
              accessibilityLabel={t("cancelAccessibilityLabel")}
              onPress={handleClose}
              style={styles.headerButton}
              tintColor={theme.colors.primary}
            />
          ),
          headerRight: () => (
            <IconButtonCheckmark
              accessibilityLabel={t("saveCardAccessibilityLabel")}
              onPress={handleSave}
              style={styles.headerConfirmButton}
              tintColor={theme.colors.background}
            />
          ),
        }}
      />
      <KeyboardAwareScrollView
        style={styles.container}
        bottomOffset={44}
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.label}>Tag</Text>
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              onChangeText={setTag}
              placeholder="e.g. Spanish"
              placeholderTextColor={theme.colors.secondary}
              style={styles.tagInput}
              value={tag}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Front</Text>
            <EnrichedTextInput
              ref={frontRef}
              onChangeState={(e) =>
                handleEditorStateChange("front", e.nativeEvent)
              }
              onFocus={() => handleEditorFocus("front")}
              placeholder="Type a prompt..."
              placeholderTextColor={theme.colors.secondary}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Back</Text>
            <EnrichedTextInput
              ref={backRef}
              onChangeState={(e) =>
                handleEditorStateChange("back", e.nativeEvent)
              }
              onFocus={() => handleEditorFocus("back")}
              placeholder="Type the answer..."
              placeholderTextColor={theme.colors.secondary}
              style={styles.input}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <KeyboardToolbar>
        <KeyboardToolbar.Content>
          <Toolbar
            activeStyles={sharedStyles}
            onToggleStyle={handleToggleStyle}
            stylesState={activeStylesState}
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
  tagInput: {
    fontSize: 16,
    color: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.colors.secondaryBackground,
    borderRadius: 14,
    borderCurve: "continuous",
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
  headerButton: {
    backgroundColor: theme.colors.chromeMuted,
  },
  headerConfirmButton: {
    backgroundColor: theme.colors.accent,
  },
}))
