import { adminDb } from "@/db/instant/admin"
import {
  isSupportedTtsLocale,
  type SupportedTtsLocale,
} from "@/domain/card-audio"
import { getBearerToken, jsonError } from "@/server/api-utils"
import { TtsResolveError } from "@/server/tts/errors"
import { logTtsError, logTtsWarn } from "@/server/tts/log"
import { resolveDraftTts } from "@/server/tts/resolve-draft-tts"

type DraftTtsRequestBody = {
  html: string
  locale: SupportedTtsLocale
}

function isDraftTtsRequestBody(value: unknown): value is DraftTtsRequestBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "html" in value &&
    typeof value.html === "string" &&
    "locale" in value &&
    isSupportedTtsLocale(value.locale)
  )
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request)

    if (!token) {
      logTtsWarn("Rejected draft TTS request without bearer token")
      return jsonError("Unauthorized", 401)
    }

    const authenticatedUser = await adminDb.auth.verifyToken(token)

    if (!authenticatedUser) {
      logTtsWarn("Rejected draft TTS request with invalid bearer token")
      return jsonError("Unauthorized", 401)
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      logTtsWarn("Rejected draft TTS request with invalid JSON body", {
        userId: authenticatedUser.id,
      })
      return jsonError("Request body must be valid JSON.", 400)
    }

    if (!isDraftTtsRequestBody(body)) {
      logTtsWarn("Rejected draft TTS request with invalid payload shape", {
        userId: authenticatedUser.id,
      })
      return jsonError("Request body must include html and locale.", 400)
    }

    return Response.json(
      await resolveDraftTts({
        userId: authenticatedUser.id,
        html: body.html,
        locale: body.locale,
      }),
    )
  } catch (error) {
    if (error instanceof TtsResolveError) {
      logTtsError("Draft TTS request failed", {
        status: error.status,
        error: error.message,
      })
      return jsonError(error.message, error.status)
    }

    if (error instanceof Error) {
      logTtsError("Unexpected draft TTS request error", {
        error: error.message,
      })
      return jsonError(error.message, 500)
    }

    logTtsError("Unknown draft TTS request error")
    return jsonError("TTS resolve failed.", 500)
  }
}
