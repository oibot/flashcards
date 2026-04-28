import type { CardContentSide } from "@/domain/card"
import {
  isSupportedTtsLocale,
  type SupportedTtsLocale,
} from "@/domain/card-audio"
import { readJsonBody, requireAuthenticatedUser } from "@/server/api-utils"
import { TtsResolveError } from "@/server/tts/errors"
import {
  loadCardForTts,
  updateCardSetTtsLocale,
} from "@/server/tts/instant-tts-assets"
import { logTtsWarn } from "@/server/tts/log"
import { handleTtsRouteError } from "@/server/tts/route-utils"

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
  const authenticatedUser = await requireAuthenticatedUser(request, {
    logWarning: logTtsWarn,
    missingTokenLog: "Rejected TTS locale request without bearer token",
    invalidTokenLog: "Rejected TTS locale request with invalid bearer token",
  })

  if (authenticatedUser instanceof Response) {
    return authenticatedUser
  }

  const body = await readJsonBody(request, isSetTtsLocaleRequestBody, {
    logWarning: logTtsWarn,
    invalidJsonLog: "Rejected TTS locale request with invalid JSON body",
    invalidBodyLog: "Rejected TTS locale request with invalid payload shape",
    invalidBodyMessage:
      "Request body must include cardId, contentSide, and locale.",
    context: { userId: authenticatedUser.id },
  })

  if (body instanceof Response) {
    return body
  }

  try {
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
    return handleTtsRouteError(error, {
      expectedMessage: "TTS locale request failed",
      unexpectedMessage: "Unexpected TTS locale request error",
      unknownMessage: "Unknown TTS locale request error",
      fallbackMessage: "TTS locale save failed.",
    })
  }
}
