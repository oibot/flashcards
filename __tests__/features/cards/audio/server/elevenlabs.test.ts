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

  it("discovers configured locales and resolves the base TTS config", () => {
    const elevenlabs = requireElevenLabs({
      ELEVENLABS_MODEL_ID: "model-123",
      ELEVENLABS_VOICE_ID_EN_US: "voice-en",
      ELEVENLABS_VOICE_ID_DE_DE: "voice-de",
    })

    expect(elevenlabs.getTtsAudioContentType("mp3")).toBe("audio/mpeg")
    expect(elevenlabs.getConfiguredTtsLocales()).toEqual(["en-US", "de-DE"])
    expect(elevenlabs.getConfiguredTtsVoiceProfiles()).toEqual([
      {
        locale: "en-US",
        voiceId: "voice-en",
      },
      {
        locale: "de-DE",
        voiceId: "voice-de",
      },
    ])
    expect(elevenlabs.resolveTtsConfig("en-US")).toEqual({
      provider: "elevenlabs",
      locale: "en-US",
      voiceId: "voice-en",
      modelId: "model-123",
      outputFormat: "mp3",
    })
  })

  it("falls back to the legacy voice profile when the configured locale matches", () => {
    const elevenlabs = requireElevenLabs({
      ELEVENLABS_TTS_LOCALE: "ja-JP",
      ELEVENLABS_VOICE_ID: "legacy-voice",
    })

    expect(elevenlabs.getTtsVoiceProfile("ja-JP")).toEqual({
      locale: "ja-JP",
      voiceId: "legacy-voice",
    })
    expect(elevenlabs.getTtsConfig()).toEqual({
      provider: "elevenlabs",
      locale: "ja-JP",
      voiceId: "legacy-voice",
      modelId: "eleven_flash_v2_5",
      outputFormat: "mp3",
    })
  })

  it("throws when resolving a locale without a configured voice profile", () => {
    const elevenlabs = requireElevenLabs()

    expect(() => elevenlabs.resolveTtsConfig("fr-FR")).toThrow(
      "Missing ELEVENLABS_VOICE_ID_FR_FR.",
    )
  })

  it("throws for an unsupported legacy locale configuration", () => {
    const elevenlabs = requireElevenLabs({
      ELEVENLABS_TTS_LOCALE: "sv-SE",
      ELEVENLABS_VOICE_ID: "legacy-voice",
    })

    expect(() => elevenlabs.getTtsConfig()).toThrow(
      "Unsupported ELEVENLABS_TTS_LOCALE.",
    )
  })
})
