import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAuthSession } from "@/features/auth/use-auth-session"
import type { TtsResolveReadyResponse } from "@/features/cards/audio/card-audio"
import { useFileAudioPlayer } from "@/features/cards/audio/use-file-audio-player"
import type { VisibleCardSide } from "@/features/cards/model/card"

type UseReviewCardAudioOptions = {
  cardId: string
  visibleSide: VisibleCardSide
}

type PlayAudioResult = { ok: true } | { message: string; ok: false }

type ResolveTtsErrorResponse = {
  error: string
}

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

function isResolveTtsErrorResponse(
  value: unknown,
): value is ResolveTtsErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  )
}

export function useReviewCardAudio({
  cardId,
  visibleSide,
}: UseReviewCardAudioOptions) {
  const { t } = useTranslation("common", { keyPrefix: "reviewSession.active" })
  const { status, user } = useAuthSession()
  const [resolvedFileUrl, setResolvedFileUrl] = useState<string | null>(null)
  const fileAudioPlayer = useFileAudioPlayer({
    resetKey: `${cardId}:${visibleSide}`,
    sourceUrl: resolvedFileUrl,
  })
  const [isResolving, setIsResolving] = useState(false)

  useEffect(() => {
    setResolvedFileUrl(null)
    setIsResolving(false)
  }, [cardId, visibleSide])

  const playAudio = async (): Promise<PlayAudioResult> => {
    if (isResolving || fileAudioPlayer.isLoading) {
      return { ok: true }
    }

    if (resolvedFileUrl) {
      return fileAudioPlayer.playAudio()
    }

    if (status !== "signed-in" || !user?.refreshToken) {
      return { message: t("audioUnavailable"), ok: false }
    }

    setIsResolving(true)

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
          isResolveTtsErrorResponse(payload)
            ? payload.error
            : t("audioUnavailable"),
        )
      }

      if (!isResolveTtsReadyResponse(payload)) {
        throw new Error(t("audioUnavailable"))
      }

      setResolvedFileUrl(payload.fileUrl)
      return fileAudioPlayer.playAudio(payload.fileUrl)
    } catch (error) {
      setResolvedFileUrl(null)
      console.error("Review card audio playback failed.", error)
      return { message: t("audioUnavailable"), ok: false }
    } finally {
      setIsResolving(false)
    }
  }

  return {
    isLoading: isResolving || fileAudioPlayer.isLoading,
    isPlaying: fileAudioPlayer.isPlaying,
    playAudio,
  }
}
