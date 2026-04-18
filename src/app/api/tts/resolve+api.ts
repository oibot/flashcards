import { adminDb } from "@/db/instant/admin"
import {
  isCardVariant,
  resolveCardContent,
  type VisibleCardSide,
} from "@/domain/card"
import { resolveCardContentSide } from "@/domain/card-audio"

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
  const token = getBearerToken(request)

  if (!token) {
    return jsonError("Unauthorized", 401)
  }

  if (!(await adminDb.auth.verifyToken(token))) {
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

  const userDb = adminDb.asUser({ token })
  const data = await userDb.query({
    cards: {
      $: {
        where: {
          id: body.cardId,
        },
      },
      cardSet: {},
    },
  })
  const card = data.cards[0]

  if (!card?.cardSet) {
    return jsonError("Card not found.", 404)
  }

  if (!isCardVariant(card.variant)) {
    return jsonError("Card variant is invalid.", 500)
  }

  if (
    typeof card.cardSet.sideAHtml !== "string" ||
    typeof card.cardSet.sideBHtml !== "string"
  ) {
    return jsonError("Card content is invalid.", 500)
  }

  const visibleContent = resolveCardContent(
    {
      sideAHtml: card.cardSet.sideAHtml,
      sideBHtml: card.cardSet.sideBHtml,
    },
    card.variant,
  )
  const contentSide = resolveCardContentSide(card.variant, body.visibleSide)
  const html =
    body.visibleSide === "front"
      ? visibleContent.frontHtml
      : visibleContent.backHtml

  return Response.json({
    status: "authenticated",
    cardId: card.id,
    cardSetId: card.cardSet.id,
    visibleSide: body.visibleSide,
    contentSide,
    html,
  })
}
