import { useSyncExternalStore } from "react"

import {
  extractNormalizedTtsTextFromHtml,
  type SupportedTtsLocale,
} from "@/features/cards/audio/model/card-audio"
import type { VisibleCardSide } from "@/features/cards/model/card"

export type AudioSelectionDraftStatus =
  | "idle"
  | "creating"
  | "ready"
  | "error"
  | "stale"

export type AudioSelectionDraftSide = {
  html: string
  locale: SupportedTtsLocale | null
  assetId: string | null
  fileUrl: string | null
  audioText: string | null
  isDirty: boolean
  status: AudioSelectionDraftStatus
}

type AudioSelectionDraft = Record<VisibleCardSide, AudioSelectionDraftSide>
type AudioSelectionDraftSideHydration = Pick<
  AudioSelectionDraftSide,
  "locale" | "assetId" | "fileUrl"
> & {
  hasAudio?: boolean
}

function createEmptySideDraft(): AudioSelectionDraftSide {
  return {
    html: "",
    locale: null,
    assetId: null,
    fileUrl: null,
    audioText: null,
    isDirty: false,
    status: "idle",
  }
}

function toNormalizedAudioText(html: string) {
  const normalizedText = extractNormalizedTtsTextFromHtml(html)

  return normalizedText.length > 0 ? normalizedText : null
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
  updateSide(side, (currentSide) => {
    const previousHtmlText = toNormalizedAudioText(currentSide.html)
    const nextHtmlText = toNormalizedAudioText(html)
    const didTextChange = previousHtmlText !== nextHtmlText
    const shouldInvalidateReadyAudio =
      currentSide.audioText !== null && currentSide.audioText !== nextHtmlText
    const shouldCancelPendingAudio =
      currentSide.status === "creating" && didTextChange

    if (!shouldInvalidateReadyAudio && !shouldCancelPendingAudio) {
      return {
        ...currentSide,
        html,
      }
    }

    return {
      ...currentSide,
      html,
      assetId: null,
      fileUrl: null,
      audioText: null,
      isDirty: true,
      status: shouldInvalidateReadyAudio ? "stale" : "idle",
    }
  })
}

export function hydrateAudioSelectionDraftSide(
  side: VisibleCardSide,
  value: AudioSelectionDraftSideHydration,
) {
  updateSide(side, (currentSide) => ({
    ...currentSide,
    locale: value.locale,
    assetId: value.assetId,
    fileUrl: value.fileUrl,
    audioText:
      value.hasAudio === true || value.assetId != null || value.fileUrl != null
        ? toNormalizedAudioText(currentSide.html)
        : null,
    isDirty: false,
    status: value.fileUrl ? "ready" : "idle",
  }))
}

export function clearAudioSelectionDraftSide(side: VisibleCardSide) {
  updateSide(side, (currentSide) => ({
    ...currentSide,
    locale: null,
    assetId: null,
    fileUrl: null,
    audioText: null,
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
    audioText: null,
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
    audioText: toNormalizedAudioText(currentSide.html),
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
    audioText: null,
    isDirty: true,
    status: "error",
  }))
}

export function resetAudioSelectionDraft() {
  currentDraft = createEmptyDraft()
  emitChange()
}
