export function normalizeError(error: unknown): Error | null {
  if (!error) {
    return null
  }

  return error instanceof Error ? error : new Error(String(error))
}

export function getErrorLogAttributes(error: unknown) {
  const normalizedError = normalizeError(error)

  if (!normalizedError) {
    return {}
  }

  return {
    error: normalizedError.message,
    error_type: normalizedError.name,
  }
}
