import type { Card } from "@/features/cards/model/card"
import type { ReviewSessionSeed } from "@/features/cards/model/review-session"
import {
  consumePendingReviewSessionSeed,
  setPendingReviewSessionSeed,
} from "@/features/cards/review/lib/review-session-seed-store"

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

describe("review session seed store", () => {
  beforeEach(() => {
    consumePendingReviewSessionSeed()
  })

  it("returns a pending seed once and then clears it", () => {
    const seed: ReviewSessionSeed = {
      cards: [createReviewCard({ id: "card-1" })],
      config: {
        tags: ["German"],
      },
    }

    setPendingReviewSessionSeed(seed)

    expect(consumePendingReviewSessionSeed()).toBe(seed)
    expect(consumePendingReviewSessionSeed()).toBeNull()
  })
})
