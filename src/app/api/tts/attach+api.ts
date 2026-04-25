import { adminDb } from "@/db/instant/admin"
import type { CardSetTtsSelectionPatch } from "@/domain/card-audio"
import { getBearerToken, jsonError } from "@/server/api-utils"
import { TtsResolveError } from "@/server/tts/errors"
import {
  loadOwnedCardSetForTts,
  updateCardSetTtsSelection,
} from "@/server/tts/instant-tts-assets"
import { logTtsError, logTtsWarn } from "@/server/tts/log"
import { hasOwn } from "@/utils/object"

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
  try {
    const token = getBearerToken(request)

    if (!token) {
      logTtsWarn("Rejected TTS attach request without bearer token")
      return jsonError("Unauthorized", 401)
    }

    const authenticatedUser = await adminDb.auth.verifyToken(token)

    if (!authenticatedUser) {
      logTtsWarn("Rejected TTS attach request with invalid bearer token")
      return jsonError("Unauthorized", 401)
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      logTtsWarn("Rejected TTS attach request with invalid JSON body", {
        userId: authenticatedUser.id,
      })
      return jsonError("Request body must be valid JSON.", 400)
    }

    if (!isAttachTtsRequestBody(body)) {
      logTtsWarn("Rejected TTS attach request with invalid payload shape", {
        userId: authenticatedUser.id,
      })
      return jsonError("Request body must include cardSetId and tts.", 400)
    }

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
    if (error instanceof TtsResolveError) {
      logTtsError("TTS attach request failed", {
        status: error.status,
        error: error.message,
      })
      return jsonError(error.message, error.status)
    }

    if (error instanceof Error) {
      logTtsError("Unexpected TTS attach request error", {
        error: error.message,
      })
      return jsonError(error.message, 500)
    }

    logTtsError("Unknown TTS attach request error")
    return jsonError("TTS attach failed.", 500)
  }
}
