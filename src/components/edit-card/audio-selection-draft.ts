import { useSyncExternalStore } from "react"

import type { VisibleCardSide } from "@/domain/card"
import type { SupportedTtsLocale } from "@/domain/card-audio"

export type AudioSelectionDraftStatus = "idle" | "creating" | "ready" | "error"

export type AudioSelectionDraftSide = {
  html: string
  locale: SupportedTtsLocale | null
  assetId: string | null
  fileUrl: string | null
  isDirty: boolean
  status: AudioSelectionDraftStatus
}

type AudioSelectionDraft = Record<VisibleCardSide, AudioSelectionDraftSide>

function createEmptySideDraft(): AudioSelectionDraftSide {
  return {
    html: "",
    locale: null,
    assetId: null,
    fileUrl: null,
    isDirty: false,
    status: "idle",
  }
}

function createEmptyDraft(): AudioSelectionDraft {
  return {
    front: createEmptySideDraft(),
    back: createEmptySideDraft(),
  }
}

let currentDraft = createEmptyDraft()

const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => {
    listener()
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return currentDraft
}

function updateSide(
  side: VisibleCardSide,
  updater: (currentSide: AudioSelectionDraftSide) => AudioSelectionDraftSide,
) {
  currentDraft = {
    ...currentDraft,
    [side]: updater(currentDraft[side]),
  }
  emitChange()
}

export function useAudioSelectionDraft() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function setAudioSelectionDraftHtml(
  side: VisibleCardSide,
  html: string,
) {
  updateSide(side, (currentSide) => ({
    ...currentSide,
    html,
  }))
}

export function hydrateAudioSelectionDraftSide(
  side: VisibleCardSide,
  locale: SupportedTtsLocale | null,
) {
  updateSide(side, (currentSide) => ({
    ...currentSide,
    locale,
    assetId: null,
    fileUrl: null,
    isDirty: false,
    status: "idle",
  }))
}

export function clearAudioSelectionDraftSide(side: VisibleCardSide) {
  updateSide(side, (currentSide) => ({
    ...currentSide,
    locale: null,
    assetId: null,
    fileUrl: null,
    isDirty: true,
    status: "idle",
  }))
}

export function setAudioSelectionDraftCreating(
  side: VisibleCardSide,
  locale: SupportedTtsLocale,
) {
  updateSide(side, (currentSide) => ({
    ...currentSide,
    locale,
    assetId: null,
    fileUrl: null,
    isDirty: true,
    status: "creating",
  }))
}

export function setAudioSelectionDraftReady(
  side: VisibleCardSide,
  locale: SupportedTtsLocale,
  assetId: string,
  fileUrl: string,
) {
  updateSide(side, (currentSide) => ({
    ...currentSide,
    locale,
    assetId,
    fileUrl,
    isDirty: true,
    status: "ready",
  }))
}

export function setAudioSelectionDraftError(
  side: VisibleCardSide,
  locale: SupportedTtsLocale,
) {
  updateSide(side, (currentSide) => ({
    ...currentSide,
    locale,
    assetId: null,
    fileUrl: null,
    isDirty: true,
    status: "error",
  }))
}

export function resetAudioSelectionDraft() {
  currentDraft = createEmptyDraft()
  emitChange()
}
