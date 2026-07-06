import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useAuthSession } from "@/features/auth/hooks/use-auth-session"
import { useFileAudioPlayer } from "@/features/cards/audio/hooks/use-file-audio-player"
import {
  formatTtsHttpError,
  formatUnexpectedTtsResponse,
  getErrorMessage,
} from "@/features/cards/audio/lib/tts-client-errors"
import type { TtsResolveReadyResponse } from "@/features/cards/audio/model/card-audio"
import type { VisibleCardSide } from "@/features/cards/model/card"

type UseReviewCardAudioOptions = {
  cardId: string
  visibleSide: VisibleCardSide
}

type PlayAudioResult = { ok: true } | { message: string; ok: false }

function isResolveTtsReadyResponse(
  value: unknown,
): value is TtsResolveReadyResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    value.status === "ready" &&
    "fileUrl" in value &&
    typeof value.fileUrl === "string"
  )
}

export function useReviewCardAudio({
  cardId,
  visibleSide,
}: UseReviewCardAudioOptions) {
  const { t } = useTranslation("common", { keyPrefix: "reviewSession.active" })
  const { status, user } = useAuthSession()
  const requestKey = `${cardId}:${visibleSide}`
  const [resolvedAudio, setResolvedAudio] = useState<{
    fileUrl: string | null
    key: string
  }>(() => ({ fileUrl: null, key: requestKey }))
  const [resolvingAudio, setResolvingAudio] = useState<{
    isResolving: boolean
    key: string
  }>(() => ({ isResolving: false, key: requestKey }))
  const resolvedFileUrl =
    resolvedAudio.key === requestKey ? resolvedAudio.fileUrl : null
  const isResolving =
    resolvingAudio.key === requestKey && resolvingAudio.isResolving
  const fileAudioPlayer = useFileAudioPlayer({
    resetKey: requestKey,
    sourceUrl: resolvedFileUrl,
  })

  const playAudio = async (): Promise<PlayAudioResult> => {
    if (isResolving || fileAudioPlayer.isLoading) {
      return { ok: true }
    }

    if (resolvedFileUrl) {
      return fileAudioPlayer.playAudio()
    }

    if (status !== "signed-in" || !user?.refreshToken) {
      return { message: t("audioSignInRequired"), ok: false }
    }

    setResolvingAudio({ isResolving: true, key: requestKey })

    try {
      console.log("Requesting review card audio.", {
        cardId,
        visibleSide,
      })

      const response = await fetch("/api/tts/resolve", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.refreshToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardId,
          visibleSide,
        }),
      })

      console.log("Received review card audio response.", {
        cardId,
        visibleSide,
        status: response.status,
        ok: response.ok,
      })

      const payload: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          formatTtsHttpError(response, payload, t("audioRequestFailed")),
        )
      }

      if (!isResolveTtsReadyResponse(payload)) {
        throw new Error(
          formatUnexpectedTtsResponse(response, t("audioUnexpectedResponse")),
        )
      }

      setResolvedAudio({ fileUrl: payload.fileUrl, key: requestKey })
      return fileAudioPlayer.playAudio(payload.fileUrl)
    } catch (error) {
      setResolvedAudio({ fileUrl: null, key: requestKey })
      console.error("Review card audio playback failed.", error)
      return {
        message: getErrorMessage(error, t("audioUnavailable")),
        ok: false,
      }
    } finally {
      setResolvingAudio({ isResolving: false, key: requestKey })
    }
  }

  return {
    isLoading: isResolving || fileAudioPlayer.isLoading,
    isPlaying: fileAudioPlayer.isPlaying,
    playAudio,
  }
}
