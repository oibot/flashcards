type TtsLogContext = Record<string, unknown>

function serializeContext(context: TtsLogContext) {
  return Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== undefined),
  )
}

function log(
  level: "info" | "warn" | "error",
  message: string,
  context: TtsLogContext,
) {
  console[level](`[tts] ${message}`, serializeContext(context))
}

export function logTtsInfo(message: string, context: TtsLogContext = {}) {
  log("info", message, context)
}

export function logTtsWarn(message: string, context: TtsLogContext = {}) {
  log("warn", message, context)
}

export function logTtsError(message: string, context: TtsLogContext = {}) {
  log("error", message, context)
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
