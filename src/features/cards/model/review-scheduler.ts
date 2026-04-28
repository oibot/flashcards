import type { Card } from "@/features/cards/model/card"
import type { CardState } from "@/features/cards/model/card-state"

export type ReviewGrade = "again" | "hard" | "good"

export type CardSchedule = Pick<
  Card,
  | "dueAt"
  | "lastReviewedAt"
  | "intervalDays"
  | "easeFactor"
  | "repetition"
  | "lapses"
  | "state"
>

const DAY_IN_MS = 24 * 60 * 60 * 1000
const AGAIN_INTERVAL_MS = 10 * 60 * 1000
const INITIAL_HARD_INTERVAL_DAYS = 1
const INITIAL_GOOD_INTERVAL_DAYS = 2
const HARD_INTERVAL_MULTIPLIER = 1.2

export const DEFAULT_EASE_FACTOR = 2.5
export const MINIMUM_EASE_FACTOR = 1.3
export const AGAIN_EASE_FACTOR_PENALTY = 0.2
export const HARD_EASE_FACTOR_DELTA = -0.15
export const NEVER_REVIEWED_AT = 0

function clampEaseFactor(value: number) {
  return Math.max(MINIMUM_EASE_FACTOR, value)
}

function getInitialStateForGrade(
  grade: Exclude<ReviewGrade, "again">,
): CardState {
  return grade === "hard" ? "learning" : "review"
}

function getLearningInterval(grade: Exclude<ReviewGrade, "again">) {
  switch (grade) {
    case "hard":
      return INITIAL_HARD_INTERVAL_DAYS
    case "good":
      return INITIAL_GOOD_INTERVAL_DAYS
  }
}

function getReviewInterval(
  intervalDays: number,
  easeFactor: number,
  grade: Exclude<ReviewGrade, "again">,
) {
  switch (grade) {
    case "hard":
      return Math.max(
        INITIAL_HARD_INTERVAL_DAYS,
        Math.ceil(intervalDays * HARD_INTERVAL_MULTIPLIER),
      )
    case "good":
      return Math.max(
        INITIAL_HARD_INTERVAL_DAYS,
        Math.ceil(intervalDays * easeFactor),
      )
  }
}

function getNextInterval(
  card: CardSchedule,
  grade: Exclude<ReviewGrade, "again">,
) {
  if (card.repetition === 0) {
    return getLearningInterval(grade)
  }

  return getReviewInterval(card.intervalDays, card.easeFactor, grade)
}

export function createInitialSchedule(now: number): CardSchedule {
  return {
    dueAt: now,
    lastReviewedAt: NEVER_REVIEWED_AT,
    intervalDays: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    repetition: 0,
    lapses: 0,
    state: "new",
  }
}

export function scheduleCardReview(
  card: CardSchedule,
  grade: ReviewGrade,
  now: number,
): CardSchedule {
  if (grade === "again") {
    return {
      dueAt: now + AGAIN_INTERVAL_MS,
      lastReviewedAt: now,
      intervalDays: 0,
      easeFactor: clampEaseFactor(card.easeFactor - AGAIN_EASE_FACTOR_PENALTY),
      repetition: 0,
      lapses: card.lapses + 1,
      state: card.repetition === 0 ? "learning" : "relearning",
    }
  }

  const nextInterval = getNextInterval(card, grade)

  const easeFactorDelta = grade === "hard" ? HARD_EASE_FACTOR_DELTA : 0

  return {
    dueAt: now + nextInterval * DAY_IN_MS,
    lastReviewedAt: now,
    intervalDays: nextInterval,
    easeFactor: clampEaseFactor(card.easeFactor + easeFactorDelta),
    repetition: card.repetition + 1,
    lapses: card.lapses,
    state: nextInterval <= 1 ? getInitialStateForGrade(grade) : "review",
  }
}
