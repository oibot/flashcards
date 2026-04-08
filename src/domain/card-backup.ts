import type { Card } from "@/domain/card"

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
