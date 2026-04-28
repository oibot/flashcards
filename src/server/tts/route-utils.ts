import { jsonError } from "@/server/api-utils"
import { TtsResolveError } from "@/server/tts/errors"
import { logTtsError } from "@/server/tts/log"

type HandleTtsRouteErrorOptions = {
  expectedMessage: string
  fallbackMessage: string
  unexpectedMessage: string
  unknownMessage: string
}

export function handleTtsRouteError(
  error: unknown,
  options: HandleTtsRouteErrorOptions,
) {
  if (error instanceof TtsResolveError) {
    logTtsError(options.expectedMessage, {
      status: error.status,
      error: error.message,
    })
    return jsonError(error.message, error.status)
  }

  if (error instanceof Error) {
    logTtsError(options.unexpectedMessage, {
      error: error.message,
    })
    return jsonError(error.message, 500)
  }

  logTtsError(options.unknownMessage)
  return jsonError(options.fallbackMessage, 500)
}
