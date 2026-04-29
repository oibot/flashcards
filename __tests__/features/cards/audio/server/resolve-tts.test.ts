const mockCreateTtsCacheKey = jest.fn()
const mockGenerateElevenLabsAudio = jest.fn()
const mockGetConfiguredTtsLocales = jest.fn()
const mockGetReadyFileUrl = jest.fn()
const mockGetSelectedTtsAsset = jest.fn()
const mockGetTtsAudioContentType = jest.fn()
const mockResolveTtsConfig = jest.fn()
const mockLoadCardForTts = jest.fn()
const mockPersistGeneratedTtsAsset = jest.fn()
const mockQuerySharedTtsAsset = jest.fn()
const mockUpdateCardSetTtsReference = jest.fn()
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
  getConfiguredTtsLocales: (...args: unknown[]) =>
    mockGetConfiguredTtsLocales(...args),
  getTtsAudioContentType: (...args: unknown[]) =>
    mockGetTtsAudioContentType(...args),
  resolveTtsConfig: (...args: unknown[]) => mockResolveTtsConfig(...args),
}))

jest.mock("@/features/cards/audio/server/instant-tts-assets", () => ({
  getReadyFileUrl: (...args: unknown[]) => mockGetReadyFileUrl(...args),
  getSelectedTtsAsset: (...args: unknown[]) => mockGetSelectedTtsAsset(...args),
  loadCardForTts: (...args: unknown[]) => mockLoadCardForTts(...args),
  persistGeneratedTtsAsset: (...args: unknown[]) =>
    mockPersistGeneratedTtsAsset(...args),
  querySharedTtsAsset: (...args: unknown[]) => mockQuerySharedTtsAsset(...args),
  updateCardSetTtsReference: (...args: unknown[]) =>
    mockUpdateCardSetTtsReference(...args),
  uploadGeneratedAudio: (...args: unknown[]) =>
    mockUploadGeneratedAudio(...args),
}))

jest.mock("@/features/cards/audio/server/log", () => ({
  logTtsError: jest.fn(),
  logTtsInfo: jest.fn(),
  logTtsWarn: jest.fn(),
  summarizeCacheKey: (cacheKey: string) => cacheKey.slice(0, 12),
}))

import { resolveTts } from "@/features/cards/audio/server/resolve-tts"

const DEFAULT_CONFIG = {
  provider: "elevenlabs" as const,
  locale: "en-US" as const,
  voiceId: "voice-en",
  modelId: "model-1",
  outputFormat: "mp3" as const,
}

function createReadyAsset(id: string, cacheKey: string, fileUrl: string) {
  return {
    id,
    cacheKey,
    status: "ready",
    file: {
      url: fileUrl,
    },
  }
}

function createCardRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "card-1",
    variant: "forward",
    cardSet: {
      id: "set-1",
      sideAHtml: "<p>Hello world</p>",
      sideBHtml: "<p>Back side</p>",
      sideATtsLocale: "en-US",
      sideBTtsLocale: undefined,
      sideATtsAsset: null,
      sideBTtsAsset: null,
    },
    ...overrides,
  }
}

describe("resolveTts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateTtsCacheKey.mockResolvedValue("cache-key")
    mockGetConfiguredTtsLocales.mockReturnValue(["en-US", "de-DE"])
    mockGetReadyFileUrl.mockImplementation((asset) => asset?.file?.url ?? null)
    mockGetSelectedTtsAsset.mockImplementation((cardSet, contentSide) =>
      contentSide === "sideA"
        ? (cardSet.sideATtsAsset ?? null)
        : (cardSet.sideBTtsAsset ?? null),
    )
    mockResolveTtsConfig.mockReturnValue(DEFAULT_CONFIG)
    mockGetTtsAudioContentType.mockReturnValue("audio/mpeg")
    mockGenerateElevenLabsAudio.mockResolvedValue(Uint8Array.from([4, 5, 6]))
    mockUploadGeneratedAudio.mockResolvedValue({
      data: {
        id: "file-1",
      },
    })
    mockPersistGeneratedTtsAsset.mockResolvedValue(undefined)
    mockUpdateCardSetTtsReference.mockResolvedValue(undefined)
  })

  it.each([
    {
      label: "the card is missing",
      card: undefined,
      expected: { message: "Card not found.", status: 404 },
    },
    {
      label: "the card variant is invalid",
      card: createCardRecord({ variant: "broken" }),
      expected: { message: "Card variant is invalid.", status: 500 },
    },
    {
      label: "the card content is invalid",
      card: createCardRecord({
        cardSet: {
          ...createCardRecord().cardSet,
          sideAHtml: null,
        },
      }),
      expected: { message: "Card content is invalid.", status: 500 },
    },
  ])("rejects when %s", async ({ card, expected }) => {
    mockLoadCardForTts.mockResolvedValue(card)

    await expect(
      resolveTts({
        userId: "user-1",
        cardId: "card-1",
        visibleSide: "front",
      }),
    ).rejects.toMatchObject(expected)
  })

  it("returns needs-locale when the card side has no selected locale", async () => {
    mockLoadCardForTts.mockResolvedValue(
      createCardRecord({
        cardSet: {
          ...createCardRecord().cardSet,
          sideATtsLocale: undefined,
        },
      }),
    )

    await expect(
      resolveTts({
        userId: "user-1",
        cardId: "card-1",
        visibleSide: "front",
      }),
    ).resolves.toEqual({
      status: "needs-locale",
      contentSide: "sideA",
      supportedLocales: ["en-US", "de-DE"],
    })

    expect(mockResolveTtsConfig).not.toHaveBeenCalled()
  })

  it("reuses the selected ready asset when its cache key matches the current text", async () => {
    mockLoadCardForTts.mockResolvedValue(
      createCardRecord({
        cardSet: {
          ...createCardRecord().cardSet,
          sideATtsAsset: createReadyAsset(
            "asset-selected",
            "cache-key",
            "https://audio.example/selected.mp3",
          ),
        },
      }),
    )

    await expect(
      resolveTts({
        userId: "user-1",
        cardId: "card-1",
        visibleSide: "front",
      }),
    ).resolves.toEqual({
      status: "ready",
      assetId: "asset-selected",
      fileUrl: "https://audio.example/selected.mp3",
      contentSide: "sideA",
      cacheHit: true,
    })

    expect(mockQuerySharedTtsAsset).not.toHaveBeenCalled()
    expect(mockUpdateCardSetTtsReference).not.toHaveBeenCalled()
  })

  it("reuses a shared cached asset and updates the card-set reference", async () => {
    mockLoadCardForTts.mockResolvedValue(createCardRecord())
    mockQuerySharedTtsAsset.mockResolvedValue(
      createReadyAsset(
        "asset-shared",
        "cache-key",
        "https://audio.example/shared.mp3",
      ),
    )

    await expect(
      resolveTts({
        userId: "user-1",
        cardId: "card-1",
        visibleSide: "front",
      }),
    ).resolves.toEqual({
      status: "ready",
      assetId: "asset-shared",
      fileUrl: "https://audio.example/shared.mp3",
      contentSide: "sideA",
      cacheHit: true,
    })

    expect(mockUpdateCardSetTtsReference).toHaveBeenCalledWith(
      "set-1",
      "sideA",
      "asset-shared",
    )
    expect(mockGenerateElevenLabsAudio).not.toHaveBeenCalled()
  })

  it("falls back to generating audio and attaches the generated shared asset", async () => {
    mockLoadCardForTts.mockResolvedValue(createCardRecord())
    mockQuerySharedTtsAsset
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(
        createReadyAsset(
          "asset-generated",
          "cache-key",
          "https://audio.example/generated.mp3",
        ),
      )

    await expect(
      resolveTts({
        userId: "user-1",
        cardId: "card-1",
        visibleSide: "front",
      }),
    ).resolves.toEqual({
      status: "ready",
      assetId: "asset-generated",
      fileUrl: "https://audio.example/generated.mp3",
      contentSide: "sideA",
      cacheHit: false,
    })

    expect(mockGenerateElevenLabsAudio).toHaveBeenCalledWith(
      "Hello world",
      DEFAULT_CONFIG,
    )
    expect(mockUploadGeneratedAudio).toHaveBeenCalledWith(
      "cache-key",
      Uint8Array.from([4, 5, 6]),
      "audio/mpeg",
    )
    expect(mockUpdateCardSetTtsReference).toHaveBeenCalledWith(
      "set-1",
      "sideA",
      "asset-generated",
    )
  })
})
