type ResponseStatus = Pick<Response, "status">

type TtsErrorResponse = {
  error: string
}

function isTtsErrorResponse(value: unknown): value is TtsErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  )
}

export function formatTtsHttpError(
  response: ResponseStatus,
  payload: unknown,
  fallbackMessage: string,
) {
  const message = isTtsErrorResponse(payload) ? payload.error : fallbackMessage

  return `HTTP ${response.status}: ${message}`
}

export function formatUnexpectedTtsResponse(
  response: ResponseStatus,
  message: string,
) {
  return `HTTP ${response.status}: ${message}`
}

export function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message
    ? error.message
    : fallbackMessage
}
