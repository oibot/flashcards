import * as Sentry from "@sentry/node"

import { SENTRY_DSN } from "@/shared/lib/sentry"

Sentry.init({
  dsn: SENTRY_DSN,
  enableLogs: true,
})

type TtsLogContext = Record<string, unknown>

function serializeContext(context: TtsLogContext) {
  return {
    ...Object.fromEntries(
      Object.entries(context).filter(([, value]) => value !== undefined),
    ),
    feature: "tts",
  }
}

export function logTtsInfo(message: string, context: TtsLogContext = {}) {
  Sentry.logger.info(message, serializeContext(context))
}

export function logTtsWarn(message: string, context: TtsLogContext = {}) {
  Sentry.logger.warn(message, serializeContext(context))
}

export function logTtsError(message: string, context: TtsLogContext = {}) {
  Sentry.logger.error(message, serializeContext(context))
}

export function summarizeCacheKey(cacheKey: string) {
  return cacheKey.slice(0, 12)
}

export function summarizeText(text: string, maxLength = 48) {
  const normalizedText = text.replace(/\s+/g, " ").trim()

  if (normalizedText.length <= maxLength) {
    return normalizedText
  }

  return `${normalizedText.slice(0, maxLength)}…`
}
