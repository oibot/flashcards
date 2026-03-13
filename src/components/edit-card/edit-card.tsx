import { useTranslation } from "react-i18next"
import { View } from "react-native"
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from "react-native-keyboard-controller"
import { StyleSheet } from "react-native-unistyles"

import { TagInput } from "@/components/UI/tag-input"
import TagsMenu from "@/components/UI/tags-menu"
import Toolbar from "@/components/UI/toolbar"
import { useEditCardForm } from "@/hooks/use-edit-card-form"

import CardSideField from "./card-side-field"
import EditCardHeader from "./edit-card-header"

export default function EditCard() {
  const { t } = useTranslation("common", { keyPrefix: "editCard" })
  const {
    activeStyles,
    availableTags,
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
    tags,
  } = useEditCardForm()

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
          <TagInput
            accessory={
              <TagsMenu
                availableTags={availableTags}
                onSelectTag={handleAddTag}
              />
            }
            onChange={setTags}
            ref={tagInputRef}
            tags={tags}
          />
          <CardSideField
            editorRef={frontRef}
            label={t("frontLabel")}
            onFocus={() => handleEditorFocus("front")}
            onStateChange={(nextState) =>
              handleEditorStateChange("front", nextState)
            }
          />
          <CardSideField
            editorRef={backRef}
            label={t("backLabel")}
            onFocus={() => handleEditorFocus("back")}
            onStateChange={(nextState) =>
              handleEditorStateChange("back", nextState)
            }
          />
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
}))
