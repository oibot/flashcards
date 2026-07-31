import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Keyboard, View } from "react-native"
import {
  KeyboardAwareScrollView as BaseKeyboardAwareScrollView,
  KeyboardToolbar,
} from "react-native-keyboard-controller"
import { StyleSheet, withUnistyles } from "react-native-unistyles"

import EditCardAudioControls from "@/features/cards/audio/components/edit-card-audio-controls"
import { useEditCardAudio } from "@/features/cards/audio/hooks/use-edit-card-audio"
import type { CardSaveResult } from "@/features/cards/data/card-store"
import CardSideField from "@/features/cards/edit/components/card-side-field"
import EditCardHeader from "@/features/cards/edit/components/edit-card-header"
import OppositeDirectionToggle from "@/features/cards/edit/components/opposite-direction-toggle"
import RichTextToolbar from "@/features/cards/edit/components/rich-text-toolbar"
import { useEditCard } from "@/features/cards/edit/hooks/use-edit-card"
import type { EditCardDraft } from "@/features/cards/edit/hooks/use-edit-card-form"
import { useEditCardForm } from "@/features/cards/edit/hooks/use-edit-card-form"
import type {
  Card,
  CardVariants,
  NewCardInput,
  UpdateCardInput,
  VisibleCardSide,
} from "@/features/cards/model/card"
import { featureFlags } from "@/shared/config/feature-flags"
import { hasMeaningfulHtmlContent } from "@/shared/lib/html"
import { TagInput } from "@/shared/ui/tag-input"
import TagsMenu from "@/shared/ui/tags-menu"

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
  const isAudioCreationEnabled = featureFlags.audioCreation
  const [focusedField, setFocusedField] = useState<FocusedField | null>(null)
  const audio = useEditCardAudio({
    enabled: isAudioCreationEnabled,
    initialCard,
  })
  const {
    availableTags,
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
    const audioResult = await audio.persistCardAudio(saveResult.cardSetId)

    if (!audioResult.ok) {
      Alert.alert(audioResult.message)
    }
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
    resetForm({ preserveTags: true })
    setFocusedField("front")
    handleEditorFocus("front")
    frontRef.current?.focus()
  }

  const openLanguagePicker = (side: VisibleCardSide) => {
    Keyboard.dismiss()
    frontRef.current?.blur()
    backRef.current?.blur()
    setFocusedField(null)

    push({
      pathname: "/edit-card-language-selection",
      params: { side },
    })
  }

  const renderAudioControls = (side: VisibleCardSide) => {
    if (!isAudioCreationEnabled) {
      return null
    }

    return (
      <EditCardAudioControls
        audio={audio[side]}
        onConfigure={() => {
          openLanguagePicker(side)
        }}
      />
    )
  }

  return (
    <>
      <EditCardHeader
        isEditing={isEditing}
        isSubmissionEnabled={isDraftValid}
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
            editorRef={frontRef}
            footer={renderAudioControls("front")}
            label={t("frontLabel")}
            onBlur={createBlurHandler("front")}
            onChangeHtml={(html) => {
              handleEditorHtmlChange("front", html)
              audio.front.setHtml(html)
            }}
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
            footer={renderAudioControls("back")}
            label={t("backLabel")}
            onBlur={createBlurHandler("back")}
            onChangeHtml={(html) => {
              handleEditorHtmlChange("back", html)
              audio.back.setHtml(html)
            }}
            onFocus={() => {
              setFocusedField("back")
              handleEditorFocus("back")
            }}
            onStateChange={(nextState) =>
              handleEditorStateChange("back", nextState)
            }
          />
          {!isEditing ? (
            <OppositeDirectionToggle
              label={t("oppositeDirection.label")}
              onValueChange={setHasOppositeDirection}
              value={hasOppositeDirection}
            />
          ) : null}
        </View>
      </KeyboardAwareScrollView>

      <KeyboardToolbar enabled={isEditorToolbarEnabled}>
        <KeyboardToolbar.Content>
          <RichTextToolbar
            key={focusedField ?? "none"}
            onSetAlignment={handleSetAlignment}
            onSetTextSize={handleSetTextSize}
            onToggleInlineStyle={handleToggleInlineStyle}
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
