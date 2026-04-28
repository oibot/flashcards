import { id } from "@instantdb/admin"
import type { InstaQLEntity } from "@instantdb/react-native"

import type {
  CardContentSide,
  CardSetTtsSelectionPatch,
  SupportedTtsLocale,
  TtsConfig,
} from "@/features/cards/audio/card-audio"
import { adminDb } from "@/features/cards/data/instant/admin"
import type { AppSchema } from "@/features/cards/data/instant/instant.schema"
import { hasOwn } from "@/shared/lib/object"

type EmptyRelations = Record<never, never>

export type TtsAssetRecord = InstaQLEntity<
  AppSchema,
  "ttsAssets",
  { file: EmptyRelations }
>

export type CardRecord = InstaQLEntity<
  AppSchema,
  "cards",
  {
    cardSet: {
      sideATtsAsset: { file: EmptyRelations }
      sideBTtsAsset: { file: EmptyRelations }
    }
  }
>

export type CardSetRecord = NonNullable<CardRecord["cardSet"]>
export type OwnedCardSetRecord = InstaQLEntity<
  AppSchema,
  "cardSets",
  {
    sideATtsAsset: EmptyRelations
    sideBTtsAsset: EmptyRelations
  }
>

export function getSelectedTtsAsset(
  cardSet: CardSetRecord,
  contentSide: CardContentSide,
): TtsAssetRecord | null {
  if (contentSide === "sideA") {
    return cardSet.sideATtsAsset ?? null
  }

  return cardSet.sideBTtsAsset ?? null
}

export function getReadyFileUrl(asset: TtsAssetRecord | null | undefined) {
  if (!asset || asset.status !== "ready" || !asset.file) {
    return null
  }

  if (typeof asset.file.url !== "string") {
    return null
  }

  return asset.file.url
}

export async function loadCardForTts(userId: string, cardId: string) {
  const data = await adminDb.query({
    $users: {
      $: {
        where: {
          id: userId,
        },
      },
      cards: {
        $: {
          where: {
            id: cardId,
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

  return data.$users[0]?.cards[0] as CardRecord | undefined
}

export async function updateCardSetTtsReference(
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

export async function loadOwnedCardSetForTts(
  userId: string,
  cardSetId: string,
) {
  const data = await adminDb.query({
    $users: {
      $: {
        where: {
          id: userId,
        },
      },
      cardSets: {
        $: {
          where: {
            id: cardSetId,
          },
        },
        sideATtsAsset: {},
        sideBTtsAsset: {},
      },
    },
  })

  return data.$users[0]?.cardSets[0] as OwnedCardSetRecord | undefined
}

export async function updateCardSetTtsSelection(
  cardSet: OwnedCardSetRecord,
  selectionPatch: CardSetTtsSelectionPatch,
) {
  const transactions = []

  if (hasOwn(selectionPatch, "sideATtsAssetId")) {
    const currentSideAAssetId = cardSet.sideATtsAsset?.id

    if (
      currentSideAAssetId &&
      currentSideAAssetId !== selectionPatch.sideATtsAssetId
    ) {
      transactions.push(
        adminDb.tx.cardSets[cardSet.id].unlink({
          sideATtsAsset: currentSideAAssetId,
        }),
      )
    }

    if (
      selectionPatch.sideATtsAssetId &&
      selectionPatch.sideATtsAssetId !== currentSideAAssetId
    ) {
      transactions.push(
        adminDb.tx.cardSets[cardSet.id].link({
          sideATtsAsset: selectionPatch.sideATtsAssetId,
        }),
      )
    }
  }

  if (hasOwn(selectionPatch, "sideBTtsAssetId")) {
    const currentSideBAssetId = cardSet.sideBTtsAsset?.id

    if (
      currentSideBAssetId &&
      currentSideBAssetId !== selectionPatch.sideBTtsAssetId
    ) {
      transactions.push(
        adminDb.tx.cardSets[cardSet.id].unlink({
          sideBTtsAsset: currentSideBAssetId,
        }),
      )
    }

    if (
      selectionPatch.sideBTtsAssetId &&
      selectionPatch.sideBTtsAssetId !== currentSideBAssetId
    ) {
      transactions.push(
        adminDb.tx.cardSets[cardSet.id].link({
          sideBTtsAsset: selectionPatch.sideBTtsAssetId,
        }),
      )
    }
  }

  if (transactions.length === 0) {
    return
  }

  await adminDb.transact(transactions)
}

export async function updateCardSetTtsLocale(
  cardSetId: string,
  contentSide: CardContentSide,
  locale: SupportedTtsLocale,
) {
  if (contentSide === "sideA") {
    await adminDb.transact(
      adminDb.tx.cardSets[cardSetId].update({ sideATtsLocale: locale }),
    )
    return
  }

  await adminDb.transact(
    adminDb.tx.cardSets[cardSetId].update({ sideBTtsLocale: locale }),
  )
}

export async function querySharedTtsAsset(cacheKey: string) {
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

  return sharedAssetData.ttsAssets[0] as TtsAssetRecord | undefined
}

export async function uploadGeneratedAudio(
  cacheKey: string,
  audioBytes: Uint8Array,
  contentType: string,
) {
  return adminDb.storage.uploadFile(`tts/${cacheKey}.mp3`, audioBytes, {
    contentType,
  })
}

type PersistGeneratedTtsAssetInput = {
  existingAsset?: TtsAssetRecord
  cacheKey: string
  sourceText: string
  normalizedText: string
  config: TtsConfig
  fileId: string
}

export async function persistGeneratedTtsAsset({
  existingAsset,
  cacheKey,
  sourceText,
  normalizedText,
  config,
  fileId,
}: PersistGeneratedTtsAssetInput) {
  const assetId = existingAsset?.id ?? id()
  const now = new Date()

  await adminDb.transact(
    adminDb.tx.ttsAssets[assetId]
      .update({
        cacheKey,
        sourceText,
        normalizedText,
        locale: config.locale,
        provider: config.provider,
        voiceId: config.voiceId,
        modelId: config.modelId,
        outputFormat: config.outputFormat,
        status: "ready",
        updatedAt: now,
        ...(existingAsset ? {} : { createdAt: now }),
      })
      .link({ file: fileId }),
  )

  return assetId
}
