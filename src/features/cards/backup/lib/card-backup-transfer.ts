import type { CardBackupEnvelope } from "@/features/cards/backup/model/card-backup"
import {
  getCardBackupCardCount,
  validateCardBackup,
} from "@/features/cards/backup/model/card-backup"

export type ParsedCardBackupImport = {
  backup: CardBackupEnvelope
  cardCount: number
}

export function createCardBackupFileName(exportedAt: string) {
  return `flashcards-export-${exportedAt.slice(0, 10)}.json`
}

export function parseCardBackupImport(
  fileContents: string,
  invalidBackupMessage: string,
): ParsedCardBackupImport {
  let parsedBackup: unknown

  try {
    parsedBackup = JSON.parse(fileContents) as unknown
  } catch {
    throw new Error(invalidBackupMessage)
  }

  const validationResult = validateCardBackup(parsedBackup)

  if (!validationResult.isValid) {
    throw new Error(validationResult.message)
  }

  return {
    backup: validationResult.backup,
    cardCount: getCardBackupCardCount(validationResult.backup),
  }
}
