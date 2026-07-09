import {
  formatTtsHttpError,
  formatUnexpectedTtsResponse,
} from "@/features/cards/audio/lib/tts-client-errors"
import type {
  CardSetTtsSelectionPatch,
  SupportedTtsLocale,
} from "@/features/cards/audio/model/card-audio"
import type { VisibleCardSide } from "@/features/cards/model/card"

export type TtsClientMessages = {
  requestFailed: string
  unexpectedResponse: string
}

export type TtsReadyAudioResponse = {
  status: "ready"
  assetId: string
  fileUrl: string
}

type ResolveCardAudioInput = {
  refreshToken: string
  cardId: string
  visibleSide: VisibleCardSide
}

type ResolveDraftAudioInput = {
  refreshToken: string
  html: string
  locale: SupportedTtsLocale
}

type AttachCardAudioInput = {
  refreshToken: string
  cardSetId: string
  tts: CardSetTtsSelectionPatch
}

function createJsonHeaders(refreshToken: string) {
  return {
    Authorization: `Bearer ${refreshToken}`,
    "Content-Type": "application/json",
  }
}

async function readJsonPayload(response: Response): Promise<unknown> {
  return response.json().catch(() => null)
}

function isTtsReadyAudioResponse(
  value: unknown,
): value is TtsReadyAudioResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    value.status === "ready" &&
    "assetId" in value &&
    typeof value.assetId === "string" &&
    "fileUrl" in value &&
    typeof value.fileUrl === "string"
  )
}

async function readReadyAudioResponse(
  response: Response,
  messages: TtsClientMessages,
): Promise<TtsReadyAudioResponse> {
  const payload = await readJsonPayload(response)

  if (!response.ok) {
    throw new Error(
      formatTtsHttpError(response, payload, messages.requestFailed),
    )
  }

  if (!isTtsReadyAudioResponse(payload)) {
    throw new Error(
      formatUnexpectedTtsResponse(response, messages.unexpectedResponse),
    )
  }

  return payload
}

export async function resolveDraftAudio(
  input: ResolveDraftAudioInput,
  messages: TtsClientMessages,
): Promise<TtsReadyAudioResponse> {
  const response = await fetch("/api/tts/draft", {
    method: "POST",
    headers: createJsonHeaders(input.refreshToken),
    body: JSON.stringify({
      html: input.html,
      locale: input.locale,
    }),
  })

  return readReadyAudioResponse(response, messages)
}

export async function resolveCardAudio(
  input: ResolveCardAudioInput,
  messages: TtsClientMessages,
): Promise<TtsReadyAudioResponse> {
  const response = await fetch("/api/tts/resolve", {
    method: "POST",
    headers: createJsonHeaders(input.refreshToken),
    body: JSON.stringify({
      cardId: input.cardId,
      visibleSide: input.visibleSide,
    }),
  })

  return readReadyAudioResponse(response, messages)
}

export async function attachCardAudio(
  input: AttachCardAudioInput,
  messages: TtsClientMessages,
): Promise<void> {
  const response = await fetch("/api/tts/attach", {
    method: "POST",
    headers: createJsonHeaders(input.refreshToken),
    body: JSON.stringify({
      cardSetId: input.cardSetId,
      tts: input.tts,
    }),
  })
  const payload = await readJsonPayload(response)

  if (!response.ok) {
    throw new Error(
      formatTtsHttpError(response, payload, messages.requestFailed),
    )
  }
}
