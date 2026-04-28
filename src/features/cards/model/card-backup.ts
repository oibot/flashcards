import {
  isSupportedTtsLocale,
  type SupportedTtsLocale,
} from "@/features/cards/audio/card-audio"
import {
  type Card,
  type CardId,
  type CardVariant,
  isCardVariant,
} from "@/features/cards/model/card"
import { isCardState } from "@/features/cards/model/card-state"

export const CARD_BACKUP_APP = "flashcards"

export type CardBackupCard = {
  id: CardId
  variant: CardVariant
  createdAt: number
  updatedAt: number
  dueAt: number
  lastReviewedAt: number
  intervalDays: number
  easeFactor: number
  repetition: number
  lapses: number
  state: Card["state"]
}

export type CardBackupCardSet = {
  id: string
  tags: string[]
  sideAHtml: string
  sideBHtml: string
  sideATtsLocale?: SupportedTtsLocale
  sideBTtsLocale?: SupportedTtsLocale
  createdAt: number
  updatedAt: number
  cards: CardBackupCard[]
}

export type CardBackupEnvelope = {
  app: typeof CARD_BACKUP_APP
  exportedAt: string
  cardSets: CardBackupCardSet[]
}

export type CardBackupValidationIssueCode =
  | "invalid_app"
  | "invalid_exported_at"
  | "invalid_card_sets"
  | "invalid_card_set"
  | "invalid_card"

export type CardBackupValidationSuccess = {
  isValid: true
  backup: CardBackupEnvelope
}

export type CardBackupValidationFailure = {
  isValid: false
  code: CardBackupValidationIssueCode
  message: string
}

export type CardBackupValidationResult =
  | CardBackupValidationSuccess
  | CardBackupValidationFailure

function createValidationFailure(
  code: CardBackupValidationIssueCode,
  message: string,
): CardBackupValidationFailure {
  return {
    isValid: false,
    code,
    message,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "string")
  )
}

function isOptionalSupportedTtsLocale(
  value: unknown,
): value is SupportedTtsLocale | undefined {
  return typeof value === "undefined" || isSupportedTtsLocale(value)
}

function isValidCardBackupCard(value: unknown): value is CardBackupCard {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === "string" &&
    typeof value.variant === "string" &&
    isCardVariant(value.variant) &&
    typeof value.createdAt === "number" &&
    typeof value.updatedAt === "number" &&
    typeof value.dueAt === "number" &&
    typeof value.lastReviewedAt === "number" &&
    typeof value.intervalDays === "number" &&
    typeof value.easeFactor === "number" &&
    typeof value.repetition === "number" &&
    typeof value.lapses === "number" &&
    typeof value.state === "string" &&
    isCardState(value.state)
  )
}

function isValidCardBackupCardSet(value: unknown): value is CardBackupCardSet {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === "string" &&
    isStringArray(value.tags) &&
    typeof value.sideAHtml === "string" &&
    typeof value.sideBHtml === "string" &&
    isOptionalSupportedTtsLocale(value.sideATtsLocale) &&
    isOptionalSupportedTtsLocale(value.sideBTtsLocale) &&
    typeof value.createdAt === "number" &&
    typeof value.updatedAt === "number" &&
    Array.isArray(value.cards) &&
    value.cards.every((card) => isValidCardBackupCard(card))
  )
}

export function getCardBackupCardCount(backup: CardBackupEnvelope) {
  return backup.cardSets.reduce(
    (count, cardSet) => count + cardSet.cards.length,
    0,
  )
}

export function validateCardBackup(value: unknown): CardBackupValidationResult {
  if (!isRecord(value)) {
    return createValidationFailure(
      "invalid_card",
      "Backup file must contain a JSON object.",
    )
  }

  if (value.app !== CARD_BACKUP_APP) {
    return createValidationFailure(
      "invalid_app",
      "Backup file is not a flashcards export.",
    )
  }

  if (!isValidDateString(value.exportedAt)) {
    return createValidationFailure(
      "invalid_exported_at",
      "Backup file has an invalid export date.",
    )
  }

  if (!Array.isArray(value.cardSets)) {
    return createValidationFailure(
      "invalid_card_sets",
      "Backup file must contain a cardSets array.",
    )
  }

  const invalidCardSetIndex = value.cardSets.findIndex(
    (cardSet) => !isValidCardBackupCardSet(cardSet),
  )

  if (invalidCardSetIndex >= 0) {
    return createValidationFailure(
      "invalid_card_set",
      `Backup file contains an invalid card set at index ${invalidCardSetIndex}.`,
    )
  }

  return {
    isValid: true,
    backup: {
      app: CARD_BACKUP_APP,
      exportedAt: value.exportedAt,
      cardSets: value.cardSets,
    },
  }
}
