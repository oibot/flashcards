import { id } from "@instantdb/react-native"

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

function areTagsEqual(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((tag, index) => tag === right[index])
  )
}

async function resolveTagMutation(
  userId: string,
  tags: string[],
  linkedTags: string[] = [],
) {
  const relevantTags = [...new Set([...tags, ...linkedTags])]
  const existingTagsQuery = {
    $users: {
      $: {
        where: {
          id: userId,
        },
      },
      tags: {
        $: {
          where: {
            title: { $in: relevantTags },
          },
        },
      },
    },
  }
  const existingTags =
    relevantTags.length > 0
      ? ((await db.queryOnce(existingTagsQuery)).data.$users[0]?.tags ?? [])
      : []

  const existingTagIdByTitle = new Map(
    existingTags.map((tag) => [tag.title, tag.id]),
  )
  const missingTags = tags.filter((tag) => !existingTagIdByTitle.has(tag))
  const newTagIdByTitle = new Map(missingTags.map((tag) => [tag, id()]))
  const tagIds = tags.flatMap((tag) => {
    const tagId = existingTagIdByTitle.get(tag) ?? newTagIdByTitle.get(tag)
    return tagId ? [tagId] : []
  })

  return {
    createTagTransactions: missingTags.map((tag) =>
      db.tx.tags[newTagIdByTitle.get(tag)!]
        .create({
          ownerTitle: toOwnerTitle(userId, tag),
          title: tag,
        })
        .link({ owner: userId }),
    ),
    linkedTagIds: linkedTags.flatMap((tag) => {
      const tagId = existingTagIdByTitle.get(tag)
      return tagId ? [tagId] : []
    }),
    tagIds,
  }
}

function createImportedCardTransaction(
  userId: string,
  card: Card,
  existingTagIds: string[],
  nextTagIds: string[],
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

  const nextTagIdSet = new Set(nextTagIds)
  const tagIdsToUnlink = existingTagIds.filter(
    (tagId) => !nextTagIdSet.has(tagId),
  )
  const existingTagIdSet = new Set(existingTagIds)
  const tagIdsToLink = nextTagIds.filter(
    (tagId) => !existingTagIdSet.has(tagId),
  )

  if (tagIdsToUnlink.length > 0) {
    cardTransaction = cardTransaction.unlink({ tags: tagIdsToUnlink })
  }

  if (tagIdsToLink.length > 0) {
    cardTransaction = cardTransaction.link({ tags: tagIdsToLink })
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
    const { cards, isLoading, error } = useCardsQuery()
    const dueCards = cards
      .filter((card) => card.dueAt <= now)
      .sort((left, right) => left.dueAt - right.dueAt)

    return {
      cards: dueCards,
      isLoading,
      error,
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
    const { createTagTransactions, tagIds } = await resolveTagMutation(
      currentUser.id,
      importedTags,
    )
    const tagIdByTitle = new Map(
      importedTags.map((tag, index) => [tag, tagIds[index]]),
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
    const existingCards =
      (await db.queryOnce(existingCardsQuery)).data.$users[0]?.cards ?? []
    const existingTagIdsByCardId = new Map(
      existingCards.map((card) => [card.id, card.tags.map((tag) => tag.id)]),
    )
    const cardTransactions = importedCards.map((card) =>
      createImportedCardTransaction(
        currentUser.id,
        card,
        existingTagIdsByCardId.get(card.id) ?? [],
        card.tags.flatMap((tag) => {
          const tagId = tagIdByTitle.get(tag)
          return tagId ? [tagId] : []
        }),
      ),
    )

    await db.transact([...createTagTransactions, ...cardTransactions])
  }

  const addCard = async (input: NewCardInput) => {
    const currentUser = await requireCurrentUser()
    const tags = parseTags(input.tags)
    const cardId = id()
    const now = Date.now()
    const { createTagTransactions, tagIds } = await resolveTagMutation(
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
      tagIds.length > 0
        ? cardTransaction.link({ tags: tagIds })
        : cardTransaction,
    ])
  }

  const updateCard = async (input: UpdateCardInput) => {
    const tags = parseTags(input.tags)
    const previousTags = parseTags(input.previousTags ?? [])
    const now = Date.now()

    let cardTransaction = db.tx.cards[input.id].update({
      frontHtml: input.frontHtml,
      backHtml: input.backHtml,
      updatedAt: now,
    })

    if (areTagsEqual(tags, previousTags)) {
      await db.transact(cardTransaction)
      return
    }

    const currentUser = await requireCurrentUser()
    const { createTagTransactions, linkedTagIds, tagIds } =
      await resolveTagMutation(currentUser.id, tags, previousTags)
    const nextTagIdSet = new Set(tagIds)
    const tagIdsToUnlink = linkedTagIds.filter(
      (tagId) => !nextTagIdSet.has(tagId),
    )
    const linkedTagIdSet = new Set(linkedTagIds)
    const tagIdsToLink = tagIds.filter((tagId) => !linkedTagIdSet.has(tagId))

    if (tagIdsToUnlink.length > 0) {
      cardTransaction = cardTransaction.unlink({ tags: tagIdsToUnlink })
    }

    if (tagIdsToLink.length > 0) {
      cardTransaction = cardTransaction.link({ tags: tagIdsToLink })
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
    importCards,
    addCard,
    updateCard,
    reviewCard,
    removeCard,
  }
}
