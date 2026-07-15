import { getReadyFileUrl } from "@/features/cards/audio/server/tts-file"

type ReadyFileUrlInput = Parameters<typeof getReadyFileUrl>[0]

function createAsset(file: { size?: unknown; url?: unknown } | null) {
  return {
    status: "ready",
    file,
  } as unknown as ReadyFileUrlInput
}

describe("getReadyFileUrl", () => {
  it("returns a URL for a non-empty ready file", () => {
    expect(
      getReadyFileUrl(
        createAsset({
          size: 1024,
          url: "https://audio.example/ready.mp3",
        }),
      ),
    ).toBe("https://audio.example/ready.mp3")
  })

  it("supports ready file records without size metadata", () => {
    expect(
      getReadyFileUrl(createAsset({ url: "https://audio.example/legacy.mp3" })),
    ).toBe("https://audio.example/legacy.mp3")
  })

  it("rejects an empty ready file", () => {
    expect(
      getReadyFileUrl(
        createAsset({
          size: 0,
          url: "https://audio.example/empty.mp3",
        }),
      ),
    ).toBeNull()
  })
})
