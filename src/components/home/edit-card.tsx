import { EnrichedTextInput } from "react-native-enriched"
import type {
  EnrichedTextInputInstance,
  OnChangeStateEvent,
} from "react-native-enriched"
import { useEffect, useRef, useState } from "react"
import { View, StyleSheet, Text, ScrollView } from "react-native"
import { KeyboardToolbar } from "react-native-keyboard-controller"
import Toolbar, {
  type SharedToolbarState,
  type ToolbarItem,
  type ToolbarStyleKey,
  stateKeyByItemName,
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

export default function EditCard() {
  const frontRef = useRef<EnrichedTextInputInstance>(null)
  const backRef = useRef<EnrichedTextInputInstance>(null)
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

    ;(Object.keys(sharedStyles) as Array<ToolbarStyleKey>).forEach(
      (styleKey) => {
        if (currentStyles[styleKey] !== sharedStyles[styleKey]) {
          toggleEditorStyle(targetRef, styleKey)
        }
      },
    )
  }, [focusedEditor])

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

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.container}>
          <View style={styles.field}>
            <Text style={styles.label}>Front</Text>
            <EnrichedTextInput
              ref={frontRef}
              onChangeState={(e) =>
                handleEditorStateChange("front", e.nativeEvent)
              }
              onFocus={() => handleEditorFocus("front")}
              placeholder="Type a prompt..."
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
              style={styles.input}
            />
          </View>
        </View>
      </ScrollView>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  input: {
    width: "100%",
    minHeight: 180,
    fontSize: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    borderCurve: "continuous",
    textAlignVertical: "top",
  },
})
