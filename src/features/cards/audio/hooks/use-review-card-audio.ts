import * as Sentry from "@sentry/react-native"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useAuthSession } from "@/features/auth/hooks/use-auth-session"
import { resolveCardAudio } from "@/features/cards/audio/api/tts-client"
import { useFileAudioPlayer } from "@/features/cards/audio/hooks/use-file-audio-player"
import { getErrorMessage } from "@/features/cards/audio/lib/tts-client-errors"
import type { VisibleCardSide } from "@/features/cards/model/card"
import { getErrorLogAttributes } from "@/shared/lib/error"

type UseReviewCardAudioOptions = {
  cardId: string
  visibleSide: VisibleCardSide
}

type PlayAudioResult = { ok: true } | { message: string; ok: false }

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
      const audio = await resolveCardAudio(
        {
          refreshToken: user.refreshToken,
          cardId,
          visibleSide,
        },
        {
          requestFailed: t("audioRequestFailed"),
          unexpectedResponse: t("audioUnexpectedResponse"),
        },
      )

      setResolvedAudio({ fileUrl: audio.fileUrl, key: requestKey })
      return fileAudioPlayer.playAudio(audio.fileUrl)
    } catch (error) {
      setResolvedAudio({ fileUrl: null, key: requestKey })
      Sentry.logger.error("Review card audio playback failed.", {
        feature: "audio",
        ...getErrorLogAttributes(error),
      })
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
