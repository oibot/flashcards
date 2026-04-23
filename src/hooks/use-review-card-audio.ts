import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAuthSession } from "@/auth/use-auth-session"
import type { VisibleCardSide } from "@/domain/card"
import type { TtsResolveReadyResponse } from "@/domain/card-audio"

type UseReviewCardAudioOptions = {
  cardId: string
  visibleSide: VisibleCardSide
}

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
  const player = useAudioPlayer(null, {
    updateInterval: 250,
  })
  const playerStatus = useAudioPlayerStatus(player)
  const currentSourceUrlRef = useRef<string | null>(null)
  const previousPlayerStatusRef = useRef<{
    currentTime: number
    didJustFinish: boolean
    duration: number
    isBuffering: boolean
    isLoaded: boolean
    playbackState: string
    playing: boolean
    reasonForWaitingToPlay: string
    timeControlStatus: string
  } | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [shouldPlayWhenLoaded, setShouldPlayWhenLoaded] = useState(false)

  useEffect(() => {
    const configureAudioMode = async () => {
      await setAudioModeAsync({
        interruptionMode: "duckOthers",
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      })
    }

    configureAudioMode().catch((error) => {
      console.error("Failed to configure review card audio mode.", error)
    })
  }, [])

  useEffect(() => {
    player.pause()
    currentSourceUrlRef.current = null
    setIsResolving(false)
    setErrorMessage(null)
    setShouldPlayWhenLoaded(false)
  }, [cardId, player, visibleSide])

  useEffect(() => {
    const previousStatus = previousPlayerStatusRef.current
    const nextStatus = {
      currentTime: playerStatus.currentTime,
      didJustFinish: playerStatus.didJustFinish,
      duration: playerStatus.duration,
      isBuffering: playerStatus.isBuffering,
      isLoaded: playerStatus.isLoaded,
      playbackState: playerStatus.playbackState,
      playing: playerStatus.playing,
      reasonForWaitingToPlay: playerStatus.reasonForWaitingToPlay,
      timeControlStatus: playerStatus.timeControlStatus,
    }

    if (
      previousStatus === null ||
      previousStatus.isLoaded !== nextStatus.isLoaded ||
      previousStatus.isBuffering !== nextStatus.isBuffering ||
      previousStatus.playing !== nextStatus.playing ||
      previousStatus.didJustFinish !== nextStatus.didJustFinish ||
      previousStatus.playbackState !== nextStatus.playbackState ||
      previousStatus.timeControlStatus !== nextStatus.timeControlStatus ||
      previousStatus.reasonForWaitingToPlay !==
        nextStatus.reasonForWaitingToPlay
    ) {
      console.log("Review card audio player status changed.", {
        cardId,
        visibleSide,
        ...nextStatus,
      })
    }

    previousPlayerStatusRef.current = nextStatus
  }, [
    cardId,
    playerStatus.currentTime,
    playerStatus.didJustFinish,
    playerStatus.duration,
    playerStatus.isBuffering,
    playerStatus.isLoaded,
    playerStatus.playbackState,
    playerStatus.playing,
    playerStatus.reasonForWaitingToPlay,
    playerStatus.timeControlStatus,
    visibleSide,
  ])

  useEffect(() => {
    if (!shouldPlayWhenLoaded || !playerStatus.isLoaded) {
      return
    }

    const startPlayback = async () => {
      try {
        await player.seekTo(0)
        player.play()
        console.log("Started review card audio playback.", {
          cardId,
          visibleSide,
          duration: playerStatus.duration,
          sourceUrl: currentSourceUrlRef.current,
        })
      } catch (error) {
        currentSourceUrlRef.current = null
        player.pause()
        console.error("Failed to start review card audio playback.", error)
        setErrorMessage(t("audioUnavailable"))
      } finally {
        setShouldPlayWhenLoaded(false)
      }
    }

    void startPlayback()
  }, [
    cardId,
    player,
    playerStatus.duration,
    playerStatus.isLoaded,
    shouldPlayWhenLoaded,
    t,
    visibleSide,
  ])

  const playAudio = async () => {
    if (isResolving || shouldPlayWhenLoaded) {
      return
    }

    if (currentSourceUrlRef.current && playerStatus.isLoaded) {
      setErrorMessage(null)
      await player.seekTo(0)
      player.play()
      return
    }

    if (status !== "signed-in" || !user?.refreshToken) {
      setErrorMessage(t("audioUnavailable"))
      return
    }

    setIsResolving(true)
    setErrorMessage(null)

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

      currentSourceUrlRef.current = payload.fileUrl
      setShouldPlayWhenLoaded(true)
      player.replace(payload.fileUrl)
    } catch (error) {
      currentSourceUrlRef.current = null
      player.pause()
      setShouldPlayWhenLoaded(false)
      console.error("Review card audio playback failed.", error)
      setErrorMessage(t("audioUnavailable"))
    } finally {
      setIsResolving(false)
    }
  }

  return {
    errorMessage,
    isLoading: isResolving,
    isPlaying: playerStatus.playing,
    playAudio,
  }
}
