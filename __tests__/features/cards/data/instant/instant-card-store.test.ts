const mockDeletedCardSetIds: string[] = []
const mockDeletedTagIds: string[] = []
const mockGetAuth = jest.fn()
const mockId = jest.fn(() => "generated-id")
const mockQueryOnce = jest.fn()
const mockTagEntityIds: string[] = []
const mockDelete = jest.fn(() => ({ type: "delete" }))
const mockLink = jest.fn()
const mockTransact = jest.fn()
const mockUnlink = jest.fn()
const mockUpdate = jest.fn((payload: unknown) => {
  const transaction = {
    link: mockLink,
    payload,
    type: "update",
    unlink: mockUnlink,
  }

  mockLink.mockReturnValue(transaction)
  mockUnlink.mockReturnValue(transaction)

  return transaction
})

jest.mock("@instantdb/react-native", () => ({
  id: () => mockId(),
}))

jest.mock("@sentry/react-native", () => ({
  logger: {
    error: jest.fn(),
  },
}))

jest.mock("@/features/cards/data/instant/db", () => ({
  db: {
    getAuth: (...args: unknown[]) => mockGetAuth(...args),
    queryOnce: (...args: unknown[]) => mockQueryOnce(...args),
    transact: (...args: unknown[]) => mockTransact(...args),
    tx: {
      cardSets: new Proxy(
        {},
        {
          get: (_target, entityId) => ({
            delete: () => {
              mockDeletedCardSetIds.push(String(entityId))
              return mockDelete()
            },
            update: mockUpdate,
          }),
        },
      ),
      cards: new Proxy(
        {},
        {
          get: () => ({
            update: mockUpdate,
          }),
        },
      ),
      tags: new Proxy(
        {},
        {
          get: (_target, entityId) => {
            mockTagEntityIds.push(String(entityId))
            return {
              delete: () => {
                mockDeletedTagIds.push(String(entityId))
                return mockDelete()
              },
              update: mockUpdate,
            }
          },
        },
      ),
    },
  },
}))

import * as Sentry from "@sentry/react-native"

import type { Card } from "@/features/cards/model/card"
import { createInstantCardStore } from "@/features/cards/data/instant/instant-card-store"

const mockSentryError = jest.mocked(Sentry.logger.error)

function createReviewCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "card-1",
    cardSetId: "set-1",
    variant: "forward",
    tags: ["German"],
    frontHtml: "<p>Hallo</p>",
    backHtml: "<p>Hello</p>",
    frontTtsLocale: undefined,
    backTtsLocale: undefined,
    frontHasSound: false,
    backHasSound: false,
    createdAt: 1,
    updatedAt: 2,
    dueAt: 3,
    lastReviewedAt: 4,
    intervalDays: 5,
    easeFactor: 2.5,
    repetition: 1,
    lapses: 0,
    state: "review",
    ...overrides,
  }
}

describe("createInstantCardStore", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDeletedCardSetIds.length = 0
    mockDeletedTagIds.length = 0
    mockGetAuth.mockResolvedValue({ id: "user-1" })
    mockId.mockReturnValue("generated-id")
    mockQueryOnce.mockResolvedValue({ data: { $users: [] } })
    mockTagEntityIds.length = 0
    mockTransact.mockResolvedValue({
      clientId: "client-1",
      status: "synced",
    })
  })

  it("persists card reviews in the background", async () => {
    const store = createInstantCardStore()
    const card = createReviewCard()

    store.reviewCard(card, "good", 10_000)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ updatedAt: 10_000 }),
    )
    expect(mockTransact).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ updatedAt: 10_000 }),
        type: "update",
      }),
    )

    await Promise.resolve()

    expect(mockSentryError).not.toHaveBeenCalled()
  })

  it("logs background review persistence failures", async () => {
    const error = new Error("Review sync failed.")
    mockTransact.mockRejectedValue(error)
    const store = createInstantCardStore()

    store.reviewCard(createReviewCard(), "again", 10_000)

    await Promise.resolve()

    expect(mockSentryError).toHaveBeenCalledWith(
      "Failed to persist card review.",
      {
        feature: "cards",
        error: "Review sync failed.",
        error_type: "Error",
      },
    )
  })

  it("returns a local card set id before add-card metadata persistence finishes", async () => {
    let resolveAuth: (value: { id: string }) => void = () => undefined
    mockId
      .mockReturnValueOnce("set-new")
      .mockReturnValueOnce("card-forward")
      .mockReturnValueOnce("card-reverse")
    mockGetAuth.mockReturnValue(
      new Promise((resolve) => {
        resolveAuth = resolve
      }),
    )
    const store = createInstantCardStore()

    const result = store.addCard({
      tags: ["German"],
      frontHtml: "<p>Hallo</p>",
      backHtml: "<p>Hello</p>",
      variants: ["forward", "reverse"],
    })

    expect(result).toEqual({
      cardSetId: "set-new",
      metadataPersisted: expect.any(Promise),
    })
    expect(mockTransact).not.toHaveBeenCalled()

    resolveAuth({ id: "user-1" })
    await Promise.resolve()
    await Promise.resolve()

    expect(mockTransact).toHaveBeenCalledTimes(1)
    expect(mockTagEntityIds).toContain("1f767874-6c18-598c-8407-1d9712ec8713")
    expect(mockUpdate).toHaveBeenCalledWith({
      ownerTitle: "user-1:German",
      title: "German",
    })
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        sideAHtml: "<p>Hallo</p>",
        sideAShowText: true,
        sideBHtml: "<p>Hello</p>",
        sideBShowText: true,
      }),
    )
    expect(mockLink).toHaveBeenCalledWith({
      tags: ["1f767874-6c18-598c-8407-1d9712ec8713"],
    })
  })

  it("returns the existing card set id before update-card metadata persistence finishes", async () => {
    let resolveAuth: (value: { id: string }) => void = () => undefined
    mockGetAuth.mockReturnValue(
      new Promise((resolve) => {
        resolveAuth = resolve
      }),
    )
    const store = createInstantCardStore()

    const result = store.updateCard({
      id: "card-1",
      cardSetId: "set-existing",
      previousTags: ["German"],
      variant: "forward",
      tags: ["German", "Travel"],
      frontHtml: "<p>Hallo</p>",
      backHtml: "<p>Hello</p>",
    })

    expect(result).toEqual({
      cardSetId: "set-existing",
      metadataPersisted: expect.any(Promise),
    })
    expect(mockTransact).not.toHaveBeenCalled()

    resolveAuth({ id: "user-1" })
    await Promise.resolve()
    await Promise.resolve()

    expect(mockTransact).toHaveBeenCalledTimes(1)
    expect(mockTagEntityIds).toContain("ae1ac80e-efba-52e2-82a2-cfd3ee364217")
    expect(mockUpdate).toHaveBeenCalledWith({
      ownerTitle: "user-1:Travel",
      title: "Travel",
    })
    expect(mockLink).toHaveBeenCalledWith({
      tags: ["ae1ac80e-efba-52e2-82a2-cfd3ee364217"],
    })
  })

  it("unlinks tags by deterministic id", async () => {
    const store = createInstantCardStore()

    const result = store.updateCard({
      id: "card-1",
      cardSetId: "set-existing",
      previousTags: ["German", "Travel"],
      variant: "forward",
      tags: ["German"],
      frontHtml: "<p>Hallo</p>",
      backHtml: "<p>Hello</p>",
    })

    await result.metadataPersisted

    expect(mockUnlink).toHaveBeenCalledWith({
      tags: ["ae1ac80e-efba-52e2-82a2-cfd3ee364217"],
    })
  })

  it("logs background metadata persistence failures", async () => {
    const error = new Error("Metadata sync failed.")
    mockTransact.mockRejectedValue(error)
    const store = createInstantCardStore()

    const result = store.updateCard({
      id: "card-1",
      cardSetId: "set-existing",
      previousTags: ["German"],
      variant: "forward",
      tags: ["German"],
      frontHtml: "<p>Hallo</p>",
      backHtml: "<p>Hello</p>",
    })

    await result.metadataPersisted

    expect(mockSentryError).toHaveBeenCalledWith(
      "Failed to persist card metadata.",
      {
        feature: "cards",
        error: "Metadata sync failed.",
        error_type: "Error",
      },
    )
  })

  it("deletes all card sets and tags owned by the current user", async () => {
    mockQueryOnce.mockResolvedValue({
      data: {
        $users: [
          {
            cardSets: [{ id: "set-1" }, { id: "set-2" }],
            tags: [{ id: "tag-1" }, { id: "tag-2" }],
          },
        ],
      },
    })
    const store = createInstantCardStore()

    await expect(store.deleteAllCardData()).resolves.toBe("synced")

    expect(mockQueryOnce).toHaveBeenCalledWith({
      $users: {
        $: { where: { id: "user-1" } },
        cardSets: {},
        tags: {},
      },
    })
    expect(mockDeletedCardSetIds).toEqual(["set-1", "set-2"])
    expect(mockDeletedTagIds).toEqual(["tag-1", "tag-2"])
    expect(mockTransact).toHaveBeenCalledWith([
      { type: "delete" },
      { type: "delete" },
      { type: "delete" },
      { type: "delete" },
    ])
  })

  it("skips the deletion transaction when the account has no card data", async () => {
    const store = createInstantCardStore()

    await expect(store.deleteAllCardData()).resolves.toBe("empty")

    expect(mockTransact).not.toHaveBeenCalled()
  })

  it("removes cards in the background by card set id", async () => {
    const store = createInstantCardStore()

    store.removeCard(createReviewCard({ cardSetId: "set-1" }))

    expect(mockDelete).toHaveBeenCalledTimes(1)
    expect(mockTransact).toHaveBeenCalledWith({ type: "delete" })

    await Promise.resolve()

    expect(mockSentryError).not.toHaveBeenCalled()
  })

  it("logs background card removal failures", async () => {
    const error = new Error("Delete sync failed.")
    mockTransact.mockRejectedValue(error)
    const store = createInstantCardStore()

    store.removeCard(createReviewCard({ cardSetId: "set-1" }))

    await Promise.resolve()

    expect(mockSentryError).toHaveBeenCalledWith("Failed to remove card.", {
      feature: "cards",
      error: "Delete sync failed.",
      error_type: "Error",
    })
  })
})
