import { useSyncExternalStore } from "react"

import type { VisibleCardSide } from "@/domain/card"
import type { SupportedTtsLocale } from "@/domain/card-audio"

type AudioSelectionDraft = Record<VisibleCardSide, SupportedTtsLocale | null>

function createEmptyDraft(): AudioSelectionDraft {
  return {
    front: null,
    back: null,
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

export function useAudioSelectionDraft() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function setAudioSelectionDraft(
  side: VisibleCardSide,
  locale: SupportedTtsLocale | null,
) {
  currentDraft = {
    ...currentDraft,
    [side]: locale,
  }
  emitChange()
}

export function resetAudioSelectionDraft() {
  currentDraft = createEmptyDraft()
  emitChange()
}
