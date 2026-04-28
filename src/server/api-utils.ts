import { InstantAPIError } from "@instantdb/admin"

import { adminDb } from "@/db/instant/admin"

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")

  if (!authorization?.startsWith("Bearer ")) {
    return null
  }

  return authorization.slice("Bearer ".length).trim() || null
}

type LogContext = Record<string, unknown>
type WarningLogger = (message: string, context?: LogContext) => void

type RequireAuthenticatedUserOptions = {
  invalidTokenLog: string
  logWarning: WarningLogger
  missingTokenLog: string
}

type ReadJsonBodyOptions = {
  context?: LogContext
  invalidBodyLog: string
  invalidBodyMessage: string
  invalidJsonLog: string
  logWarning: WarningLogger
}

function isAuthenticationFailure(error: unknown) {
  return (
    error instanceof InstantAPIError && [400, 401, 403].includes(error.status)
  )
}

export type AuthenticatedUser = Awaited<
  ReturnType<typeof adminDb.auth.verifyToken>
>

export async function requireAuthenticatedUser(
  request: Request,
  options: RequireAuthenticatedUserOptions,
): Promise<AuthenticatedUser | Response> {
  const token = getBearerToken(request)

  if (!token) {
    options.logWarning(options.missingTokenLog)
    return jsonError("Unauthorized", 401)
  }

  try {
    const authenticatedUser = await adminDb.auth.verifyToken(token)

    if (!authenticatedUser) {
      options.logWarning(options.invalidTokenLog)
      return jsonError("Unauthorized", 401)
    }

    return authenticatedUser
  } catch (error) {
    if (isAuthenticationFailure(error)) {
      options.logWarning(options.invalidTokenLog)
      return jsonError("Unauthorized", 401)
    }

    throw error
  }
}

export async function readJsonBody<T>(
  request: Request,
  isBody: (value: unknown) => value is T,
  options: ReadJsonBodyOptions,
): Promise<Response | T> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    options.logWarning(options.invalidJsonLog, options.context)
    return jsonError("Request body must be valid JSON.", 400)
  }

  if (!isBody(body)) {
    options.logWarning(options.invalidBodyLog, options.context)
    return jsonError(options.invalidBodyMessage, 400)
  }

  return body
}
