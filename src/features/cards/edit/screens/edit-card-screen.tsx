import { useRouter } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Keyboard, View } from "react-native"
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from "react-native-keyboard-controller"
import { StyleSheet } from "react-native-unistyles"

import { useEditCardAudio } from "@/features/cards/audio/hooks/use-edit-card-audio"
import CardSideField from "@/features/cards/edit/components/card-side-field"
import EditCardHeader from "@/features/cards/edit/components/edit-card-header"
import OppositeDirectionToggle from "@/features/cards/edit/components/opposite-direction-toggle"
import { useEditCard } from "@/features/cards/edit/hooks/use-edit-card"
import type { EditCardDraft } from "@/features/cards/edit/hooks/use-edit-card-form"
import { useEditCardForm } from "@/features/cards/edit/hooks/use-edit-card-form"
import type {
  Card,
  CardVariants,
  NewCardInput,
  UpdateCardInput,
} from "@/features/cards/model/card"
import { hasMeaningfulHtmlContent } from "@/shared/lib/html"
import { TagInput } from "@/shared/ui/tag-input"
import TagsMenu from "@/shared/ui/tags-menu"
import Toolbar from "@/shared/ui/toolbar"

type EditCardProps = {
  initialCard?: Card
  onClose: () => void
}

type FocusedField = "tags" | "front" | "back"

export default function EditCardScreen({
  initialCard,
  onClose,
}: EditCardProps) {
  const { push } = useRouter()
  const { t } = useTranslation("common", { keyPrefix: "editCard" })
  const { addCard, updateCard } = useEditCard(initialCard?.id)
  const isEditing = initialCard != null
  const [focusedField, setFocusedField] = useState<FocusedField | null>(null)
  const audio = useEditCardAudio({ initialCard })
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
    hasOppositeDirection,
    resetForm,
    setHasOppositeDirection,
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

  const getVariants = (hasOppositeDirection: boolean): CardVariants => {
    return hasOppositeDirection ? ["forward", "reverse"] : ["forward"]
  }

  const createNewCardInput = (draft: EditCardDraft): NewCardInput => ({
    tags: draft.tags,
    frontHtml: draft.frontHtml,
    backHtml: draft.backHtml,
    tts: audio.getPersistedSelection(),
    variants: getVariants(draft.hasOppositeDirection),
  })

  const createUpdateCardInput = (draft: EditCardDraft): UpdateCardInput => {
    if (!initialCard) {
      throw new Error("Cannot create update payload without an initial card.")
    }

    return {
      id: initialCard.id,
      previousTags: initialCard.tags,
      tags: draft.tags,
      frontHtml: draft.frontHtml,
      backHtml: draft.backHtml,
      tts: audio.getPersistedSelection(),
    }
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

    if (initialCard) {
      const result = await updateCard(createUpdateCardInput(draft))
      await audio.persistCardAudio(result.cardSetId)
      onClose()
      return
    }

    const result = await addCard(createNewCardInput(draft))
    await audio.persistCardAudio(result.cardSetId)
    onClose()
  }

  const handleAddAnother = async () => {
    const draft = await getValidatedDraft()
    if (!draft) return

    const result = await addCard(createNewCardInput(draft))
    await audio.persistCardAudio(result.cardSetId)
    audio.resetDraft()
    resetForm()
  }

  const openLanguagePicker = (side: "front" | "back") => {
    Keyboard.dismiss()
    frontRef.current?.blur()
    backRef.current?.blur()
    setFocusedField(null)

    push({
      pathname: "/edit-card-language-selection",
      params: { side },
    })
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
            audioActionLabel={t("audioLabel")}
            audioActionDisabled={audio.front.isActionDisabled}
            audioPreviewAccessibilityLabel={t("previewAudioAccessibilityLabel")}
            audioPreviewLoading={audio.front.isPreviewLoading}
            audioPreviewState={audio.front.previewState}
            audioValueLabel={audio.front.valueLabel}
            editorRef={frontRef}
            isAudioPreviewDisabled={audio.front.isPreviewDisabled}
            label={t("frontLabel")}
            onBlur={createBlurHandler("front")}
            onChangeHtml={audio.front.setHtml}
            onFocus={() => {
              setFocusedField("front")
              handleEditorFocus("front")
            }}
            onPressAudioAction={() => {
              openLanguagePicker("front")
            }}
            onPressAudioPreview={audio.front.playPreview}
            onStateChange={(nextState) =>
              handleEditorStateChange("front", nextState)
            }
          />
          <CardSideField
            audioActionLabel={t("audioLabel")}
            audioActionDisabled={audio.back.isActionDisabled}
            audioPreviewAccessibilityLabel={t("previewAudioAccessibilityLabel")}
            audioPreviewLoading={audio.back.isPreviewLoading}
            audioPreviewState={audio.back.previewState}
            audioValueLabel={audio.back.valueLabel}
            editorRef={backRef}
            isAudioPreviewDisabled={audio.back.isPreviewDisabled}
            label={t("backLabel")}
            onBlur={createBlurHandler("back")}
            onChangeHtml={audio.back.setHtml}
            onFocus={() => {
              setFocusedField("back")
              handleEditorFocus("back")
            }}
            onPressAudioAction={() => {
              openLanguagePicker("back")
            }}
            onPressAudioPreview={audio.back.playPreview}
            onStateChange={(nextState) =>
              handleEditorStateChange("back", nextState)
            }
          />
          {!isEditing ? (
            <OppositeDirectionToggle
              description={t("oppositeDirection.description")}
              label={t("oppositeDirection.label")}
              onValueChange={setHasOppositeDirection}
              value={hasOppositeDirection}
            />
          ) : null}
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
