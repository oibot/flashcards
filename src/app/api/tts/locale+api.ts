import {
  isSupportedTtsLocale,
  type SupportedTtsLocale,
} from "@/features/cards/audio/model/card-audio"
import { TtsResolveError } from "@/features/cards/audio/server/errors"
import {
  loadCardForTts,
  updateCardSetTtsLocale,
} from "@/features/cards/audio/server/instant-tts-assets"
import { logTtsWarn } from "@/features/cards/audio/server/log"
import { handleTtsRouteError } from "@/features/cards/audio/server/route-utils"
import type { CardContentSide } from "@/features/cards/model/card"
import {
  readJsonBody,
  requireAuthenticatedUser,
} from "@/shared/server/api-utils"

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
