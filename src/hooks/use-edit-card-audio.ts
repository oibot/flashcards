import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { useAuthSession } from "@/auth/use-auth-session"
import {
  hydrateAudioSelectionDraftSide,
  resetAudioSelectionDraft,
  setAudioSelectionDraftError,
  setAudioSelectionDraftHtml,
  setAudioSelectionDraftReady,
  useAudioSelectionDraft,
} from "@/components/edit-card/audio-selection-draft"
import type { Card, VisibleCardSide } from "@/domain/card"
import type {
  CardSetTtsSelectionPatch,
  SupportedTtsLocale,
  VisibleCardTtsSelectionPatch,
} from "@/domain/card-audio"
import { toCanonicalCardTtsSelectionPatch } from "@/domain/card-audio"
import { useFileAudioPlayer } from "@/hooks/use-file-audio-player"
import { hasMeaningfulHtmlContent } from "@/utils/html"

type DraftTtsReadyResponse = {
  status: "ready"
  assetId: string
  fileUrl: string
}

type DraftTtsErrorResponse = {
  error: string
}

type EditCardAudioSideState = {
  valueLabel: string
  isActionDisabled: boolean
  isPreviewDisabled: boolean
  isPreviewLoading: boolean
  setHtml: (html: string) => void
  playPreview: () => Promise<void>
}

type AttachTtsErrorResponse = {
  error: string
}

type UseEditCardAudioOptions = {
  initialCard?: Card
}

function isDraftTtsReadyResponse(
  value: unknown,
): value is DraftTtsReadyResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    value.status === "ready" &&
    "assetId" in value &&
    typeof value.assetId === "string" &&
    "fileUrl" in value &&
    typeof value.fileUrl === "string"
  )
}

function isDraftTtsErrorResponse(
  value: unknown,
): value is DraftTtsErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  )
}

function isAttachTtsErrorResponse(
  value: unknown,
): value is AttachTtsErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  )
}

export function useEditCardAudio({
  initialCard,
}: UseEditCardAudioOptions = {}) {
  const { t } = useTranslation("common", { keyPrefix: "editCard" })
  const { status, user } = useAuthSession()
  const audioSelectionDraft = useAudioSelectionDraft()
  const frontAudioPreview = useFileAudioPlayer({
    sourceUrl: audioSelectionDraft.front.fileUrl,
  })
  const backAudioPreview = useFileAudioPlayer({
    sourceUrl: audioSelectionDraft.back.fileUrl,
  })
  const pendingDraftRequestKeyRef = useRef<
    Record<VisibleCardSide, string | null>
  >({
    front: null,
    back: null,
  })

  useEffect(() => {
    resetAudioSelectionDraft()
    setAudioSelectionDraftHtml("front", initialCard?.frontHtml ?? "")
    setAudioSelectionDraftHtml("back", initialCard?.backHtml ?? "")
    hydrateAudioSelectionDraftSide("front", {
      locale: initialCard?.frontTtsLocale ?? null,
      assetId: null,
      fileUrl: initialCard?.frontTtsFileUrl ?? null,
    })
    hydrateAudioSelectionDraftSide("back", {
      locale: initialCard?.backTtsLocale ?? null,
      assetId: null,
      fileUrl: initialCard?.backTtsFileUrl ?? null,
    })

    return () => {
      resetAudioSelectionDraft()
    }
  }, [
    initialCard?.backHtml,
    initialCard?.backTtsFileUrl,
    initialCard?.backTtsLocale,
    initialCard?.frontHtml,
    initialCard?.frontTtsFileUrl,
    initialCard?.frontTtsLocale,
  ])

  useEffect(() => {
    const createDraftAudio = async (
      side: VisibleCardSide,
      locale: SupportedTtsLocale,
      html: string,
    ) => {
      const requestKey = JSON.stringify({ html, locale, side })
      pendingDraftRequestKeyRef.current[side] = requestKey

      if (status !== "signed-in" || !user?.refreshToken) {
        setAudioSelectionDraftError(side, locale)
        Alert.alert(t("audioUnavailable"))
        return
      }

      try {
        const response = await fetch("/api/tts/draft", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.refreshToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            html,
            locale,
          }),
        })
        const payload: unknown = await response.json().catch(() => null)

        if (pendingDraftRequestKeyRef.current[side] !== requestKey) {
          return
        }

        if (!response.ok) {
          throw new Error(
            isDraftTtsErrorResponse(payload)
              ? payload.error
              : t("audioUnavailable"),
          )
        }

        if (!isDraftTtsReadyResponse(payload)) {
          throw new Error(t("audioUnavailable"))
        }

        setAudioSelectionDraftReady(
          side,
          locale,
          payload.assetId,
          payload.fileUrl,
        )

        const preview = side === "front" ? frontAudioPreview : backAudioPreview
        const playResult = await preview.playAudio(payload.fileUrl)

        if (!playResult.ok) {
          Alert.alert(playResult.message)
        }
      } catch (error) {
        if (pendingDraftRequestKeyRef.current[side] !== requestKey) {
          return
        }

        setAudioSelectionDraftError(side, locale)
        Alert.alert(
          error instanceof Error ? error.message : t("audioUnavailable"),
        )
      }
    }

    const pendingSides: VisibleCardSide[] = ["front", "back"]

    pendingSides.forEach((side) => {
      const sideDraft = audioSelectionDraft[side]

      if (
        sideDraft.status !== "creating" ||
        !sideDraft.locale ||
        !hasMeaningfulHtmlContent(sideDraft.html)
      ) {
        pendingDraftRequestKeyRef.current[side] = null
        return
      }

      const requestKey = JSON.stringify({
        html: sideDraft.html,
        locale: sideDraft.locale,
        side,
      })

      if (pendingDraftRequestKeyRef.current[side] === requestKey) {
        return
      }

      void createDraftAudio(side, sideDraft.locale, sideDraft.html)
    })
  }, [
    audioSelectionDraft,
    backAudioPreview,
    frontAudioPreview,
    status,
    t,
    user?.refreshToken,
  ])

  const createSideState = (side: VisibleCardSide): EditCardAudioSideState => {
    const sideDraft = audioSelectionDraft[side]
    const audioPreview = side === "front" ? frontAudioPreview : backAudioPreview
    const hasMeaningfulContent = hasMeaningfulHtmlContent(sideDraft.html)

    return {
      valueLabel: sideDraft.locale
        ? t(`soundSheet.languages.${sideDraft.locale}.label`)
        : t("soundSheet.none"),
      isActionDisabled: !hasMeaningfulContent,
      isPreviewDisabled:
        !hasMeaningfulContent ||
        sideDraft.fileUrl == null ||
        sideDraft.status === "creating",
      isPreviewLoading:
        sideDraft.status === "creating" || audioPreview.isLoading,
      setHtml: (html) => {
        setAudioSelectionDraftHtml(side, html)
      },
      playPreview: async () => {
        const result = await audioPreview.playAudio()

        if (!result.ok) {
          Alert.alert(t("audioUnavailable"))
        }
      },
    }
  }

  const getVisibleCardTtsSelection = (): VisibleCardTtsSelectionPatch => {
    const selection: VisibleCardTtsSelectionPatch = {}

    ;(["front", "back"] as const).forEach((side) => {
      const sideDraft = audioSelectionDraft[side]

      if (!sideDraft.isDirty) {
        return
      }

      selection[side] = {
        locale: sideDraft.locale,
        assetId: sideDraft.assetId,
      }
    })

    return selection
  }

  const getCanonicalTtsSelection = (): CardSetTtsSelectionPatch => {
    return toCanonicalCardTtsSelectionPatch(
      getVisibleCardTtsSelection(),
      initialCard?.variant ?? "forward",
    )
  }

  return {
    front: createSideState("front"),
    back: createSideState("back"),
    getPersistedSelection: getVisibleCardTtsSelection,
    persistCardAudio: async (cardSetId: string) => {
      const tts = getCanonicalTtsSelection()

      if (Object.keys(tts).length === 0) {
        return
      }

      if (status !== "signed-in" || !user?.refreshToken) {
        Alert.alert(t("audioUnavailable"))
        return
      }

      try {
        const response = await fetch("/api/tts/attach", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.refreshToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cardSetId,
            tts,
          }),
        })
        const payload: unknown = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(
            isAttachTtsErrorResponse(payload)
              ? payload.error
              : t("audioUnavailable"),
          )
        }
      } catch (error) {
        Alert.alert(
          error instanceof Error ? error.message : t("audioUnavailable"),
        )
      }
    },
    resetDraft: resetAudioSelectionDraft,
  }
}
