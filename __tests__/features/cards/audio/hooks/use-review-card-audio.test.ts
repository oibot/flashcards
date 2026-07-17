const mockUseAuthSession = jest.fn()
const mockUseFileAudioPlayer = jest.fn()

jest.mock("@sentry/react-native", () => ({
  logger: {
    error: jest.fn(),
  },
}))

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === "audioRequestFailed") {
        return "Audio request failed."
      }

      if (key === "audioSignInRequired") {
        return "Please sign in again to load audio."
      }

      if (key === "audioUnexpectedResponse") {
        return "The audio endpoint returned an unexpected response."
      }

      if (key === "audioUnavailable") {
        return "Audio unavailable"
      }

      return key
    },
  }),
}))

jest.mock("@/features/auth/hooks/use-auth-session", () => ({
  useAuthSession: () => mockUseAuthSession(),
}))

jest.mock("@/features/cards/audio/hooks/use-file-audio-player", () => ({
  useFileAudioPlayer: (...args: unknown[]) => mockUseFileAudioPlayer(...args),
}))

import * as Sentry from "@sentry/react-native"
import { act, renderHook, waitFor } from "@testing-library/react-native"

import { useReviewCardAudio } from "@/features/cards/audio/hooks/use-review-card-audio"

const mockSentryError = jest.mocked(Sentry.logger.error)

function createFetchResponse(payload: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(payload),
  }
}

describe("useReviewCardAudio", () => {
  const mockFetch = jest.fn()
  const fileAudioPlayer = {
    isLoading: false,
    isPlaying: false,
    playAudio: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.fetch = mockFetch as unknown as typeof fetch
    mockUseAuthSession.mockReturnValue({
      status: "signed-in",
      user: {
        refreshToken: "refresh-token",
      },
    })
    fileAudioPlayer.playAudio.mockResolvedValue({ ok: true })
    mockUseFileAudioPlayer.mockReturnValue(fileAudioPlayer)
  })

  it("returns an unavailable message when the user is not signed in", async () => {
    mockUseAuthSession.mockReturnValue({
      status: "signed-out",
      user: null,
    })

    const { result } = renderHook(() =>
      useReviewCardAudio({
        cardId: "card-1",
        visibleSide: "front",
      }),
    )

    await expect(result.current.playAudio()).resolves.toEqual({
      ok: false,
      message: "Please sign in again to load audio.",
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("returns the server error message when resolving audio fails", async () => {
    mockFetch.mockResolvedValue(
      createFetchResponse({ error: "Unauthorized" }, false, 401),
    )

    const { result } = renderHook(() =>
      useReviewCardAudio({
        cardId: "card-1",
        visibleSide: "front",
      }),
    )

    await act(async () => {
      await expect(result.current.playAudio()).resolves.toEqual({
        ok: false,
        message: "HTTP 401: Unauthorized",
      })
    })
    expect(mockSentryError).toHaveBeenCalledWith(
      "Review card audio playback failed.",
      {
        feature: "audio",
        error: "HTTP 401: Unauthorized",
        error_type: "Error",
      },
    )
  })

  it("resolves audio once and then reuses the cached URL on later plays", async () => {
    mockFetch.mockResolvedValue(
      createFetchResponse({
        status: "ready",
        assetId: "asset-1",
        fileUrl: "https://audio.example/review.mp3",
      }),
    )

    const { result } = renderHook(() =>
      useReviewCardAudio({
        cardId: "card-1",
        visibleSide: "front",
      }),
    )

    await act(async () => {
      await result.current.playAudio()
    })

    await waitFor(() => {
      expect(fileAudioPlayer.playAudio).toHaveBeenNthCalledWith(
        1,
        "https://audio.example/review.mp3",
      )
    })

    await act(async () => {
      await result.current.playAudio()
    })

    expect(fileAudioPlayer.playAudio.mock.calls[1]).toEqual([])
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.current.isLoading).toBe(false)
  })
})
