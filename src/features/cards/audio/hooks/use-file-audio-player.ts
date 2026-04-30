import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio"
import { useEffect, useRef, useState } from "react"

export type PlayAudioResult = { ok: true } | { message: string; ok: false }
const AUDIO_LOAD_TIMEOUT_MS = 8000
const interruptedMessage = "Audio playback was interrupted."
const missingSourceMessage = "No audio file URL is available."
const startPlaybackMessage = "Could not start audio playback."
const timeoutMessage = "Audio file took too long to load."
const loadSourceMessage = "Could not load audio file."

type UseFileAudioPlayerOptions = {
  resetKey?: string
  sourceUrl: string | null
}

export function useFileAudioPlayer({
  resetKey,
  sourceUrl,
}: UseFileAudioPlayerOptions) {
  const player = useAudioPlayer(null, {
    updateInterval: 250,
  })
  const playerStatus = useAudioPlayerStatus(player)
  const currentSourceUrlRef = useRef<string | null>(null)
  const [isLoadingSource, setIsLoadingSource] = useState(false)
  const [shouldPlayWhenLoaded, setShouldPlayWhenLoaded] = useState(false)
  const pendingPlayResultRef = useRef<{
    resolve: (result: PlayAudioResult) => void
  } | null>(null)
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const finishPendingPlay = (result: PlayAudioResult) => {
    pendingPlayResultRef.current?.resolve(result)
    pendingPlayResultRef.current = null

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
      loadTimeoutRef.current = null
    }
  }

  useEffect(() => {
    const configureAudioMode = async () => {
      await setAudioModeAsync({
        interruptionMode: "duckOthers",
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      })
    }

    void configureAudioMode().catch((error) => {
      console.error("Failed to configure file audio player mode.", error)
    })
  }, [])

  useEffect(() => {
    player.pause()
    currentSourceUrlRef.current = null
    setIsLoadingSource(false)
    setShouldPlayWhenLoaded(false)
    finishPendingPlay({ message: interruptedMessage, ok: false })
  }, [player, resetKey])

  useEffect(() => {
    return () => {
      finishPendingPlay({ message: interruptedMessage, ok: false })
    }
  }, [])

  useEffect(() => {
    if (!shouldPlayWhenLoaded) {
      return
    }

    loadTimeoutRef.current = setTimeout(() => {
      currentSourceUrlRef.current = null
      player.pause()
      setIsLoadingSource(false)
      setShouldPlayWhenLoaded(false)
      console.error("Timed out while loading audio source.")
      finishPendingPlay({ message: timeoutMessage, ok: false })
    }, AUDIO_LOAD_TIMEOUT_MS)

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
        loadTimeoutRef.current = null
      }
    }
  }, [player, shouldPlayWhenLoaded])

  useEffect(() => {
    if (!shouldPlayWhenLoaded || !playerStatus.isLoaded) {
      return
    }

    const startPlayback = async () => {
      try {
        await player.seekTo(0)
        player.play()
        finishPendingPlay({ ok: true })
      } catch (error) {
        currentSourceUrlRef.current = null
        player.pause()
        console.error("Failed to start file audio playback.", error)
        finishPendingPlay({ message: startPlaybackMessage, ok: false })
      } finally {
        setIsLoadingSource(false)
        setShouldPlayWhenLoaded(false)
      }
    }

    void startPlayback()
  }, [player, playerStatus.isLoaded, shouldPlayWhenLoaded])

  const playAudio = async (
    sourceUrlOverride?: string | null,
  ): Promise<PlayAudioResult> => {
    const nextSourceUrl = sourceUrlOverride ?? sourceUrl

    if (!nextSourceUrl) {
      return { message: missingSourceMessage, ok: false }
    }

    if (
      currentSourceUrlRef.current === nextSourceUrl &&
      playerStatus.isLoaded
    ) {
      await player.seekTo(0)
      player.play()
      return { ok: true }
    }

    setIsLoadingSource(true)
    setShouldPlayWhenLoaded(true)
    currentSourceUrlRef.current = nextSourceUrl

    try {
      player.replace(nextSourceUrl)
      return await new Promise<PlayAudioResult>((resolve) => {
        pendingPlayResultRef.current = { resolve }
      })
    } catch (error) {
      currentSourceUrlRef.current = null
      player.pause()
      setIsLoadingSource(false)
      setShouldPlayWhenLoaded(false)
      finishPendingPlay({ message: loadSourceMessage, ok: false })
      console.error("Failed to load file audio source.", error)
      return { message: loadSourceMessage, ok: false }
    }
  }

  return {
    isLoading: isLoadingSource || shouldPlayWhenLoaded,
    isPlaying: playerStatus.playing,
    playAudio,
  }
}
