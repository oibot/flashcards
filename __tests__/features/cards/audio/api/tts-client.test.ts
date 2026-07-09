import {
  attachCardAudio,
  resolveCardAudio,
  resolveDraftAudio,
} from "@/features/cards/audio/api/tts-client"

const messages = {
  requestFailed: "Audio request failed.",
  unexpectedResponse: "Unexpected audio response.",
}

function createFetchResponse(payload: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(payload),
  }
}

describe("tts client", () => {
  const mockFetch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.fetch = mockFetch as unknown as typeof fetch
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("resolves draft audio", async () => {
    mockFetch.mockResolvedValue(
      createFetchResponse({
        status: "ready",
        assetId: "asset-1",
        fileUrl: "https://audio.example/draft.mp3",
      }),
    )

    await expect(
      resolveDraftAudio(
        {
          refreshToken: "refresh-token",
          html: "<p>Hello</p>",
          locale: "en-US",
        },
        messages,
      ),
    ).resolves.toEqual({
      status: "ready",
      assetId: "asset-1",
      fileUrl: "https://audio.example/draft.mp3",
    })
    expect(mockFetch).toHaveBeenCalledWith("/api/tts/draft", {
      method: "POST",
      headers: {
        Authorization: "Bearer refresh-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: "<p>Hello</p>",
        locale: "en-US",
      }),
    })
  })

  it("resolves card audio", async () => {
    mockFetch.mockResolvedValue(
      createFetchResponse({
        status: "ready",
        assetId: "asset-1",
        fileUrl: "https://audio.example/card.mp3",
      }),
    )

    await expect(
      resolveCardAudio(
        {
          refreshToken: "refresh-token",
          cardId: "card-1",
          visibleSide: "front",
        },
        messages,
      ),
    ).resolves.toEqual({
      status: "ready",
      assetId: "asset-1",
      fileUrl: "https://audio.example/card.mp3",
    })
    expect(mockFetch).toHaveBeenCalledWith("/api/tts/resolve", {
      method: "POST",
      headers: {
        Authorization: "Bearer refresh-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardId: "card-1",
        visibleSide: "front",
      }),
    })
  })

  it("attaches card audio", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({ ok: true }))

    await expect(
      attachCardAudio(
        {
          refreshToken: "refresh-token",
          cardSetId: "set-1",
          tts: {
            sideATtsAssetId: "asset-1",
          },
        },
        messages,
      ),
    ).resolves.toBeUndefined()
    expect(mockFetch).toHaveBeenCalledWith("/api/tts/attach", {
      method: "POST",
      headers: {
        Authorization: "Bearer refresh-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardSetId: "set-1",
        tts: {
          sideATtsAssetId: "asset-1",
        },
      }),
    })
  })

  it("throws formatted server errors", async () => {
    mockFetch.mockResolvedValue(
      createFetchResponse({ error: "Unauthorized" }, false, 401),
    )

    await expect(
      resolveCardAudio(
        {
          refreshToken: "refresh-token",
          cardId: "card-1",
          visibleSide: "front",
        },
        messages,
      ),
    ).rejects.toThrow("HTTP 401: Unauthorized")
  })

  it("throws formatted unexpected response errors", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({ status: "needs-locale" }))

    await expect(
      resolveDraftAudio(
        {
          refreshToken: "refresh-token",
          html: "<p>Hello</p>",
          locale: "en-US",
        },
        messages,
      ),
    ).rejects.toThrow("HTTP 200: Unexpected audio response.")
  })
})
