import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, View } from "react-native"
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from "react-native-keyboard-controller"
import { StyleSheet } from "react-native-unistyles"

import { TagInput } from "@/components/UI/tag-input"
import TagsMenu from "@/components/UI/tags-menu"
import Toolbar from "@/components/UI/toolbar"
import type { Card } from "@/domain/card"
import { useEditCard } from "@/hooks/use-edit-card"
import { useEditCardForm } from "@/hooks/use-edit-card-form"
import { hasMeaningfulHtmlContent } from "@/utils/html"

import CardSideField from "./card-side-field"
import EditCardHeader from "./edit-card-header"

type EditCardProps = {
  initialCard?: Card
  onClose: () => void
}

type FocusedField = "tags" | "front" | "back"

export default function EditCard({ initialCard, onClose }: EditCardProps) {
  const { t } = useTranslation("common", { keyPrefix: "editCard" })
  const { addCard, updateCard } = useEditCard(initialCard?.id)
  const isEditing = initialCard != null
  const [focusedField, setFocusedField] = useState<FocusedField | null>(null)
  const {
    activeStyles,
    availableTags,
    backRef,
    currentStylesState,
    frontRef,
    getDraft,
    handleAddTag,
    handleEditorFocus,
    handleEditorStateChange,
    handleToggleStyle,
    hasUnsavedChanges,
    resetForm,
    setTags,
    tagInputRef,
    tags,
  } = useEditCardForm({ initialCard })
  const isEditorToolbarEnabled =
    focusedField === "front" || focusedField === "back"

  const createBlurHandler = (field: FocusedField) => () => {
    setFocusedField((currentField) =>
      currentField === field ? null : currentField,
    )
  }

  const getValidatedDraft = async () => {
    const draft = await getDraft()

    if (
      !hasMeaningfulHtmlContent(draft.frontHtml) ||
      !hasMeaningfulHtmlContent(draft.backHtml)
    ) {
      return null
    }

    return draft
  }

  const handleClose = async () => {
    if (!(await hasUnsavedChanges())) {
      onClose()
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
        onPress: onClose,
      },
    ])
  }

  const handleSave = async () => {
    const draft = await getValidatedDraft()
    if (!draft) {
      return
    }

    const { backHtml, frontHtml, tags: nextTags } = draft

    if (initialCard) {
      await updateCard({
        id: initialCard.id,
        previousTags: initialCard.tags,
        tags: nextTags,
        frontHtml,
        backHtml,
      })
      onClose()
      return
    }

    await addCard({
      tags: nextTags,
      frontHtml,
      backHtml,
    })
    onClose()
  }

  const handleAddAnother = async () => {
    const draft = await getValidatedDraft()
    if (!draft) return

    await addCard(draft)
    resetForm()
  }

  return (
    <>
      <EditCardHeader
        isEditing={isEditing}
        onAddAnother={isEditing ? undefined : handleAddAnother}
        onClose={handleClose}
        onSave={handleSave}
      />
      <KeyboardAwareScrollView
        style={styles.container}
        bottomOffset={isEditorToolbarEnabled ? 44 : 0}
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
            onBlur={createBlurHandler("tags")}
            onFocus={() => {
              setFocusedField("tags")
            }}
            ref={tagInputRef}
            tags={tags}
          />
          <CardSideField
            editorRef={frontRef}
            label={t("frontLabel")}
            onBlur={createBlurHandler("front")}
            onFocus={() => {
              setFocusedField("front")
              handleEditorFocus("front")
            }}
            onStateChange={(nextState) =>
              handleEditorStateChange("front", nextState)
            }
          />
          <CardSideField
            editorRef={backRef}
            label={t("backLabel")}
            onBlur={createBlurHandler("back")}
            onFocus={() => {
              setFocusedField("back")
              handleEditorFocus("back")
            }}
            onStateChange={(nextState) =>
              handleEditorStateChange("back", nextState)
            }
          />
        </View>
      </KeyboardAwareScrollView>

      <KeyboardToolbar enabled={isEditorToolbarEnabled}>
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
