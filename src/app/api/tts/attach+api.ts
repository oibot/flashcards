import type { CardSetTtsSelectionPatch } from "@/features/cards/audio/card-audio"
import { TtsResolveError } from "@/features/cards/audio/server/errors"
import {
  loadOwnedCardSetForTts,
  updateCardSetTtsSelection,
} from "@/features/cards/audio/server/instant-tts-assets"
import { logTtsWarn } from "@/features/cards/audio/server/log"
import { handleTtsRouteError } from "@/features/cards/audio/server/route-utils"
import { hasOwn } from "@/shared/lib/object"
import {
  readJsonBody,
  requireAuthenticatedUser,
} from "@/shared/server/api-utils"

type AttachTtsRequestBody = {
  cardSetId: string
  tts: CardSetTtsSelectionPatch
}

function isCardSetTtsSelectionPatch(
  value: unknown,
): value is CardSetTtsSelectionPatch {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const hasSideA = hasOwn(value, "sideATtsAssetId")
  const hasSideB = hasOwn(value, "sideBTtsAssetId")

  if (!hasSideA && !hasSideB) {
    return false
  }

  const sideAIsValid =
    !hasSideA ||
    value.sideATtsAssetId === null ||
    typeof value.sideATtsAssetId === "string"
  const sideBIsValid =
    !hasSideB ||
    value.sideBTtsAssetId === null ||
    typeof value.sideBTtsAssetId === "string"

  return sideAIsValid && sideBIsValid
}

function isAttachTtsRequestBody(value: unknown): value is AttachTtsRequestBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "cardSetId" in value &&
    typeof value.cardSetId === "string" &&
    "tts" in value &&
    isCardSetTtsSelectionPatch(value.tts)
  )
}

export async function POST(request: Request) {
  const authenticatedUser = await requireAuthenticatedUser(request, {
    logWarning: logTtsWarn,
    missingTokenLog: "Rejected TTS attach request without bearer token",
    invalidTokenLog: "Rejected TTS attach request with invalid bearer token",
  })

  if (authenticatedUser instanceof Response) {
    return authenticatedUser
  }

  const body = await readJsonBody(request, isAttachTtsRequestBody, {
    logWarning: logTtsWarn,
    invalidJsonLog: "Rejected TTS attach request with invalid JSON body",
    invalidBodyLog: "Rejected TTS attach request with invalid payload shape",
    invalidBodyMessage: "Request body must include cardSetId and tts.",
    context: { userId: authenticatedUser.id },
  })

  if (body instanceof Response) {
    return body
  }

  try {
    const cardSet = await loadOwnedCardSetForTts(
      authenticatedUser.id,
      body.cardSetId,
    )

    if (!cardSet) {
      throw new TtsResolveError("Card not found.", 404)
    }

    await updateCardSetTtsSelection(cardSet, body.tts)

    return Response.json({
      cardSetId: body.cardSetId,
      status: "saved",
    })
  } catch (error) {
    return handleTtsRouteError(error, {
      expectedMessage: "TTS attach request failed",
      unexpectedMessage: "Unexpected TTS attach request error",
      unknownMessage: "Unknown TTS attach request error",
      fallbackMessage: "TTS attach failed.",
    })
  }
}
