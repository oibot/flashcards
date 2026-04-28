import { logTtsWarn } from "@/features/cards/audio/server/log"
import { resolveTts } from "@/features/cards/audio/server/resolve-tts"
import { handleTtsRouteError } from "@/features/cards/audio/server/route-utils"
import type { VisibleCardSide } from "@/features/cards/model/card"
import {
  readJsonBody,
  requireAuthenticatedUser,
} from "@/shared/server/api-utils"

type ResolveTtsRequestBody = {
  cardId: string
  visibleSide: VisibleCardSide
}

function isVisibleCardSide(value: unknown): value is VisibleCardSide {
  return value === "front" || value === "back"
}

function isResolveTtsRequestBody(
  value: unknown,
): value is ResolveTtsRequestBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "cardId" in value &&
    "visibleSide" in value &&
    typeof value.cardId === "string" &&
    isVisibleCardSide(value.visibleSide)
  )
}

export async function POST(request: Request) {
  const authenticatedUser = await requireAuthenticatedUser(request, {
    logWarning: logTtsWarn,
    missingTokenLog: "Rejected TTS resolve request without bearer token",
    invalidTokenLog: "Rejected TTS resolve request with invalid bearer token",
  })

  if (authenticatedUser instanceof Response) {
    return authenticatedUser
  }

  const body = await readJsonBody(request, isResolveTtsRequestBody, {
    logWarning: logTtsWarn,
    invalidJsonLog: "Rejected TTS resolve request with invalid JSON body",
    invalidBodyLog: "Rejected TTS resolve request with invalid payload shape",
    invalidBodyMessage: "Request body must include cardId and visibleSide.",
    context: { userId: authenticatedUser.id },
  })

  if (body instanceof Response) {
    return body
  }

  try {
    return Response.json(
      await resolveTts({
        userId: authenticatedUser.id,
        cardId: body.cardId,
        visibleSide: body.visibleSide,
      }),
    )
  } catch (error) {
    return handleTtsRouteError(error, {
      expectedMessage: "TTS resolve request failed",
      unexpectedMessage: "Unexpected TTS resolve request error",
      unknownMessage: "Unknown TTS resolve request error",
      fallbackMessage: "TTS resolve failed.",
    })
  }
}
