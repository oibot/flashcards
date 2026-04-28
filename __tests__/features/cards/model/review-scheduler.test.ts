import {
  createInitialSchedule,
  DEFAULT_EASE_FACTOR,
  MINIMUM_EASE_FACTOR,
  scheduleCardReview,
} from "@/features/cards/model/review-scheduler"

describe("review scheduler", () => {
  it("creates the initial schedule", () => {
    expect(createInitialSchedule(1_000)).toEqual({
      dueAt: 1_000,
      lastReviewedAt: 0,
      intervalDays: 0,
      easeFactor: DEFAULT_EASE_FACTOR,
      repetition: 0,
      lapses: 0,
      state: "new",
    })
  })

  it("schedules a good review from a new card", () => {
    const nextSchedule = scheduleCardReview(
      createInitialSchedule(0),
      "good",
      5_000,
    )

    expect(nextSchedule).toEqual({
      dueAt: 5_000 + 2 * 24 * 60 * 60 * 1000,
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
      dueAt: 10_000 + 24 * 60 * 60 * 1000,
      lastReviewedAt: 10_000,
      intervalDays: 1,
      easeFactor: DEFAULT_EASE_FACTOR - 0.15,
      repetition: 1,
      lapses: 0,
      state: "learning",
    })
  })

  it("clamps ease factor and moves reviewed cards into relearning on again", () => {
    const nextSchedule = scheduleCardReview(
      {
        dueAt: 0,
        lastReviewedAt: 0,
        intervalDays: 8,
        easeFactor: MINIMUM_EASE_FACTOR,
        repetition: 3,
        lapses: 1,
        state: "review",
      },
      "again",
      20_000,
    )

    expect(nextSchedule).toEqual({
      dueAt: 20_000 + 10 * 60 * 1000,
      lastReviewedAt: 20_000,
      intervalDays: 0,
      easeFactor: MINIMUM_EASE_FACTOR,
      repetition: 0,
      lapses: 2,
      state: "relearning",
    })
  })
})
