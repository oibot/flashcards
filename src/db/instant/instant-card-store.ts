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
import type { CardBackupEnvelope } from "@/domain/card-backup"
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

async function resolveTagMutation(userId: string, tags: string[]) {
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
            title: { $in: tags },
          },
        },
      },
    },
  }
  const existingTags =
    tags.length > 0
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
    tagIds,
  }
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
    throw new Error("Card export is not implemented yet")
  }

  const importCards = async (backup: CardBackupEnvelope) => {
    void backup

    throw new Error("Card import is not implemented yet")
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
    const currentUser = await requireCurrentUser()
    const tags = parseTags(input.tags)
    const now = Date.now()
    const { createTagTransactions, tagIds } = await resolveTagMutation(
      currentUser.id,
      tags,
    )
    const existingCardQuery = {
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
          tags: {},
        },
      },
    }
    const existingCard =
      (await db.queryOnce(existingCardQuery)).data.$users[0]?.cards[0] ?? null
    const existingTagIds = existingCard?.tags.map((tag) => tag.id) ?? []
    const nextTagIdSet = new Set(tagIds)
    const tagIdsToUnlink = existingTagIds.filter(
      (tagId) => !nextTagIdSet.has(tagId),
    )
    const existingTagIdSet = new Set(existingTagIds)
    const tagIdsToLink = tagIds.filter((tagId) => !existingTagIdSet.has(tagId))

    let cardTransaction = db.tx.cards[input.id].update({
      frontHtml: input.frontHtml,
      backHtml: input.backHtml,
      updatedAt: now,
    })

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
