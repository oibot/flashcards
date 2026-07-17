import { id, lookup } from "@instantdb/react-native"
import * as Sentry from "@sentry/react-native"

import { useAuthSession } from "@/features/auth/hooks/use-auth-session"
import {
  CARD_BACKUP_APP,
  type CardBackupEnvelope,
} from "@/features/cards/backup/model/card-backup"
import type {
  CardSaveResult,
  CardStore,
  TagsQueryState,
} from "@/features/cards/data/card-store"
import { db } from "@/features/cards/data/instant/db"
import {
  diffTags,
  type ImportedCardPlan,
  type ImportedCardSetPlan,
  planAddCard,
  planImportCards,
  planUpdateCard,
} from "@/features/cards/data/instant/instant-card-store-update-plan"
import {
  normalizeError,
  toCard,
  toCardBackupCardSet,
  toStoredCardSet,
} from "@/features/cards/data/instant/instant-utils"
import {
  type Card,
  type NewCardInput,
  normalizeTagTitle,
  type UpdateCardInput,
} from "@/features/cards/model/card"
import {
  type ReviewGrade,
  scheduleCardReview,
} from "@/features/cards/model/review-scheduler"
import { getErrorLogAttributes } from "@/shared/lib/error"

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

function createImportedCardSetTransaction(
  userId: string,
  cardSet: ImportedCardSetPlan,
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

  const { tagsToLink, tagsToUnlink } = diffTags(
    cardSet.previousTags,
    cardSet.tags,
  )

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

function createImportedCardTransaction(userId: string, card: ImportedCardPlan) {
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
      cardSet: card.cardSetId,
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
                  sideATtsAsset: { file: {} },
                  sideBTtsAsset: { file: {} },
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
                sideATtsAsset: { file: {} },
                sideBTtsAsset: { file: {} },
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

    const importedCardSetIds = backup.cardSets.map((cardSet) => cardSet.id)
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
    const plan = planImportCards({
      backup,
      existingCardSets,
    })
    const createTagTransactions = createEnsureTagTransactions(
      currentUser.id,
      plan.importedTags,
    )
    const cardSetTransactions = plan.cardSets.map((cardSet) =>
      createImportedCardSetTransaction(currentUser.id, cardSet),
    )
    const cardTransactions = plan.cards.map((card) =>
      createImportedCardTransaction(currentUser.id, card),
    )

    await db.transact([
      ...createTagTransactions,
      ...cardSetTransactions,
      ...cardTransactions,
    ])
  }

  const addCard = (input: NewCardInput): CardSaveResult => {
    const cardSetId = id()
    const cardIds = input.variants.map(() => id())
    const now = Date.now()
    const plan = planAddCard({
      input,
      now,
      cardSetId,
      cardIds,
    })

    const persistCard = async () => {
      try {
        const currentUser = await requireCurrentUser()
        const createTagTransactions = createEnsureTagTransactions(
          currentUser.id,
          plan.tags,
        )

        let cardSetTransaction = db.tx.cardSets[plan.cardSetId]
          .update(plan.cardSetUpdate)
          .link({ owner: currentUser.id })

        if (plan.tags.length > 0) {
          cardSetTransaction = cardSetTransaction.link({
            tags: toTagLookups(currentUser.id, plan.tags),
          })
        }

        const cardTransactions = plan.cards.map((card) =>
          db.tx.cards[card.id]
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
              owner: currentUser.id,
              cardSet: plan.cardSetId,
            }),
        )

        await db.transact([
          ...createTagTransactions,
          cardSetTransaction,
          ...cardTransactions,
        ])
      } catch (error) {
        Sentry.logger.error("Failed to persist card metadata.", {
          feature: "cards",
          ...getErrorLogAttributes(error),
        })
      }
    }

    const metadataPersisted = persistCard()

    return { cardSetId: plan.cardSetId, metadataPersisted }
  }

  const updateCard = (input: UpdateCardInput): CardSaveResult => {
    const now = Date.now()
    const plan = planUpdateCard({
      input,
      now,
    })

    const persistCard = async () => {
      try {
        const currentUser = await requireCurrentUser()
        let cardSetTransaction = db.tx.cardSets[plan.cardSetId].update(
          plan.cardSetUpdate,
        )

        if (plan.tagsToUnlink.length > 0) {
          cardSetTransaction = cardSetTransaction.unlink({
            tags: toTagLookups(currentUser.id, plan.tagsToUnlink),
          })
        }

        if (plan.tagsToLink.length > 0) {
          cardSetTransaction = cardSetTransaction.link({
            tags: toTagLookups(currentUser.id, plan.tagsToLink),
          })
        }

        if (plan.tagsToLink.length === 0 && plan.tagsToUnlink.length === 0) {
          await db.transact(cardSetTransaction)
          return
        }

        const createTagTransactions = createEnsureTagTransactions(
          currentUser.id,
          plan.tagsToLink,
        )

        await db.transact([...createTagTransactions, cardSetTransaction])
      } catch (error) {
        Sentry.logger.error("Failed to persist card metadata.", {
          feature: "cards",
          ...getErrorLogAttributes(error),
        })
      }
    }

    const metadataPersisted = persistCard()

    return { cardSetId: plan.cardSetId, metadataPersisted }
  }

  const reviewCard = (
    card: Card,
    grade: ReviewGrade,
    reviewedAt = Date.now(),
  ) => {
    const persistReview = async () => {
      try {
        await db.transact(
          db.tx.cards[card.id].update({
            ...scheduleCardReview(card, grade, reviewedAt),
            updatedAt: reviewedAt,
          }),
        )
      } catch (error) {
        Sentry.logger.error("Failed to persist card review.", {
          feature: "cards",
          ...getErrorLogAttributes(error),
        })
      }
    }

    void persistReview()
  }

  const removeCard = (card: Card) => {
    const persistDelete = async () => {
      try {
        await db.transact(db.tx.cardSets[card.cardSetId].delete())
      } catch (error) {
        Sentry.logger.error("Failed to remove card.", {
          feature: "cards",
          ...getErrorLogAttributes(error),
        })
      }
    }

    void persistDelete()
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
