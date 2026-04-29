import {
  AGAIN_EASE_FACTOR_PENALTY,
  createInitialSchedule,
  DEFAULT_EASE_FACTOR,
  HARD_EASE_FACTOR_DELTA,
  MINIMUM_EASE_FACTOR,
  NEVER_REVIEWED_AT,
  type CardSchedule,
  scheduleCardReview,
} from "@/features/cards/model/review-scheduler"

const DAY_IN_MS = 24 * 60 * 60 * 1000
const AGAIN_INTERVAL_MS = 10 * 60 * 1000

function createReviewedSchedule(
  schedule: Partial<CardSchedule> = {},
): CardSchedule {
  return {
    dueAt: 0,
    lastReviewedAt: 1_000,
    intervalDays: 8,
    easeFactor: DEFAULT_EASE_FACTOR,
    repetition: 3,
    lapses: 1,
    state: "review",
    ...schedule,
  }
}

describe("review scheduler", () => {
  it("creates the initial schedule", () => {
    expect(createInitialSchedule(1_000)).toEqual({
      dueAt: 1_000,
      lastReviewedAt: NEVER_REVIEWED_AT,
      intervalDays: 0,
      easeFactor: DEFAULT_EASE_FACTOR,
      repetition: 0,
      lapses: 0,
      state: "new",
    })
  })

  it("schedules an again review from a new card into learning", () => {
    const nextSchedule = scheduleCardReview(
      createInitialSchedule(0),
      "again",
      5_000,
    )

    expect(nextSchedule).toEqual({
      dueAt: 5_000 + AGAIN_INTERVAL_MS,
      lastReviewedAt: 5_000,
      intervalDays: 0,
      easeFactor: DEFAULT_EASE_FACTOR - AGAIN_EASE_FACTOR_PENALTY,
      repetition: 0,
      lapses: 1,
      state: "learning",
    })
  })

  it("schedules a good review from a new card", () => {
    const nextSchedule = scheduleCardReview(
      createInitialSchedule(0),
      "good",
      5_000,
    )

    expect(nextSchedule).toEqual({
      dueAt: 5_000 + 2 * DAY_IN_MS,
      lastReviewedAt: 5_000,
      intervalDays: 2,
      easeFactor: DEFAULT_EASE_FACTOR,
      repetition: 1,
      lapses: 0,
      state: "review",
    })
  })

  it("keeps hard reviews in learning for short intervals", () => {
    const nextSchedule = scheduleCardReview(
      createInitialSchedule(0),
      "hard",
      10_000,
    )

    expect(nextSchedule).toEqual({
      dueAt: 10_000 + DAY_IN_MS,
      lastReviewedAt: 10_000,
      intervalDays: 1,
      easeFactor: DEFAULT_EASE_FACTOR + HARD_EASE_FACTOR_DELTA,
      repetition: 1,
      lapses: 0,
      state: "learning",
    })
  })

  it("grows the interval for hard reviews of reviewed cards", () => {
    const nextSchedule = scheduleCardReview(
      createReviewedSchedule({
        intervalDays: 8,
        easeFactor: 2.4,
        repetition: 3,
      }),
      "hard",
      20_000,
    )

    expect(nextSchedule).toEqual({
      dueAt: 20_000 + 10 * DAY_IN_MS,
      lastReviewedAt: 20_000,
      intervalDays: 10,
      easeFactor: 2.4 + HARD_EASE_FACTOR_DELTA,
      repetition: 4,
      lapses: 1,
      state: "review",
    })
  })

  it("grows the interval for good reviews of reviewed cards", () => {
    const nextSchedule = scheduleCardReview(
      createReviewedSchedule({
        intervalDays: 4,
        easeFactor: 2.5,
        repetition: 2,
      }),
      "good",
      30_000,
    )

    expect(nextSchedule).toEqual({
      dueAt: 30_000 + 10 * DAY_IN_MS,
      lastReviewedAt: 30_000,
      intervalDays: 10,
      easeFactor: 2.5,
      repetition: 3,
      lapses: 1,
      state: "review",
    })
  })

  it("clamps ease factor and moves reviewed cards into relearning on again", () => {
    const nextSchedule = scheduleCardReview(
      createReviewedSchedule({
        intervalDays: 8,
        easeFactor: MINIMUM_EASE_FACTOR,
        repetition: 3,
        lapses: 1,
      }),
      "again",
      20_000,
    )

    expect(nextSchedule).toEqual({
      dueAt: 20_000 + AGAIN_INTERVAL_MS,
      lastReviewedAt: 20_000,
      intervalDays: 0,
      easeFactor: MINIMUM_EASE_FACTOR,
      repetition: 0,
      lapses: 2,
      state: "relearning",
    })
  })
})
