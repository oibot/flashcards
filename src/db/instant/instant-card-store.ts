import { id, lookup } from "@instantdb/react-native"

import { useAuthSession } from "@/auth/use-auth-session"
import type { CardStore, TagsQueryState } from "@/db/card-store"
import { db } from "@/db/instant/db"
import { normalizeError, toCard } from "@/db/instant/instant-utils"
import {
  type Card,
  type NewCardInput,
  normalizeTagTitle,
  parseTags,
  type UpdateCardInput,
} from "@/domain/card"
import {
  CARD_BACKUP_APP,
  CARD_BACKUP_FORMAT_VERSION,
  type CardBackupEnvelope,
  type CardSetBackupEnvelope,
  createCardSetBackupFromLegacyCards,
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
        ownerTitle: toOwnerTitle(userId, tag),
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

function createImportedCardTransaction(
  userId: string,
  card: Card,
  previousTags: string[],
) {
  let cardTransaction = db.tx.cards[card.id]
    .update({
      frontHtml: card.frontHtml,
      backHtml: card.backHtml,
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
    .link({ owner: userId })

  const { tagsToLink, tagsToUnlink } = diffTags(previousTags, card.tags)

  if (tagsToUnlink.length > 0) {
    cardTransaction = cardTransaction.unlink({
      tags: toTagLookups(userId, tagsToUnlink),
    })
  }

  if (tagsToLink.length > 0) {
    cardTransaction = cardTransaction.link({
      tags: toTagLookups(userId, tagsToLink),
    })
  }

  return cardTransaction
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
                tags: {},
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
              tags: {},
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
    const { data } = await db.queryOnce({
      $users: {
        $: {
          where: {
            id: currentUser.id,
          },
        },
        cards: {
          tags: {},
        },
      },
    })
    const cards = (data.$users[0]?.cards ?? [])
      .map(toCard)
      .sort(
        (left, right) =>
          left.createdAt - right.createdAt || left.id.localeCompare(right.id),
      )

    return {
      app: CARD_BACKUP_APP,
      formatVersion: CARD_BACKUP_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      cards,
    }
  }

  const exportLegacyCards = async (): Promise<CardSetBackupEnvelope> => {
    const backup = await exportCards()

    return createCardSetBackupFromLegacyCards(backup.cards, backup.exportedAt)
  }

  const importCards = async (backup: CardBackupEnvelope) => {
    const currentUser = await requireCurrentUser()

    if (backup.cards.length === 0) {
      return
    }

    const importedCards = backup.cards.map((card) => ({
      ...card,
      tags: parseTags(card.tags),
    }))
    const importedCardIds = importedCards.map((card) => card.id)
    const importedTags = [
      ...new Set(importedCards.flatMap((card) => card.tags)),
    ]
    const createTagTransactions = createEnsureTagTransactions(
      currentUser.id,
      importedTags,
    )
    const existingCardsQuery = {
      $users: {
        $: {
          where: {
            id: currentUser.id,
          },
        },
        cards: {
          $: {
            where: {
              id: { $in: importedCardIds },
            },
          },
          tags: {},
        },
      },
    }
    const existingCards = (
      (await db.queryOnce(existingCardsQuery)).data.$users[0]?.cards ?? []
    ).map(toCard)
    const existingTagsByCardId = new Map(
      existingCards.map((card) => [card.id, card.tags]),
    )
    const cardTransactions = importedCards.map((card) =>
      createImportedCardTransaction(
        currentUser.id,
        card,
        existingTagsByCardId.get(card.id) ?? [],
      ),
    )

    await db.transact([...createTagTransactions, ...cardTransactions])
  }

  const addCard = async (input: NewCardInput) => {
    const currentUser = await requireCurrentUser()
    const tags = parseTags(input.tags)
    const cardId = id()
    const now = Date.now()
    const createTagTransactions = createEnsureTagTransactions(
      currentUser.id,
      tags,
    )

    const cardTransaction = db.tx.cards[cardId]
      .update({
        frontHtml: input.frontHtml,
        backHtml: input.backHtml,
        createdAt: now,
        updatedAt: now,
        ...createInitialSchedule(now),
      })
      .link({ owner: currentUser.id })

    await db.transact([
      ...createTagTransactions,
      tags.length > 0
        ? cardTransaction.link({ tags: toTagLookups(currentUser.id, tags) })
        : cardTransaction,
    ])
  }

  const updateCard = async (input: UpdateCardInput) => {
    const tags = parseTags(input.tags)
    const previousTags = parseTags(input.previousTags)
    const now = Date.now()
    const { tagsToLink, tagsToUnlink } = diffTags(previousTags, tags)

    let cardTransaction = db.tx.cards[input.id].update({
      frontHtml: input.frontHtml,
      backHtml: input.backHtml,
      updatedAt: now,
    })

    if (tagsToLink.length === 0 && tagsToUnlink.length === 0) {
      await db.transact(cardTransaction)
      return
    }

    const currentUser = await requireCurrentUser()
    const createTagTransactions = createEnsureTagTransactions(
      currentUser.id,
      tagsToLink,
    )

    if (tagsToUnlink.length > 0) {
      cardTransaction = cardTransaction.unlink({
        tags: toTagLookups(currentUser.id, tagsToUnlink),
      })
    }

    if (tagsToLink.length > 0) {
      cardTransaction = cardTransaction.link({
        tags: toTagLookups(currentUser.id, tagsToLink),
      })
    }

    await db.transact([...createTagTransactions, cardTransaction])
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
    await db.transact(db.tx.cards[cardId].delete())
  }

  return {
    useCardsQuery,
    useDueCardsQuery,
    useTagsQuery,
    exportCards,
    exportLegacyCards,
    importCards,
    addCard,
    updateCard,
    reviewCard,
    removeCard,
  }
}
