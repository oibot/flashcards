export function normalizeError(error: unknown): Error | null {
  if (!error) {
    return null
  }

  return error instanceof Error ? error : new Error(String(error))
}
