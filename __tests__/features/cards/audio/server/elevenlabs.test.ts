const ORIGINAL_ENV = process.env

jest.mock("@/features/cards/audio/server/log", () => ({
  logTtsError: jest.fn(),
  logTtsInfo: jest.fn(),
  summarizeText: (text: string) => text,
}))

function createAudioEnv(
  overrides: Partial<Record<`ELEVENLABS_${string}`, string>>,
) {
  const nextEnv = Object.fromEntries(
    Object.entries(ORIGINAL_ENV).filter(
      ([key]) => !key.startsWith("ELEVENLABS_"),
    ),
  ) as NodeJS.ProcessEnv

  return {
    ...nextEnv,
    ...overrides,
  }
}

function requireElevenLabs(
  overrides: Partial<Record<`ELEVENLABS_${string}`, string>> = {},
) {
  jest.resetModules()
  process.env = createAudioEnv(overrides)

  return require("@/features/cards/audio/server/elevenlabs")
}

describe("ElevenLabs TTS helpers", () => {
  afterEach(() => {
    process.env = ORIGINAL_ENV
    jest.restoreAllMocks()
    jest.resetModules()
  })

  it("discovers the configured locale profiles", () => {
    const elevenlabs = requireElevenLabs()

    expect(elevenlabs.getTtsAudioContentType("mp3")).toBe("audio/mpeg")
    expect(elevenlabs.getConfiguredTtsLocales()).toEqual([
      "en-US",
      "de-DE",
      "es-ES",
      "fr-FR",
      "pt-BR",
      "ja-JP",
      "zh-CN",
      "ru-RU",
      "th-TH",
    ])
    expect(elevenlabs.getConfiguredTtsVoiceProfiles()).toEqual([
      {
        locale: "en-US",
        voiceId: "2vbhUP8zyKg4dEZaTWGn",
        modelId: "eleven_flash_v2_5",
      },
      {
        locale: "de-DE",
        voiceId: "JiW03c2Gt43XNUQAumRP",
        modelId: "eleven_flash_v2_5",
      },
      {
        locale: "es-ES",
        voiceId: "ODO4sbmD3pTjhgRVVRP6",
        modelId: "eleven_flash_v2_5",
      },
      {
        locale: "fr-FR",
        voiceId: "fMikjf4u2qBd4gPl7yuw",
        modelId: "eleven_flash_v2_5",
      },
      {
        locale: "pt-BR",
        voiceId: "7iqXtOF3wl3pomwXFY7G",
        modelId: "eleven_flash_v2_5",
      },
      {
        locale: "ja-JP",
        voiceId: "GxhGYQesaQaYKePCZDEC",
        modelId: "eleven_flash_v2_5",
      },
      {
        locale: "zh-CN",
        voiceId: "BqljjWyTnrioXPCNkCd4",
        modelId: "eleven_flash_v2_5",
      },
      {
        locale: "ru-RU",
        voiceId: "KpX1OoMT6Br64YtIpgRI",
        modelId: "eleven_flash_v2_5",
      },
      {
        locale: "th-TH",
        voiceId: "xVv8qLTTnsYnrysc2Lx4",
        modelId: "eleven_v3",
      },
    ])
  })

  it("resolves a checked-in voice profile for a locale", () => {
    const elevenlabs = requireElevenLabs()

    expect(elevenlabs.getTtsVoiceProfile("ja-JP")).toEqual({
      locale: "ja-JP",
      voiceId: "GxhGYQesaQaYKePCZDEC",
      modelId: "eleven_flash_v2_5",
    })
    expect(elevenlabs.resolveTtsConfig("ja-JP")).toEqual({
      provider: "elevenlabs",
      locale: "ja-JP",
      voiceId: "GxhGYQesaQaYKePCZDEC",
      modelId: "eleven_flash_v2_5",
      outputFormat: "mp3",
    })
  })

  it("uses Eleven v3 for Thai and does not apply a global model override", () => {
    const elevenlabs = requireElevenLabs({
      ELEVENLABS_MODEL_ID: "model-123",
    })

    expect(elevenlabs.getTtsBaseConfig()).toEqual({
      provider: "elevenlabs",
      outputFormat: "mp3",
    })
    expect(elevenlabs.resolveTtsConfig("en-US").modelId).toBe(
      "eleven_flash_v2_5",
    )
    expect(elevenlabs.resolveTtsConfig("th-TH")).toEqual({
      provider: "elevenlabs",
      locale: "th-TH",
      voiceId: "xVv8qLTTnsYnrysc2Lx4",
      modelId: "eleven_v3",
      outputFormat: "mp3",
    })
  })

  it("sends the Thai language code and locale-specific model to ElevenLabs", async () => {
    const elevenlabs = requireElevenLabs({
      ELEVENLABS_API_KEY: "test-api-key",
    })
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(3),
    } as Response)
    const config = elevenlabs.resolveTtsConfig("th-TH")

    await elevenlabs.generateElevenLabsAudio("สวัสดี", config)

    const [requestUrl, requestInit] = fetchMock.mock.calls[0] ?? []

    expect(String(requestUrl)).toBe(
      "https://api.elevenlabs.io/v1/text-to-speech/xVv8qLTTnsYnrysc2Lx4?output_format=mp3_44100_128",
    )
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      text: "สวัสดี",
      model_id: "eleven_v3",
      language_code: "th",
    })
  })

  it("rejects an empty successful response instead of storing invalid audio", async () => {
    const elevenlabs = requireElevenLabs({
      ELEVENLABS_API_KEY: "test-api-key",
    })
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(0),
    } as Response)

    await expect(
      elevenlabs.generateElevenLabsAudio(
        "ๅ",
        elevenlabs.resolveTtsConfig("th-TH"),
      ),
    ).rejects.toMatchObject({
      message: "ElevenLabs returned an empty audio payload.",
      status: 502,
    })
  })
})
