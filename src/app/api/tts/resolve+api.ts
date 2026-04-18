import type { InstaQLEntity } from "@instantdb/react-native"

import { adminDb } from "@/db/instant/admin"
import type { AppSchema } from "@/db/instant/instant.schema"
import {
  isCardVariant,
  resolveCardContent,
  type VisibleCardSide,
} from "@/domain/card"
import {
  type CardContentSide,
  createTtsCacheKey,
  normalizeTtsSourceText,
  resolveCardContentSide,
  type TtsConfig,
} from "@/domain/card-audio"
import { extractPlainTextFromHtml } from "@/utils/html"

type ResolveTtsRequestBody = {
  cardId: string
  visibleSide: VisibleCardSide
}

type EmptyRelations = Record<never, never>
type RouteTtsAssetRecord = InstaQLEntity<
  AppSchema,
  "ttsAssets",
  { file: EmptyRelations }
>
type RouteCardRecord = InstaQLEntity<
  AppSchema,
  "cards",
  {
    cardSet: {
      sideATtsAsset: { file: EmptyRelations }
      sideBTtsAsset: { file: EmptyRelations }
    }
  }
>
type RouteCardSetRecord = NonNullable<RouteCardRecord["cardSet"]>

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

function getTtsConfig(): TtsConfig {
  return {
    provider: "elevenlabs",
    locale: process.env.ELEVENLABS_TTS_LOCALE ?? "en-US",
    voiceId: process.env.ELEVENLABS_VOICE_ID ?? "pending-config",
    modelId: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
    outputFormat: "mp3",
  }
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

function getSelectedTtsAsset(
  cardSet: RouteCardSetRecord,
  contentSide: CardContentSide,
): RouteTtsAssetRecord | null {
  if (contentSide === "sideA") {
    return cardSet.sideATtsAsset ?? null
  }

  return cardSet.sideBTtsAsset ?? null
}

function getReadyFileUrl(asset: RouteTtsAssetRecord | null | undefined) {
  if (!asset || asset.status !== "ready" || !asset.file) {
    return null
  }

  if (typeof asset.file.url !== "string") {
    return null
  }

  return asset.file.url
}

async function updateCardSetTtsReference(
  cardSetId: string,
  contentSide: CardContentSide,
  assetId: string,
) {
  if (contentSide === "sideA") {
    await adminDb.transact(
      adminDb.tx.cardSets[cardSetId].link({ sideATtsAsset: assetId }),
    )
    return
  }

  await adminDb.transact(
    adminDb.tx.cardSets[cardSetId].link({ sideBTtsAsset: assetId }),
  )
}

export async function POST(request: Request) {
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

  const data = await adminDb.query({
    $users: {
      $: {
        where: {
          id: authenticatedUser.id,
        },
      },
      cards: {
        $: {
          where: {
            id: body.cardId,
          },
        },
        cardSet: {
          sideATtsAsset: {
            file: {},
          },
          sideBTtsAsset: {
            file: {},
          },
        },
      },
    },
  })
  const card = data.$users[0]?.cards[0] as RouteCardRecord | undefined

  if (!card?.cardSet) {
    return jsonError("Card not found.", 404)
  }

  const cardSet = card.cardSet

  if (!isCardVariant(card.variant)) {
    return jsonError("Card variant is invalid.", 500)
  }

  if (
    typeof cardSet.sideAHtml !== "string" ||
    typeof cardSet.sideBHtml !== "string"
  ) {
    return jsonError("Card content is invalid.", 500)
  }

  const visibleContent = resolveCardContent(
    {
      sideAHtml: cardSet.sideAHtml,
      sideBHtml: cardSet.sideBHtml,
    },
    card.variant,
  )
  const contentSide = resolveCardContentSide(card.variant, body.visibleSide)
  const html =
    body.visibleSide === "front"
      ? visibleContent.frontHtml
      : visibleContent.backHtml
  const sourceText = normalizeTtsSourceText(extractPlainTextFromHtml(html))

  if (sourceText.length === 0) {
    return jsonError("Card side does not contain speakable text.", 422)
  }

  const ttsConfig = getTtsConfig()
  const cacheKey = await createTtsCacheKey(sourceText, ttsConfig)
  const selectedTtsAsset = getSelectedTtsAsset(cardSet, contentSide)

  if (selectedTtsAsset?.cacheKey === cacheKey) {
    const fileUrl = getReadyFileUrl(selectedTtsAsset)

    if (fileUrl) {
      return Response.json({
        status: "ready",
        assetId: selectedTtsAsset.id,
        fileUrl,
        contentSide,
        cacheHit: true,
      })
    }
  }

  const sharedAssetData = await adminDb.query({
    ttsAssets: {
      $: {
        where: {
          cacheKey,
        },
      },
      file: {},
    },
  })
  const sharedAsset = sharedAssetData.ttsAssets[0] as
    | RouteTtsAssetRecord
    | undefined
  const sharedAssetFileUrl = getReadyFileUrl(sharedAsset)

  if (sharedAsset && sharedAssetFileUrl) {
    await updateCardSetTtsReference(cardSet.id, contentSide, sharedAsset.id)

    return Response.json({
      status: "ready",
      assetId: sharedAsset.id,
      fileUrl: sharedAssetFileUrl,
      contentSide,
      cacheHit: true,
    })
  }

  return Response.json({
    status: "missing",
    contentSide,
    cacheKey,
  })
}
