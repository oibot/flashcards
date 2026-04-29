const mockCreateTtsCacheKey = jest.fn()
const mockGenerateElevenLabsAudio = jest.fn()
const mockGetTtsAudioContentType = jest.fn()
const mockResolveTtsConfig = jest.fn()
const mockGetReadyFileUrl = jest.fn()
const mockPersistGeneratedTtsAsset = jest.fn()
const mockQuerySharedTtsAsset = jest.fn()
const mockUploadGeneratedAudio = jest.fn()

jest.mock("@/features/cards/audio/model/card-audio", () => {
  const actual = jest.requireActual("@/features/cards/audio/model/card-audio")

  return {
    ...actual,
    createTtsCacheKey: (...args: unknown[]) => mockCreateTtsCacheKey(...args),
  }
})

jest.mock("@/features/cards/audio/server/elevenlabs", () => ({
  generateElevenLabsAudio: (...args: unknown[]) =>
    mockGenerateElevenLabsAudio(...args),
  getTtsAudioContentType: (...args: unknown[]) =>
    mockGetTtsAudioContentType(...args),
  resolveTtsConfig: (...args: unknown[]) => mockResolveTtsConfig(...args),
}))

jest.mock("@/features/cards/audio/server/instant-tts-assets", () => ({
  getReadyFileUrl: (...args: unknown[]) => mockGetReadyFileUrl(...args),
  persistGeneratedTtsAsset: (...args: unknown[]) =>
    mockPersistGeneratedTtsAsset(...args),
  querySharedTtsAsset: (...args: unknown[]) => mockQuerySharedTtsAsset(...args),
  uploadGeneratedAudio: (...args: unknown[]) =>
    mockUploadGeneratedAudio(...args),
}))

jest.mock("@/features/cards/audio/server/log", () => ({
  logTtsError: jest.fn(),
  logTtsInfo: jest.fn(),
  logTtsWarn: jest.fn(),
  summarizeCacheKey: (cacheKey: string) => cacheKey.slice(0, 12),
}))

import { resolveDraftTts } from "@/features/cards/audio/server/resolve-draft-tts"

const DEFAULT_CONFIG = {
  provider: "elevenlabs" as const,
  locale: "en-US" as const,
  voiceId: "voice-en",
  modelId: "model-1",
  outputFormat: "mp3" as const,
}

function createReadyAsset(id: string, fileUrl: string) {
  return {
    id,
    status: "ready",
    file: {
      url: fileUrl,
    },
  }
}

describe("resolveDraftTts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateTtsCacheKey.mockResolvedValue("cache-key")
    mockResolveTtsConfig.mockReturnValue(DEFAULT_CONFIG)
    mockGetTtsAudioContentType.mockReturnValue("audio/mpeg")
    mockGetReadyFileUrl.mockImplementation((asset) => asset?.file?.url ?? null)
    mockGenerateElevenLabsAudio.mockResolvedValue(Uint8Array.from([1, 2, 3]))
    mockUploadGeneratedAudio.mockResolvedValue({
      data: {
        id: "file-1",
      },
    })
    mockPersistGeneratedTtsAsset.mockResolvedValue(undefined)
  })

  it("rejects draft sides that do not contain speakable text", async () => {
    await expect(
      resolveDraftTts({
        userId: "user-1",
        html: "<p>&nbsp;</p>",
        locale: "en-US",
      }),
    ).rejects.toMatchObject({
      message: "Card side does not contain speakable text.",
      status: 422,
    })

    expect(mockResolveTtsConfig).not.toHaveBeenCalled()
    expect(mockQuerySharedTtsAsset).not.toHaveBeenCalled()
  })

  it("returns a shared cached asset when one is already ready", async () => {
    mockQuerySharedTtsAsset.mockResolvedValue(
      createReadyAsset("asset-shared", "https://audio.example/shared.mp3"),
    )

    await expect(
      resolveDraftTts({
        userId: "user-1",
        html: "<p>Hello world</p>",
        locale: "en-US",
      }),
    ).resolves.toEqual({
      status: "ready",
      assetId: "asset-shared",
      fileUrl: "https://audio.example/shared.mp3",
      cacheHit: true,
    })

    expect(mockGenerateElevenLabsAudio).not.toHaveBeenCalled()
    expect(mockUploadGeneratedAudio).not.toHaveBeenCalled()
    expect(mockPersistGeneratedTtsAsset).not.toHaveBeenCalled()
  })

  it("generates, uploads, and reloads audio on a cache miss", async () => {
    mockQuerySharedTtsAsset
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(
        createReadyAsset(
          "asset-generated",
          "https://audio.example/generated.mp3",
        ),
      )

    await expect(
      resolveDraftTts({
        userId: "user-1",
        html: "<p>Hello world</p>",
        locale: "en-US",
      }),
    ).resolves.toEqual({
      status: "ready",
      assetId: "asset-generated",
      fileUrl: "https://audio.example/generated.mp3",
      cacheHit: false,
    })

    expect(mockGenerateElevenLabsAudio).toHaveBeenCalledWith(
      "Hello world",
      DEFAULT_CONFIG,
    )
    expect(mockUploadGeneratedAudio).toHaveBeenCalledWith(
      "cache-key",
      Uint8Array.from([1, 2, 3]),
      "audio/mpeg",
    )
    expect(mockPersistGeneratedTtsAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        existingAsset: undefined,
        cacheKey: "cache-key",
        normalizedText: "Hello world",
        config: DEFAULT_CONFIG,
        fileId: "file-1",
      }),
    )
    expect(
      mockPersistGeneratedTtsAsset.mock.calls[0]?.[0]?.sourceText,
    ).toContain("Hello world")
  })

  it("returns the raced shared asset when persistence loses a write race", async () => {
    mockQuerySharedTtsAsset
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(
        createReadyAsset("asset-raced", "https://audio.example/raced.mp3"),
      )
    mockPersistGeneratedTtsAsset.mockRejectedValue(new Error("race"))

    await expect(
      resolveDraftTts({
        userId: "user-1",
        html: "<p>Hello world</p>",
        locale: "en-US",
      }),
    ).resolves.toEqual({
      status: "ready",
      assetId: "asset-raced",
      fileUrl: "https://audio.example/raced.mp3",
      cacheHit: false,
    })

    expect(mockQuerySharedTtsAsset).toHaveBeenCalledTimes(2)
  })
})
