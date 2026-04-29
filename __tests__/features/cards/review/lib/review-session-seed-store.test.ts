import type { ReviewSessionSeed } from "@/features/cards/model/review-session"
import {
  consumePendingReviewSessionSeed,
  setPendingReviewSessionSeed,
} from "@/features/cards/review/lib/review-session-seed-store"

import { createReviewCard } from "../test-utils"

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
