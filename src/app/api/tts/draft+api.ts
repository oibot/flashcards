import {
  isSupportedTtsLocale,
  type SupportedTtsLocale,
} from "@/features/cards/audio/model/card-audio"
import { logTtsWarn } from "@/features/cards/audio/server/log"
import { resolveDraftTts } from "@/features/cards/audio/server/resolve-draft-tts"
import { handleTtsRouteError } from "@/features/cards/audio/server/route-utils"
import {
  readJsonBody,
  requireAuthenticatedUser,
} from "@/shared/server/api-utils"

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
  const authenticatedUser = await requireAuthenticatedUser(request, {
    logWarning: logTtsWarn,
    missingTokenLog: "Rejected draft TTS request without bearer token",
    invalidTokenLog: "Rejected draft TTS request with invalid bearer token",
  })

  if (authenticatedUser instanceof Response) {
    return authenticatedUser
  }

  const body = await readJsonBody(request, isDraftTtsRequestBody, {
    logWarning: logTtsWarn,
    invalidJsonLog: "Rejected draft TTS request with invalid JSON body",
    invalidBodyLog: "Rejected draft TTS request with invalid payload shape",
    invalidBodyMessage: "Request body must include html and locale.",
    context: { userId: authenticatedUser.id },
  })

  if (body instanceof Response) {
    return body
  }

  try {
    return Response.json(
      await resolveDraftTts({
        userId: authenticatedUser.id,
        html: body.html,
        locale: body.locale,
      }),
    )
  } catch (error) {
    return handleTtsRouteError(error, {
      expectedMessage: "Draft TTS request failed",
      unexpectedMessage: "Unexpected draft TTS request error",
      unknownMessage: "Unknown draft TTS request error",
      fallbackMessage: "TTS resolve failed.",
    })
  }
}
