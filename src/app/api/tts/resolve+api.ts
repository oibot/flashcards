import { adminDb } from "@/db/instant/admin"
import type { VisibleCardSide } from "@/domain/card"
import { TtsResolveError } from "@/server/tts/errors"
import { resolveTts } from "@/server/tts/resolve-tts"

type ResolveTtsRequestBody = {
  cardId: string
  visibleSide: VisibleCardSide
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")

  if (!authorization?.startsWith("Bearer ")) {
    return null
  }

  return authorization.slice("Bearer ".length).trim() || null
}

function isVisibleCardSide(value: unknown): value is VisibleCardSide {
  return value === "front" || value === "back"
}

function isResolveTtsRequestBody(
  value: unknown,
): value is ResolveTtsRequestBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "cardId" in value &&
    "visibleSide" in value &&
    typeof value.cardId === "string" &&
    isVisibleCardSide(value.visibleSide)
  )
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request)

    if (!token) {
      return jsonError("Unauthorized", 401)
    }

    const authenticatedUser = await adminDb.auth.verifyToken(token)

    if (!authenticatedUser) {
      return jsonError("Unauthorized", 401)
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return jsonError("Request body must be valid JSON.", 400)
    }

    if (!isResolveTtsRequestBody(body)) {
      return jsonError("Request body must include cardId and visibleSide.", 400)
    }

    return Response.json(
      await resolveTts({
        userId: authenticatedUser.id,
        cardId: body.cardId,
        visibleSide: body.visibleSide,
      }),
    )
  } catch (error) {
    if (error instanceof TtsResolveError) {
      return jsonError(error.message, error.status)
    }

    if (error instanceof Error) {
      return jsonError(error.message, 500)
    }

    return jsonError("TTS resolve failed.", 500)
  }
}
