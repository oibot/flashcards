import { id } from "@instantdb/react-native"

import { useAuthSession } from "@/auth/use-auth-session"
import type { CardStore } from "@/db/card-store"
import { db } from "@/db/instant/db"
import { normalizeError, toCard } from "@/db/instant/instant-utils"
import {
  type Card,
  type NewCardInput,
  normalizeTagTitle,
  parseTags,
} from "@/domain/card"
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

  const addCard = async (input: NewCardInput) => {
    const currentUser = await requireCurrentUser()
    const tags = parseTags(input.tags)
    const cardId = id()
    const now = Date.now()
    const existingTagsQuery = {
      $users: {
        $: {
          where: {
            id: currentUser.id,
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
      ...missingTags.map((tag) =>
        db.tx.tags[newTagIdByTitle.get(tag)!]
          .create({
            ownerTitle: toOwnerTitle(currentUser.id, tag),
            title: tag,
          })
          .link({ owner: currentUser.id }),
      ),
      tagIds.length > 0
        ? cardTransaction.link({ tags: tagIds })
        : cardTransaction,
    ])
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
    addCard,
    reviewCard,
    removeCard,
  }
}
