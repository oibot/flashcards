import {
  createCardBackupFileName,
  parseCardBackupImport,
} from "@/features/cards/backup/lib/card-backup-transfer"
import {
  CARD_BACKUP_APP,
  type CardBackupEnvelope,
} from "@/features/cards/backup/model/card-backup"

function createBackupEnvelope(): CardBackupEnvelope {
  return {
    app: CARD_BACKUP_APP,
    exportedAt: "2026-04-29T12:00:00.000Z",
    cardSets: [
      {
        id: "set-1",
        tags: ["German"],
        sideAHtml: "<p>Hallo</p>",
        sideBHtml: "<p>Hello</p>",
        createdAt: 1,
        updatedAt: 2,
        cards: [
          {
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
          },
          {
            id: "card-2",
            variant: "reverse",
            createdAt: 1,
            updatedAt: 2,
            dueAt: 3,
            lastReviewedAt: 4,
            intervalDays: 5,
            easeFactor: 2.5,
            repetition: 1,
            lapses: 0,
            state: "new",
          },
        ],
      },
    ],
  }
}

describe("card backup transfer helpers", () => {
  it("derives the export file name from the export date", () => {
    expect(createCardBackupFileName("2026-04-29T12:00:00.000Z")).toBe(
      "flashcards-export-2026-04-29.json",
    )
  })

  it("parses validated backup content and derives the card count", () => {
    const backup = createBackupEnvelope()

    expect(
      parseCardBackupImport(
        JSON.stringify(backup),
        "This file is not a valid flashcards backup.",
      ),
    ).toEqual({
      backup,
      cardCount: 2,
    })
  })

  it("throws the fallback invalid-backup message for malformed json", () => {
    expect(() =>
      parseCardBackupImport("{", "This file is not a valid flashcards backup."),
    ).toThrow("This file is not a valid flashcards backup.")
  })

  it("throws the validation message for structurally invalid backup data", () => {
    expect(() =>
      parseCardBackupImport(
        JSON.stringify({
          ...createBackupEnvelope(),
          app: "other-app",
        }),
        "This file is not a valid flashcards backup.",
      ),
    ).toThrow("Backup file is not a flashcards export.")
  })
})
