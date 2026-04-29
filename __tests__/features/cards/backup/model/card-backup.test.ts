import {
  CARD_BACKUP_APP,
  getCardBackupCardCount,
  validateCardBackup,
  type CardBackupCard,
  type CardBackupCardSet,
  type CardBackupEnvelope,
} from "@/features/cards/backup/model/card-backup"

function createBackupCard(
  overrides: Partial<CardBackupCard> = {},
): CardBackupCard {
  return {
    id: "card-1",
    variant: "forward",
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

function createBackupCardSet(
  overrides: Partial<CardBackupCardSet> = {},
): CardBackupCardSet {
  return {
    id: "set-1",
    tags: ["German"],
    sideAHtml: "<p>Hallo</p>",
    sideBHtml: "<p>Hello</p>",
    sideATtsLocale: "de-DE",
    sideBTtsLocale: "en-US",
    createdAt: 1,
    updatedAt: 2,
    cards: [createBackupCard()],
    ...overrides,
  }
}

function createBackupEnvelope(
  overrides: Partial<CardBackupEnvelope> = {},
): CardBackupEnvelope {
  return {
    app: CARD_BACKUP_APP,
    exportedAt: "2026-04-29T12:00:00.000Z",
    cardSets: [createBackupCardSet()],
    ...overrides,
  }
}

describe("card backup model", () => {
  it("accepts a valid backup envelope", () => {
    const backup = createBackupEnvelope()

    expect(validateCardBackup(backup)).toEqual({
      isValid: true,
      backup,
    })
  })

  it("rejects non-object backup values", () => {
    expect(validateCardBackup(null)).toEqual({
      isValid: false,
      code: "invalid_card",
      message: "Backup file must contain a JSON object.",
    })
  })

  it("rejects backup data from another app", () => {
    const result = validateCardBackup({
      ...createBackupEnvelope(),
      app: "other-app",
    })

    expect(result).toEqual({
      isValid: false,
      code: "invalid_app",
      message: "Backup file is not a flashcards export.",
    })
  })

  it("rejects an invalid export date", () => {
    const result = validateCardBackup({
      ...createBackupEnvelope(),
      exportedAt: "not-a-date",
    })

    expect(result).toEqual({
      isValid: false,
      code: "invalid_exported_at",
      message: "Backup file has an invalid export date.",
    })
  })

  it("rejects backup data without a cardSets array", () => {
    const result = validateCardBackup({
      ...createBackupEnvelope(),
      cardSets: undefined,
    })

    expect(result).toEqual({
      isValid: false,
      code: "invalid_card_sets",
      message: "Backup file must contain a cardSets array.",
    })
  })

  it("rejects invalid card-set or card records", () => {
    const result = validateCardBackup({
      ...createBackupEnvelope(),
      cardSets: [
        createBackupCardSet({
          cards: [createBackupCard({ variant: "sideways" as never })],
        }),
      ],
    })

    expect(result).toEqual({
      isValid: false,
      code: "invalid_card_set",
      message: "Backup file contains an invalid card set at index 0.",
    })
  })

  it("counts cards across all card sets", () => {
    const backup = createBackupEnvelope({
      cardSets: [
        createBackupCardSet({
          id: "set-1",
          cards: [createBackupCard({ id: "card-1" })],
        }),
        createBackupCardSet({
          id: "set-2",
          cards: [
            createBackupCard({ id: "card-2" }),
            createBackupCard({ id: "card-3", variant: "reverse" }),
          ],
        }),
      ],
    })

    expect(getCardBackupCardCount(backup)).toBe(3)
  })
})
