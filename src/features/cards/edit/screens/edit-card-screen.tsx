import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Keyboard, View } from "react-native"
import {
  KeyboardAwareScrollView as BaseKeyboardAwareScrollView,
  KeyboardToolbar,
} from "react-native-keyboard-controller"
import { StyleSheet, withUnistyles } from "react-native-unistyles"

import {
  type EditCardAudioActionResult,
  useEditCardAudio,
} from "@/features/cards/audio/hooks/use-edit-card-audio"
import type { CardSaveResult } from "@/features/cards/data/card-store"
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

// TODO: Remove this wrapper after upgrading past the Reanimated 4.5.0 issue
// where Unistyles metadata keys are rejected as invalid empty-object styles.
const KeyboardAwareScrollView = withUnistyles(BaseKeyboardAwareScrollView)

export default function EditCardScreen({
  initialCard,
  onClose,
}: EditCardProps) {
  const { push } = useRouter()
  const { t } = useTranslation("editCard")
  const { t: tCommon } = useTranslation("common")
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
  const audioError = audio.error
  const clearAudioError = audio.clearError

  useEffect(() => {
    if (!audioError) {
      return
    }

    Alert.alert(audioError.message)
    clearAudioError()
  }, [audioError, clearAudioError])

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
      cardSetId: initialCard.cardSetId,
      previousTags: initialCard.tags,
      variant: initialCard.variant,
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

  const showAudioResult = async (
    resultPromise: Promise<EditCardAudioActionResult>,
  ) => {
    const result = await resultPromise

    if (!result.ok) {
      Alert.alert(result.message)
    }
  }

  const hasAudioPersistence = (input: NewCardInput | UpdateCardInput) => {
    return Object.keys(input.tts ?? {}).length > 0
  }

  const persistAudioAfterMetadata = async (
    saveResult: CardSaveResult,
    input: NewCardInput | UpdateCardInput,
  ) => {
    if (!hasAudioPersistence(input)) {
      return
    }

    await saveResult.metadataPersisted
    await showAudioResult(audio.persistCardAudio(saveResult.cardSetId))
  }

  const handleSave = async () => {
    const draft = await getValidatedDraft()
    if (!draft) {
      return
    }

    if (initialCard) {
      const input = createUpdateCardInput(draft)
      const result = updateCard(input)
      await persistAudioAfterMetadata(result, input)
      onClose()
      return
    }

    const input = createNewCardInput(draft)
    const result = addCard(input)
    await persistAudioAfterMetadata(result, input)
    onClose()
  }

  const handleAddAnother = async () => {
    const draft = await getValidatedDraft()
    if (!draft) return

    const input = createNewCardInput(draft)
    const result = addCard(input)
    await persistAudioAfterMetadata(result, input)
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
                accessibilityLabel={t("tagsMenu.accessibilityLabel")}
                availableTags={availableTags}
                cancelLabel={tCommon("cancel")}
                onSelectTag={handleAddTag}
                title={t("tagsMenu.title")}
              />
            }
            label={t("tagsLabel")}
            onChange={setTags}
            onBlur={createBlurHandler("tags")}
            onFocus={() => {
              setFocusedField("tags")
            }}
            ref={tagInputRef}
            removeTagAccessibilityLabel={(tag) =>
              t("removeTagAccessibilityLabel", { tag })
            }
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
            onPressAudioPreview={() => {
              void showAudioResult(audio.front.playPreview())
            }}
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
            onPressAudioPreview={() => {
              void showAudioResult(audio.back.playPreview())
            }}
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
