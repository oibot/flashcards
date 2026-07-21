const envKey = "EXPO_PUBLIC_FEATURE_AUDIO_CREATION"
const originalValue = process.env[envKey]

function loadAudioCreationFlag(value?: string) {
  if (value === undefined) {
    delete process.env[envKey]
  } else {
    process.env[envKey] = value
  }

  let audioCreation = false

  jest.isolateModules(() => {
    const module = require("@/shared/config/feature-flags") as {
      featureFlags: { audioCreation: boolean }
    }

    audioCreation = module.featureFlags.audioCreation
  })

  return audioCreation
}

describe("featureFlags", () => {
  afterAll(() => {
    if (originalValue === undefined) {
      delete process.env[envKey]
    } else {
      process.env[envKey] = originalValue
    }
  })

  it("enables audio creation only for the exact true value", () => {
    expect(loadAudioCreationFlag("true")).toBe(true)
    expect(loadAudioCreationFlag("TRUE")).toBe(false)
    expect(loadAudioCreationFlag("false")).toBe(false)
  })

  it("defaults audio creation to disabled", () => {
    expect(loadAudioCreationFlag()).toBe(false)
  })
})
