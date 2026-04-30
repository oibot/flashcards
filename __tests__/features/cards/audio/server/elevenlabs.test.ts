const ORIGINAL_ENV = process.env

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
    jest.resetModules()
  })

  it("discovers configured locales from the server-only config", () => {
    const elevenlabs = requireElevenLabs({
      ELEVENLABS_MODEL_ID: "model-123",
    })

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
    ])
    expect(elevenlabs.getConfiguredTtsVoiceProfiles()).toEqual([
      {
        locale: "en-US",
        voiceId: "2vbhUP8zyKg4dEZaTWGn",
      },
      {
        locale: "de-DE",
        voiceId: "JiW03c2Gt43XNUQAumRP",
      },
      {
        locale: "es-ES",
        voiceId: "ODO4sbmD3pTjhgRVVRP6",
      },
      {
        locale: "fr-FR",
        voiceId: "fMikjf4u2qBd4gPl7yuw",
      },
      {
        locale: "pt-BR",
        voiceId: "7iqXtOF3wl3pomwXFY7G",
      },
      {
        locale: "ja-JP",
        voiceId: "GxhGYQesaQaYKePCZDEC",
      },
      {
        locale: "zh-CN",
        voiceId: "BqljjWyTnrioXPCNkCd4",
      },
      {
        locale: "ru-RU",
        voiceId: "KpX1OoMT6Br64YtIpgRI",
      },
    ])
    expect(elevenlabs.resolveTtsConfig("en-US")).toEqual({
      provider: "elevenlabs",
      locale: "en-US",
      voiceId: "2vbhUP8zyKg4dEZaTWGn",
      modelId: "model-123",
      outputFormat: "mp3",
    })
  })

  it("resolves a checked-in voice profile for a locale", () => {
    const elevenlabs = requireElevenLabs()

    expect(elevenlabs.getTtsVoiceProfile("ja-JP")).toEqual({
      locale: "ja-JP",
      voiceId: "GxhGYQesaQaYKePCZDEC",
    })
    expect(elevenlabs.resolveTtsConfig("ja-JP")).toEqual({
      provider: "elevenlabs",
      locale: "ja-JP",
      voiceId: "GxhGYQesaQaYKePCZDEC",
      modelId: "eleven_flash_v2_5",
      outputFormat: "mp3",
    })
  })

  it("uses the default model id when no env override is provided", () => {
    const elevenlabs = requireElevenLabs()

    expect(elevenlabs.getTtsBaseConfig()).toEqual({
      provider: "elevenlabs",
      modelId: "eleven_flash_v2_5",
      outputFormat: "mp3",
    })
  })
})
