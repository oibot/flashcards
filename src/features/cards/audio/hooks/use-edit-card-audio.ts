import { useEffect, useReducer, useRef } from "react"
import { useTranslation } from "react-i18next"

import { useAuthSession } from "@/features/auth/hooks/use-auth-session"
import {
  attachCardAudio,
  resolveCardAudio,
  resolveDraftAudio,
} from "@/features/cards/audio/api/tts-client"
import { useFileAudioPlayer } from "@/features/cards/audio/hooks/use-file-audio-player"
import {
  hydrateAudioSelectionDraftSide,
  resetAudioSelectionDraft,
  setAudioSelectionDraftCreating,
  setAudioSelectionDraftError,
  setAudioSelectionDraftHtml,
  setAudioSelectionDraftReady,
  useAudioSelectionDraft,
} from "@/features/cards/audio/lib/audio-selection-draft"
import { getErrorMessage } from "@/features/cards/audio/lib/tts-client-errors"
import type {
  CardSetTtsSelectionPatch,
  SupportedTtsLocale,
  VisibleCardTtsSelectionPatch,
} from "@/features/cards/audio/model/card-audio"
import { toCanonicalCardTtsSelectionPatch } from "@/features/cards/audio/model/card-audio"
import type { Card, VisibleCardSide } from "@/features/cards/model/card"
import { hasMeaningfulHtmlContent } from "@/shared/lib/html"

type AudioPreviewState = "none" | "selected" | "stale" | "ready"

export type EditCardAudioActionResult =
  | {
      ok: true
    }
  | {
      message: string
      ok: false
    }

export type EditCardAudioErrorEvent = {
  id: number
  message: string
}

type EditCardAudioSideState = {
  valueLabel: string
  isActionDisabled: boolean
  isPreviewDisabled: boolean
  isPreviewLoading: boolean
  previewState: AudioPreviewState
  setHtml: (html: string) => void
  playPreview: () => Promise<EditCardAudioActionResult>
}

type UseEditCardAudioOptions = {
  initialCard?: Card
}

type ResolvedPersistedFileUrls = Record<VisibleCardSide, string | null>

type ResolvedPersistedFileUrlsAction =
  | { type: "reset" }
  | { fileUrl: string; side: VisibleCardSide; type: "set" }

function resolvedPersistedFileUrlsReducer(
  state: ResolvedPersistedFileUrls,
  action: ResolvedPersistedFileUrlsAction,
): ResolvedPersistedFileUrls {
  switch (action.type) {
    case "reset":
      return { front: null, back: null }
    case "set":
      return { ...state, [action.side]: action.fileUrl }
  }
}

type ErrorState = {
  current: EditCardAudioErrorEvent | null
  nextId: number
}

type ErrorAction = { type: "clear" } | { message: string; type: "report" }

function errorReducer(state: ErrorState, action: ErrorAction): ErrorState {
  switch (action.type) {
    case "clear":
      return { ...state, current: null }
    case "report": {
      const nextId = state.nextId + 1
      return {
        current: {
          id: nextId,
          message: action.message,
        },
        nextId,
      }
    }
  }
}

function audioSuccess(): EditCardAudioActionResult {
  return { ok: true }
}

function audioFailure(message: string): EditCardAudioActionResult {
  return { message, ok: false }
}

export function useEditCardAudio({
  initialCard,
}: UseEditCardAudioOptions = {}) {
  const { t } = useTranslation("editCard")
  const { status, user } = useAuthSession()
  const audioSelectionDraft = useAudioSelectionDraft()
  const [resolvedPersistedFileUrls, dispatchResolvedPersistedFileUrls] =
    useReducer(resolvedPersistedFileUrlsReducer, {
      front: null,
      back: null,
    })
  const frontAudioPreview = useFileAudioPlayer({
    sourceUrl:
      audioSelectionDraft.front.fileUrl ??
      (!audioSelectionDraft.front.isDirty
        ? resolvedPersistedFileUrls.front
        : null),
  })
  const backAudioPreview = useFileAudioPlayer({
    sourceUrl:
      audioSelectionDraft.back.fileUrl ??
      (!audioSelectionDraft.back.isDirty
        ? resolvedPersistedFileUrls.back
        : null),
  })
  const pendingDraftRequestKeyRef = useRef<
    Record<VisibleCardSide, string | null>
  >({
    front: null,
    back: null,
  })
  const [errorState, dispatchError] = useReducer(errorReducer, {
    current: null,
    nextId: 0,
  })
  const error = errorState.current

  useEffect(() => {
    resetAudioSelectionDraft()
    dispatchError({ type: "clear" })
    dispatchResolvedPersistedFileUrls({ type: "reset" })
    setAudioSelectionDraftHtml("front", initialCard?.frontHtml ?? "")
    setAudioSelectionDraftHtml("back", initialCard?.backHtml ?? "")
    hydrateAudioSelectionDraftSide("front", {
      locale: initialCard?.frontTtsLocale ?? null,
      assetId: null,
      fileUrl: null,
      hasAudio: initialCard?.frontHasSound ?? false,
    })
    hydrateAudioSelectionDraftSide("back", {
      locale: initialCard?.backTtsLocale ?? null,
      assetId: null,
      fileUrl: null,
      hasAudio: initialCard?.backHasSound ?? false,
    })

    return () => {
      resetAudioSelectionDraft()
    }
  }, [
    initialCard?.backHtml,
    initialCard?.backHasSound,
    initialCard?.backTtsLocale,
    initialCard?.frontHtml,
    initialCard?.frontHasSound,
    initialCard?.frontTtsLocale,
  ])

  useEffect(() => {
    const reportError = (message: string) => {
      dispatchError({ message, type: "report" })
    }

    const createDraftAudio = async (
      side: VisibleCardSide,
      locale: SupportedTtsLocale,
      html: string,
    ) => {
      const requestKey = JSON.stringify({ html, locale, side })
      pendingDraftRequestKeyRef.current[side] = requestKey

      if (status !== "signed-in" || !user?.refreshToken) {
        setAudioSelectionDraftError(side, locale)
        reportError(t("audioSignInRequired"))
        return
      }

      try {
        const audio = await resolveDraftAudio(
          {
            refreshToken: user.refreshToken,
            html,
            locale,
          },
          {
            requestFailed: t("audioRequestFailed"),
            unexpectedResponse: t("audioUnexpectedResponse"),
          },
        )

        if (pendingDraftRequestKeyRef.current[side] !== requestKey) {
          return
        }

        setAudioSelectionDraftReady(side, locale, audio.assetId, audio.fileUrl)

        const preview = side === "front" ? frontAudioPreview : backAudioPreview
        const playResult = await preview.playAudio(audio.fileUrl)

        if (!playResult.ok) {
          reportError(playResult.message)
        }
      } catch (error) {
        if (pendingDraftRequestKeyRef.current[side] !== requestKey) {
          return
        }

        setAudioSelectionDraftError(side, locale)
        reportError(getErrorMessage(error, t("audioUnavailable")))
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
    const resolvedPersistedFileUrl = sideDraft.isDirty
      ? null
      : resolvedPersistedFileUrls[side]
    const audioPreview = side === "front" ? frontAudioPreview : backAudioPreview
    const hasMeaningfulContent = hasMeaningfulHtmlContent(sideDraft.html)
    const canResolvePersistedAudio =
      initialCard?.id != null &&
      (side === "front"
        ? initialCard.frontHasSound
        : initialCard.backHasSound) &&
      !sideDraft.isDirty &&
      sideDraft.status !== "stale"

    return {
      valueLabel: sideDraft.locale
        ? t(`languageSelection.languages.${sideDraft.locale}.label`)
        : t("languageSelection.none"),
      isActionDisabled: !hasMeaningfulContent,
      isPreviewDisabled:
        !hasMeaningfulContent ||
        (sideDraft.fileUrl == null &&
          resolvedPersistedFileUrl == null &&
          sideDraft.status !== "stale" &&
          !canResolvePersistedAudio) ||
        sideDraft.status === "creating",
      isPreviewLoading:
        sideDraft.status === "creating" || audioPreview.isLoading,
      previewState: !sideDraft.locale
        ? "none"
        : sideDraft.fileUrl || resolvedPersistedFileUrl
          ? "ready"
          : sideDraft.status === "stale"
            ? "stale"
            : "selected",
      setHtml: (html) => {
        setAudioSelectionDraftHtml(side, html)
      },
      playPreview: async () => {
        if (sideDraft.status === "stale" && sideDraft.locale) {
          setAudioSelectionDraftCreating(side, sideDraft.locale)
          return audioSuccess()
        }

        if (
          sideDraft.fileUrl == null &&
          resolvedPersistedFileUrl == null &&
          canResolvePersistedAudio &&
          (status !== "signed-in" || !user?.refreshToken)
        ) {
          return audioFailure(t("audioSignInRequired"))
        }

        if (
          sideDraft.fileUrl == null &&
          resolvedPersistedFileUrl == null &&
          canResolvePersistedAudio &&
          status === "signed-in" &&
          user?.refreshToken
        ) {
          try {
            const audio = await resolveCardAudio(
              {
                refreshToken: user.refreshToken,
                cardId: initialCard.id,
                visibleSide: side,
              },
              {
                requestFailed: t("audioRequestFailed"),
                unexpectedResponse: t("audioUnexpectedResponse"),
              },
            )

            hydrateAudioSelectionDraftSide(side, {
              locale: sideDraft.locale,
              assetId: audio.assetId,
              fileUrl: audio.fileUrl,
            })

            dispatchResolvedPersistedFileUrls({
              fileUrl: audio.fileUrl,
              side,
              type: "set",
            })

            const result = await audioPreview.playAudio(audio.fileUrl)

            if (!result.ok) {
              return result
            }

            return audioSuccess()
          } catch (error) {
            return audioFailure(getErrorMessage(error, t("audioUnavailable")))
          }
        }

        const result = await audioPreview.playAudio()

        if (!result.ok) {
          return result
        }

        return audioSuccess()
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
    error,
    clearError: () => {
      dispatchError({ type: "clear" })
    },
    getPersistedSelection: getVisibleCardTtsSelection,
    persistCardAudio: async (cardSetId: string) => {
      const tts = getCanonicalTtsSelection()

      if (Object.keys(tts).length === 0) {
        return audioSuccess()
      }

      if (status !== "signed-in" || !user?.refreshToken) {
        return audioFailure(t("audioSignInRequired"))
      }

      try {
        await attachCardAudio(
          {
            refreshToken: user.refreshToken,
            cardSetId,
            tts,
          },
          {
            requestFailed: t("audioRequestFailed"),
            unexpectedResponse: t("audioUnexpectedResponse"),
          },
        )
        return audioSuccess()
      } catch (error) {
        return audioFailure(getErrorMessage(error, t("audioUnavailable")))
      }
    },
    resetDraft: resetAudioSelectionDraft,
  }
}
