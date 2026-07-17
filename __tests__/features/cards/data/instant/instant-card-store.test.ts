const mockGetAuth = jest.fn()
const mockId = jest.fn(() => "generated-id")
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
  lookup: jest.fn((field: string, value: string) => ({ field, value })),
}))

jest.mock("@sentry/react-native", () => ({
  logger: {
    error: jest.fn(),
  },
}))

jest.mock("@/features/cards/data/instant/db", () => ({
  db: {
    getAuth: (...args: unknown[]) => mockGetAuth(...args),
    transact: (...args: unknown[]) => mockTransact(...args),
    tx: {
      cardSets: new Proxy(
        {},
        {
          get: () => ({
            delete: mockDelete,
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
          get: () => ({
            update: mockUpdate,
          }),
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
    mockGetAuth.mockResolvedValue({ id: "user-1" })
    mockId.mockReturnValue("generated-id")
    mockTransact.mockResolvedValue(undefined)
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
  })

  it("logs background metadata persistence failures", async () => {
    const error = new Error("Metadata sync failed.")
    mockTransact.mockRejectedValue(error)
    const store = createInstantCardStore()

    store.updateCard({
      id: "card-1",
      cardSetId: "set-existing",
      previousTags: ["German"],
      variant: "forward",
      tags: ["German"],
      frontHtml: "<p>Hallo</p>",
      backHtml: "<p>Hello</p>",
    })

    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(mockSentryError).toHaveBeenCalledWith(
      "Failed to persist card metadata.",
      {
        feature: "cards",
        error: "Metadata sync failed.",
        error_type: "Error",
      },
    )
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
