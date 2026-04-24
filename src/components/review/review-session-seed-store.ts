import type { ReviewSessionSeed } from "@/domain/review-session"

let pendingReviewSessionSeed: ReviewSessionSeed | null = null

export function setPendingReviewSessionSeed(seed: ReviewSessionSeed) {
  pendingReviewSessionSeed = seed
}

export function consumePendingReviewSessionSeed() {
  const seed = pendingReviewSessionSeed
  pendingReviewSessionSeed = null
  return seed
}
