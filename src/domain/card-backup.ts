import type { Card } from "@/domain/card"
import { isCardState } from "@/domain/card-state"

export const CARD_BACKUP_APP = "flashcards"
export const CARD_BACKUP_FORMAT_VERSION = 1 as const

export type CardBackupEnvelope = {
  app: typeof CARD_BACKUP_APP
  formatVersion: typeof CARD_BACKUP_FORMAT_VERSION
  exportedAt: string
  cards: Card[]
}

export type CardBackupValidationIssueCode =
  | "invalid_app"
  | "invalid_format_version"
  | "invalid_exported_at"
  | "invalid_cards"
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

function isValidCard(value: unknown): value is Card {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === "string" &&
    isStringArray(value.tags) &&
    typeof value.frontHtml === "string" &&
    typeof value.backHtml === "string" &&
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

  if (value.formatVersion !== CARD_BACKUP_FORMAT_VERSION) {
    return createValidationFailure(
      "invalid_format_version",
      "Backup file format version is not supported.",
    )
  }

  if (!isValidDateString(value.exportedAt)) {
    return createValidationFailure(
      "invalid_exported_at",
      "Backup file has an invalid export date.",
    )
  }

  if (!Array.isArray(value.cards)) {
    return createValidationFailure(
      "invalid_cards",
      "Backup file must contain a cards array.",
    )
  }

  const invalidCardIndex = value.cards.findIndex((card) => !isValidCard(card))

  if (invalidCardIndex >= 0) {
    return createValidationFailure(
      "invalid_card",
      `Backup file contains an invalid card at index ${invalidCardIndex}.`,
    )
  }

  return {
    isValid: true,
    backup: {
      app: CARD_BACKUP_APP,
      formatVersion: CARD_BACKUP_FORMAT_VERSION,
      exportedAt: value.exportedAt,
      cards: value.cards,
    },
  }
}
