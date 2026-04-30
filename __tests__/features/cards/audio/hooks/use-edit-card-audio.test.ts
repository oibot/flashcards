const mockUseAuthSession = jest.fn()
const mockUseFileAudioPlayer = jest.fn()

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

      if (key === "soundSheet.none") {
        return "None"
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

import { act, renderHook, waitFor } from "@testing-library/react-native"

import {
  type EditCardAudioActionResult,
  useEditCardAudio,
} from "@/features/cards/audio/hooks/use-edit-card-audio"
import { resetAudioSelectionDraft } from "@/features/cards/audio/lib/audio-selection-draft"
import type { Card } from "@/features/cards/model/card"

function createFetchResponse(payload: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(payload),
  }
}

function createInitialCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "card-1",
    cardSetId: "set-1",
    variant: "forward",
    tags: [],
    frontHtml: "<p>Hello world</p>",
    backHtml: "<p>Back side</p>",
    frontTtsLocale: "en-US",
    backTtsLocale: undefined,
    frontHasSound: true,
    backHasSound: false,
    createdAt: 1,
    updatedAt: 1,
    dueAt: 1,
    lastReviewedAt: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    repetition: 0,
    lapses: 0,
    state: "new",
    ...overrides,
  }
}

describe("useEditCardAudio", () => {
  const mockFetch = jest.fn()
  const frontAudioPlayer = {
    isLoading: false,
    isPlaying: false,
    playAudio: jest.fn(),
  }
  const backAudioPlayer = {
    isLoading: false,
    isPlaying: false,
    playAudio: jest.fn(),
  }
  let audioPlayerCallIndex = 0

  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.fetch = mockFetch as unknown as typeof fetch
    mockUseAuthSession.mockReturnValue({
      status: "signed-in",
      user: {
        refreshToken: "refresh-token",
      },
    })
    frontAudioPlayer.playAudio.mockResolvedValue({ ok: true })
    backAudioPlayer.playAudio.mockResolvedValue({ ok: true })
    audioPlayerCallIndex = 0
    mockUseFileAudioPlayer.mockImplementation(() => {
      const player =
        audioPlayerCallIndex % 2 === 0 ? frontAudioPlayer : backAudioPlayer

      audioPlayerCallIndex += 1
      return player
    })

    act(() => {
      resetAudioSelectionDraft()
    })
  })

  afterEach(() => {
    act(() => {
      resetAudioSelectionDraft()
    })
    jest.restoreAllMocks()
  })

  it("recreates stale draft audio and plays the resolved preview", async () => {
    mockFetch.mockResolvedValue(
      createFetchResponse({
        status: "ready",
        assetId: "asset-draft",
        fileUrl: "https://audio.example/draft.mp3",
      }),
    )

    const { result } = renderHook(() =>
      useEditCardAudio({
        initialCard: createInitialCard(),
      }),
    )

    await waitFor(() => {
      expect(result.current.front.previewState).toBe("selected")
    })

    act(() => {
      result.current.front.setHtml("<p>Hello there</p>")
    })

    expect(result.current.front.previewState).toBe("stale")

    await act(async () => {
      await result.current.front.playPreview()
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/tts/draft",
        expect.objectContaining({
          method: "POST",
        }),
      )
    })

    await waitFor(() => {
      expect(frontAudioPlayer.playAudio).toHaveBeenCalledWith(
        "https://audio.example/draft.mp3",
      )
    })

    expect(result.current.front.previewState).toBe("ready")
    expect(result.current.getPersistedSelection()).toEqual({
      front: {
        locale: "en-US",
        assetId: "asset-draft",
      },
    })
  })

  it("resolves persisted audio previews for unchanged card audio and caches the file URL", async () => {
    mockFetch.mockResolvedValue(
      createFetchResponse({
        status: "ready",
        assetId: "asset-persisted",
        fileUrl: "https://audio.example/persisted.mp3",
        contentSide: "sideA",
        cacheHit: true,
      }),
    )

    const { result } = renderHook(() =>
      useEditCardAudio({
        initialCard: createInitialCard(),
      }),
    )

    await waitFor(() => {
      expect(result.current.front.previewState).toBe("selected")
    })

    await act(async () => {
      await result.current.front.playPreview()
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/tts/resolve",
        expect.objectContaining({
          method: "POST",
        }),
      )
    })

    await waitFor(() => {
      expect(frontAudioPlayer.playAudio).toHaveBeenCalledWith(
        "https://audio.example/persisted.mp3",
      )
    })

    expect(result.current.front.previewState).toBe("ready")
    expect(result.current.front.isPreviewDisabled).toBe(false)
  })

  it("returns a preview failure when persisted audio cannot be resolved", async () => {
    mockFetch.mockResolvedValue(
      createFetchResponse({ error: "Unauthorized" }, false, 401),
    )

    const { result } = renderHook(() =>
      useEditCardAudio({
        initialCard: createInitialCard(),
      }),
    )

    await waitFor(() => {
      expect(result.current.front.previewState).toBe("selected")
    })

    let previewResult: EditCardAudioActionResult | null = null

    await act(async () => {
      previewResult = await result.current.front.playPreview()
    })

    expect(previewResult).toEqual({
      ok: false,
      message: "HTTP 401: Unauthorized",
    })
    expect(frontAudioPlayer.playAudio).not.toHaveBeenCalled()
  })

  it("publishes background draft failures as hook error data", async () => {
    mockFetch.mockResolvedValue(
      createFetchResponse({ error: "TTS provider failed" }, false, 502),
    )

    const { result } = renderHook(() =>
      useEditCardAudio({
        initialCard: createInitialCard(),
      }),
    )

    await waitFor(() => {
      expect(result.current.front.previewState).toBe("selected")
    })

    act(() => {
      result.current.front.setHtml("<p>Hello there</p>")
    })

    await act(async () => {
      await result.current.front.playPreview()
    })

    await waitFor(() => {
      expect(result.current.error).toEqual({
        id: expect.any(Number),
        message: "HTTP 502: TTS provider failed",
      })
    })

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it("returns a persistence failure when attaching generated audio fails", async () => {
    mockFetch
      .mockResolvedValueOnce(
        createFetchResponse({
          status: "ready",
          assetId: "asset-draft",
          fileUrl: "https://audio.example/draft.mp3",
        }),
      )
      .mockResolvedValueOnce(
        createFetchResponse({ error: "Attach failed" }, false, 500),
      )

    const { result } = renderHook(() =>
      useEditCardAudio({
        initialCard: createInitialCard(),
      }),
    )

    await waitFor(() => {
      expect(result.current.front.previewState).toBe("selected")
    })

    act(() => {
      result.current.front.setHtml("<p>Hello there</p>")
    })

    await act(async () => {
      await result.current.front.playPreview()
    })

    await waitFor(() => {
      expect(result.current.front.previewState).toBe("ready")
    })

    let persistResult: EditCardAudioActionResult | null = null

    await act(async () => {
      persistResult = await result.current.persistCardAudio("set-1")
    })

    expect(persistResult).toEqual({
      ok: false,
      message: "HTTP 500: Attach failed",
    })
  })
})
