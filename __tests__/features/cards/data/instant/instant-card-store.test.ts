const mockTransact = jest.fn()
const mockUpdate = jest.fn((payload: unknown) => ({ payload, type: "update" }))

jest.mock("@instantdb/react-native", () => ({
  id: jest.fn(() => "generated-id"),
  lookup: jest.fn((field: string, value: string) => ({ field, value })),
}))

jest.mock("@/features/cards/data/instant/db", () => ({
  db: {
    transact: (...args: unknown[]) => mockTransact(...args),
    tx: {
      cards: new Proxy(
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

import type { Card } from "@/features/cards/model/card"
import { createInstantCardStore } from "@/features/cards/data/instant/instant-card-store"

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
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>

  beforeEach(() => {
    jest.clearAllMocks()
    mockTransact.mockResolvedValue(undefined)
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it("persists card reviews in the background", async () => {
    const store = createInstantCardStore()
    const card = createReviewCard()

    store.reviewCard(card, "good", 10_000)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ updatedAt: 10_000 }),
    )
    expect(mockTransact).toHaveBeenCalledWith({
      payload: expect.objectContaining({ updatedAt: 10_000 }),
      type: "update",
    })

    await Promise.resolve()

    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it("logs background review persistence failures", async () => {
    const error = new Error("Review sync failed.")
    mockTransact.mockRejectedValue(error)
    const store = createInstantCardStore()

    store.reviewCard(createReviewCard(), "again", 10_000)

    await Promise.resolve()

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to persist card review.",
      error,
    )
  })
})
