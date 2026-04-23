import { adminDb } from "@/db/instant/admin"
import type { CardContentSide } from "@/domain/card"
import {
  isSupportedTtsLocale,
  type SupportedTtsLocale,
} from "@/domain/card-audio"
import { getBearerToken, jsonError } from "@/server/api-utils"
import { TtsResolveError } from "@/server/tts/errors"
import {
  loadCardForTts,
  updateCardSetTtsLocale,
} from "@/server/tts/instant-tts-assets"
import { logTtsError, logTtsWarn } from "@/server/tts/log"

type SetTtsLocaleRequestBody = {
  cardId: string
  contentSide: CardContentSide
  locale: SupportedTtsLocale
}

function isCardContentSide(value: unknown): value is CardContentSide {
  return value === "sideA" || value === "sideB"
}

function isSetTtsLocaleRequestBody(
  value: unknown,
): value is SetTtsLocaleRequestBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "cardId" in value &&
    "contentSide" in value &&
    "locale" in value &&
    typeof value.cardId === "string" &&
    isCardContentSide(value.contentSide) &&
    isSupportedTtsLocale(value.locale)
  )
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request)

    if (!token) {
      logTtsWarn("Rejected TTS locale request without bearer token")
      return jsonError("Unauthorized", 401)
    }

    const authenticatedUser = await adminDb.auth.verifyToken(token)

    if (!authenticatedUser) {
      logTtsWarn("Rejected TTS locale request with invalid bearer token")
      return jsonError("Unauthorized", 401)
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      logTtsWarn("Rejected TTS locale request with invalid JSON body", {
        userId: authenticatedUser.id,
      })
      return jsonError("Request body must be valid JSON.", 400)
    }

    if (!isSetTtsLocaleRequestBody(body)) {
      logTtsWarn("Rejected TTS locale request with invalid payload shape", {
        userId: authenticatedUser.id,
      })
      return jsonError(
        "Request body must include cardId, contentSide, and locale.",
        400,
      )
    }

    const card = await loadCardForTts(authenticatedUser.id, body.cardId)

    if (!card?.cardSet) {
      throw new TtsResolveError("Card not found.", 404)
    }

    await updateCardSetTtsLocale(card.cardSet.id, body.contentSide, body.locale)

    return Response.json({
      contentSide: body.contentSide,
      locale: body.locale,
      status: "saved",
    })
  } catch (error) {
    if (error instanceof TtsResolveError) {
      logTtsError("TTS locale request failed", {
        status: error.status,
        error: error.message,
      })
      return jsonError(error.message, error.status)
    }

    if (error instanceof Error) {
      logTtsError("Unexpected TTS locale request error", {
        error: error.message,
      })
      return jsonError(error.message, 500)
    }

    logTtsError("Unknown TTS locale request error")
    return jsonError("TTS locale save failed.", 500)
  }
}
