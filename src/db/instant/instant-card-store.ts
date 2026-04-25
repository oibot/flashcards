import { id, lookup } from "@instantdb/react-native"

import { useAuthSession } from "@/auth/use-auth-session"
import type { CardStore, TagsQueryState } from "@/db/card-store"
import { db } from "@/db/instant/db"
import {
  normalizeError,
  toCard,
  toCardBackupCardSet,
  toStoredCardSet,
} from "@/db/instant/instant-utils"
import {
  type Card,
  type NewCardInput,
  normalizeTagTitle,
  parseTags,
  toCanonicalCardContent,
  type UpdateCardInput,
} from "@/domain/card"
import {
  type CardSetTtsPatch,
  toCanonicalCardTtsPatch,
} from "@/domain/card-audio"
import {
  CARD_BACKUP_APP,
  type CardBackupCard,
  type CardBackupCardSet,
  type CardBackupEnvelope,
} from "@/domain/card-backup"
import {
  createInitialSchedule,
  type ReviewGrade,
  scheduleCardReview,
} from "@/domain/review-scheduler"

async function requireCurrentUser() {
  const user = await db.getAuth()

  if (!user) {
    throw new Error("Must be signed in")
  }

  return user
}

function toOwnerTitle(userId: string, title: string) {
  return `${userId}:${normalizeTagTitle(title)}`
}

function toTagLookups(userId: string, tags: string[]) {
  return tags.map((tag) => lookup("ownerTitle", toOwnerTitle(userId, tag)))
}

function createEnsureTagTransactions(userId: string, tags: string[]) {
  return tags.map((tag) =>
    db.tx.tags[lookup("ownerTitle", toOwnerTitle(userId, tag))]
      .update({
        title: tag,
      })
      .link({ owner: userId }),
  )
}

function diffTags(previousTags: string[], nextTags: string[]) {
  const previousTagSet = new Set(previousTags)
  const nextTagSet = new Set(nextTags)

  return {
    tagsToLink: nextTags.filter((tag) => !previousTagSet.has(tag)),
    tagsToUnlink: previousTags.filter((tag) => !nextTagSet.has(tag)),
  }
}

function hasOwnProperty<K extends PropertyKey>(
  value: object,
  key: K,
): value is Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function buildCardSetTtsUpdateData(ttsPatch: CardSetTtsPatch) {
  return {
    ...(hasOwnProperty(ttsPatch, "sideATtsLocale")
      ? { sideATtsLocale: ttsPatch.sideATtsLocale ?? null }
      : {}),
    ...(hasOwnProperty(ttsPatch, "sideBTtsLocale")
      ? { sideBTtsLocale: ttsPatch.sideBTtsLocale ?? null }
      : {}),
  }
}

function createImportedCardSetTransaction(
  userId: string,
  cardSet: CardBackupCardSet,
  previousTags: string[],
) {
  const localeSelection = {
    sideATtsLocale: cardSet.sideATtsLocale ?? null,
    sideBTtsLocale: cardSet.sideBTtsLocale ?? null,
  }
  let cardSetTransaction = db.tx.cardSets[cardSet.id]
    .update({
      sideAHtml: cardSet.sideAHtml,
      sideBHtml: cardSet.sideBHtml,
      ...localeSelection,
      createdAt: cardSet.createdAt,
      updatedAt: cardSet.updatedAt,
    })
    .link({ owner: userId })

  const { tagsToLink, tagsToUnlink } = diffTags(previousTags, cardSet.tags)

  if (tagsToUnlink.length > 0) {
    cardSetTransaction = cardSetTransaction.unlink({
      tags: toTagLookups(userId, tagsToUnlink),
    })
  }

  if (tagsToLink.length > 0) {
    cardSetTransaction = cardSetTransaction.link({
      tags: toTagLookups(userId, tagsToLink),
    })
  }

  return cardSetTransaction
}

function createImportedCardTransaction(
  userId: string,
  cardSetId: string,
  card: CardBackupCard,
) {
  return db.tx.cards[card.id]
    .update({
      variant: card.variant,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      dueAt: card.dueAt,
      lastReviewedAt: card.lastReviewedAt,
      intervalDays: card.intervalDays,
      easeFactor: card.easeFactor,
      repetition: card.repetition,
      lapses: card.lapses,
      state: card.state,
    })
    .link({
      owner: userId,
      cardSet: cardSetId,
    })
}

export const createInstantCardStore = (): CardStore => {
  const useCardsQuery = () => {
    const { status, user } = useAuthSession()
    const query =
      user !== null
        ? {
            $users: {
              $: {
                where: {
                  id: user.id,
                },
              },
              cards: {
                cardSet: {
                  sideATtsAsset: {},
                  sideBTtsAsset: {},
                  tags: {},
                },
              },
            },
          }
        : null
    const { isLoading, error, data } = db.useQuery(query)
    const cards = data?.$users[0]?.cards?.map(toCard) ?? []

    return {
      cards,
      isLoading: status === "loading" || isLoading,
      error: normalizeError(error),
    }
  }

  const useDueCardsQuery = (now = Date.now()) => {
    const { status, user } = useAuthSession()
    const query =
      user !== null
        ? {
            cards: {
              $: {
                where: {
                  dueAt: { $lte: new Date(now) },
                },
                order: {
                  dueAt: "asc" as const,
                },
              },
              cardSet: {
                sideATtsAsset: {},
                sideBTtsAsset: {},
                tags: {},
              },
            },
          }
        : null
    const { isLoading, error, data } = db.useQuery(query)
    const cards = data?.cards?.map(toCard) ?? []

    return {
      cards,
      isLoading: status === "loading" || isLoading,
      error: normalizeError(error),
    }
  }

  const useTagsQuery = (): TagsQueryState => {
    const { status, user } = useAuthSession()
    const query =
      user !== null
        ? {
            $users: {
              $: {
                where: {
                  id: user.id,
                },
              },
              tags: {
                $: {
                  order: {
                    title: "asc" as const,
                  },
                },
              },
            },
          }
        : null
    const { isLoading, error, data } = db.useQuery(query)
    const tags = (data?.$users?.[0]?.tags ?? []).map((tag) => tag.title)

    return {
      tags,
      isLoading: status === "loading" || isLoading,
      error: normalizeError(error),
    }
  }

  const exportCards = async (): Promise<CardBackupEnvelope> => {
    const currentUser = await requireCurrentUser()
    const exportedAt = new Date().toISOString()
    const { data } = await db.queryOnce({
      $users: {
        $: {
          where: {
            id: currentUser.id,
          },
        },
        cardSets: {
          tags: {},
          cards: {},
        },
      },
    })
    const cardSets = (data.$users[0]?.cardSets ?? [])
      .map(toCardBackupCardSet)
      .sort(
        (left, right) =>
          left.createdAt - right.createdAt || left.id.localeCompare(right.id),
      )

    return {
      app: CARD_BACKUP_APP,
      exportedAt,
      cardSets,
    }
  }

  const importCards = async (backup: CardBackupEnvelope) => {
    const currentUser = await requireCurrentUser()

    if (backup.cardSets.length === 0) {
      return
    }

    const importedCardSets = backup.cardSets.map((cardSet) => ({
      ...cardSet,
      tags: parseTags(cardSet.tags),
    }))
    const importedCardSetIds = importedCardSets.map((cardSet) => cardSet.id)
    const importedTags = [
      ...new Set(importedCardSets.flatMap((cardSet) => cardSet.tags)),
    ]
    const createTagTransactions = createEnsureTagTransactions(
      currentUser.id,
      importedTags,
    )
    const existingCardSetsQuery = {
      $users: {
        $: {
          where: {
            id: currentUser.id,
          },
        },
        cardSets: {
          $: {
            where: {
              id: { $in: importedCardSetIds },
            },
          },
          tags: {},
          cards: {},
        },
      },
    }
    const existingCardSets = (
      (await db.queryOnce(existingCardSetsQuery)).data.$users[0]?.cardSets ?? []
    ).map(toStoredCardSet)
    const existingTagsByCardSetId = new Map(
      existingCardSets.map((cardSet) => [cardSet.id, cardSet.tags]),
    )
    const cardSetTransactions = importedCardSets.map((cardSet) =>
      createImportedCardSetTransaction(
        currentUser.id,
        cardSet,
        existingTagsByCardSetId.get(cardSet.id) ?? [],
      ),
    )
    const cardTransactions = importedCardSets.flatMap((cardSet) =>
      cardSet.cards.map((card) =>
        createImportedCardTransaction(currentUser.id, cardSet.id, card),
      ),
    )

    await db.transact([
      ...createTagTransactions,
      ...cardSetTransactions,
      ...cardTransactions,
    ])
  }

  const addCard = async (input: NewCardInput) => {
    const currentUser = await requireCurrentUser()
    const tags = parseTags(input.tags)
    const cardSetId = id()
    const now = Date.now()
    const ttsPatch = toCanonicalCardTtsPatch(input.tts ?? {}, "forward")
    const createTagTransactions = createEnsureTagTransactions(
      currentUser.id,
      tags,
    )

    let cardSetTransaction = db.tx.cardSets[cardSetId]
      .update({
        sideAHtml: input.frontHtml,
        sideBHtml: input.backHtml,
        ...buildCardSetTtsUpdateData(ttsPatch),
        createdAt: now,
        updatedAt: now,
      })
      .link({ owner: currentUser.id })

    if (typeof ttsPatch.sideATtsAssetId === "string") {
      cardSetTransaction = cardSetTransaction.link({
        sideATtsAsset: ttsPatch.sideATtsAssetId,
      })
    }

    if (typeof ttsPatch.sideBTtsAssetId === "string") {
      cardSetTransaction = cardSetTransaction.link({
        sideBTtsAsset: ttsPatch.sideBTtsAssetId,
      })
    }

    if (tags.length > 0) {
      cardSetTransaction = cardSetTransaction.link({
        tags: toTagLookups(currentUser.id, tags),
      })
    }

    const cardTransactions = input.variants.map((variant) =>
      db.tx.cards[id()]
        .update({
          variant,
          createdAt: now,
          updatedAt: now,
          ...createInitialSchedule(now),
        })
        .link({
          owner: currentUser.id,
          cardSet: cardSetId,
        }),
    )

    await db.transact([
      ...createTagTransactions,
      cardSetTransaction,
      ...cardTransactions,
    ])
  }

  const updateCard = async (input: UpdateCardInput) => {
    const currentUser = await requireCurrentUser()
    const query = {
      $users: {
        $: {
          where: {
            id: currentUser.id,
          },
        },
        cards: {
          $: {
            where: {
              id: input.id,
            },
          },
          cardSet: {
            sideATtsAsset: {},
            sideBTtsAsset: {},
            tags: {},
          },
        },
      },
    }
    const currentCardRecord = (await db.queryOnce(query)).data.$users[0]
      ?.cards?.[0]

    if (!currentCardRecord) {
      throw new Error("Card not found.")
    }

    if (!currentCardRecord.cardSet) {
      throw new Error("Card set not found.")
    }

    const currentCardSetRecord = currentCardRecord.cardSet
    const currentCard = toCard(currentCardRecord)
    const tags = parseTags(input.tags)
    const previousTags = parseTags(input.previousTags)
    const now = Date.now()
    const { sideAHtml, sideBHtml } = toCanonicalCardContent(
      {
        frontHtml: input.frontHtml,
        backHtml: input.backHtml,
      },
      currentCard.variant,
    )
    const ttsPatch = toCanonicalCardTtsPatch(
      input.tts ?? {},
      currentCard.variant,
    )
    const { tagsToLink, tagsToUnlink } = diffTags(previousTags, tags)

    let cardSetTransaction = db.tx.cardSets[currentCard.cardSetId].update({
      sideAHtml,
      sideBHtml,
      ...buildCardSetTtsUpdateData(ttsPatch),
      updatedAt: now,
    })

    if (hasOwnProperty(ttsPatch, "sideATtsAssetId")) {
      if (typeof ttsPatch.sideATtsAssetId === "string") {
        cardSetTransaction = cardSetTransaction.link({
          sideATtsAsset: ttsPatch.sideATtsAssetId,
        })
      } else if (currentCardSetRecord.sideATtsAsset?.id) {
        cardSetTransaction = cardSetTransaction.unlink({
          sideATtsAsset: currentCardSetRecord.sideATtsAsset.id,
        })
      }
    }

    if (hasOwnProperty(ttsPatch, "sideBTtsAssetId")) {
      if (typeof ttsPatch.sideBTtsAssetId === "string") {
        cardSetTransaction = cardSetTransaction.link({
          sideBTtsAsset: ttsPatch.sideBTtsAssetId,
        })
      } else if (currentCardSetRecord.sideBTtsAsset?.id) {
        cardSetTransaction = cardSetTransaction.unlink({
          sideBTtsAsset: currentCardSetRecord.sideBTtsAsset.id,
        })
      }
    }

    if (tagsToLink.length === 0 && tagsToUnlink.length === 0) {
      await db.transact(cardSetTransaction)
      return
    }

    const createTagTransactions = createEnsureTagTransactions(
      currentUser.id,
      tagsToLink,
    )

    if (tagsToUnlink.length > 0) {
      cardSetTransaction = cardSetTransaction.unlink({
        tags: toTagLookups(currentUser.id, tagsToUnlink),
      })
    }

    if (tagsToLink.length > 0) {
      cardSetTransaction = cardSetTransaction.link({
        tags: toTagLookups(currentUser.id, tagsToLink),
      })
    }

    await db.transact([...createTagTransactions, cardSetTransaction])
  }

  const reviewCard = async (
    card: Card,
    grade: ReviewGrade,
    reviewedAt = Date.now(),
  ) => {
    await db.transact(
      db.tx.cards[card.id].update({
        ...scheduleCardReview(card, grade, reviewedAt),
        updatedAt: reviewedAt,
      }),
    )
  }

  const removeCard = async (cardId: string) => {
    const currentUser = await requireCurrentUser()
    const query = {
      $users: {
        $: {
          where: {
            id: currentUser.id,
          },
        },
        cards: {
          $: {
            where: {
              id: cardId,
            },
          },
          cardSet: {},
        },
      },
    }
    const card = (await db.queryOnce(query)).data.$users[0]?.cards?.[0]
    const cardSetId = card?.cardSet?.id

    if (!cardSetId) {
      throw new Error("Card not found.")
    }

    await db.transact(db.tx.cardSets[cardSetId].delete())
  }

  return {
    useCardsQuery,
    useDueCardsQuery,
    useTagsQuery,
    exportCards,
    importCards,
    addCard,
    updateCard,
    reviewCard,
    removeCard,
  }
}
