import { act, renderHook } from "@testing-library/react-native"

import {
  clearAudioSelectionDraftSide,
  hydrateAudioSelectionDraftSide,
  resetAudioSelectionDraft,
  setAudioSelectionDraftCreating,
  setAudioSelectionDraftError,
  setAudioSelectionDraftHtml,
  setAudioSelectionDraftReady,
  useAudioSelectionDraft,
} from "@/features/cards/audio/lib/audio-selection-draft"

describe("audio selection draft store", () => {
  beforeEach(() => {
    act(() => {
      resetAudioSelectionDraft()
    })
  })

  afterEach(() => {
    act(() => {
      resetAudioSelectionDraft()
    })
  })

  it("hydrates existing audio and preserves ready audio when normalized text stays the same", () => {
    const { result } = renderHook(() => useAudioSelectionDraft())

    act(() => {
      setAudioSelectionDraftHtml("front", "<p>Hello&nbsp;world</p>")
      hydrateAudioSelectionDraftSide("front", {
        locale: "en-US",
        assetId: "asset-1",
        fileUrl: "https://audio.example/front.mp3",
        hasAudio: true,
      })
    })

    expect(result.current.front).toMatchObject({
      locale: "en-US",
      assetId: "asset-1",
      fileUrl: "https://audio.example/front.mp3",
      audioText: "Hello world",
      isDirty: false,
      status: "ready",
    })

    act(() => {
      setAudioSelectionDraftHtml("front", "<div>Hello world</div>")
    })

    expect(result.current.front).toMatchObject({
      html: "<div>Hello world</div>",
      locale: "en-US",
      assetId: "asset-1",
      fileUrl: "https://audio.example/front.mp3",
      audioText: "Hello world",
      isDirty: false,
      status: "ready",
    })
  })

  it("invalidates ready audio when the normalized text changes", () => {
    const { result } = renderHook(() => useAudioSelectionDraft())

    act(() => {
      setAudioSelectionDraftHtml("front", "<p>Hello</p>")
      hydrateAudioSelectionDraftSide("front", {
        locale: "en-US",
        assetId: "asset-1",
        fileUrl: "https://audio.example/front.mp3",
        hasAudio: true,
      })
      setAudioSelectionDraftHtml("front", "<p>Hello there</p>")
    })

    expect(result.current.front).toMatchObject({
      html: "<p>Hello there</p>",
      locale: "en-US",
      assetId: null,
      fileUrl: null,
      audioText: null,
      isDirty: true,
      status: "stale",
    })
  })

  it("cancels pending draft audio when the source text changes mid-generation", () => {
    const { result } = renderHook(() => useAudioSelectionDraft())

    act(() => {
      setAudioSelectionDraftHtml("front", "<p>Hello</p>")
      setAudioSelectionDraftCreating("front", "de-DE")
      setAudioSelectionDraftHtml("front", "<p>Updated</p>")
    })

    expect(result.current.front).toMatchObject({
      html: "<p>Updated</p>",
      locale: "de-DE",
      assetId: null,
      fileUrl: null,
      audioText: null,
      isDirty: true,
      status: "idle",
    })
  })

  it("transitions through ready, error, clear, and reset states", () => {
    const { result } = renderHook(() => useAudioSelectionDraft())

    act(() => {
      setAudioSelectionDraftHtml("back", "<p>Auf Wiedersehen</p>")
      setAudioSelectionDraftReady(
        "back",
        "de-DE",
        "asset-back",
        "https://audio.example/back.mp3",
      )
    })

    expect(result.current.back).toMatchObject({
      locale: "de-DE",
      assetId: "asset-back",
      fileUrl: "https://audio.example/back.mp3",
      audioText: "Auf Wiedersehen",
      isDirty: true,
      status: "ready",
    })

    act(() => {
      setAudioSelectionDraftError("back", "de-DE")
    })

    expect(result.current.back).toMatchObject({
      locale: "de-DE",
      assetId: null,
      fileUrl: null,
      audioText: null,
      isDirty: true,
      status: "error",
    })

    act(() => {
      clearAudioSelectionDraftSide("back")
    })

    expect(result.current.back).toMatchObject({
      locale: null,
      assetId: null,
      fileUrl: null,
      audioText: null,
      isDirty: true,
      status: "idle",
    })

    act(() => {
      resetAudioSelectionDraft()
    })

    expect(result.current).toEqual({
      front: {
        html: "",
        locale: null,
        assetId: null,
        fileUrl: null,
        audioText: null,
        isDirty: false,
        status: "idle",
      },
      back: {
        html: "",
        locale: null,
        assetId: null,
        fileUrl: null,
        audioText: null,
        isDirty: false,
        status: "idle",
      },
    })
  })
})
