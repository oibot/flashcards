const mockUseDb = jest.fn()
const mockPickFileAsync = jest.fn()
const mockFileConstructor = jest.fn()
const mockFileCreate = jest.fn()
const mockFileWrite = jest.fn()
const mockIsAvailableAsync = jest.fn()
const mockShareAsync = jest.fn()

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      if (key === "errorTitle") {
        return "Error"
      }

      if (key === "successTitle") {
        return "Success"
      }

      if (key === "exportDialogTitle") {
        return "Export flashcards"
      }

      if (key === "exportUnavailableError") {
        return "Export is not available on this device."
      }

      if (key === "invalidBackupError") {
        return "This file is not a valid flashcards backup."
      }

      if (key === "importConfirm.title") {
        return "Import backup?"
      }

      if (key === "importConfirm.message") {
        return `Import ${options?.count ?? 0} cards from this backup?`
      }

      if (key === "importConfirm.cancel") {
        return "Cancel"
      }

      if (key === "importConfirm.confirm") {
        return "Import"
      }

      if (key === "importSuccess") {
        return `Imported ${options?.count ?? 0} cards.`
      }

      if (key === "exportError") {
        return "Export failed."
      }

      if (key === "importError") {
        return "Import failed."
      }

      return key
    },
  }),
}))

jest.mock("expo-file-system", () => {
  class MockFile {
    static pickFileAsync = (...args: unknown[]) => mockPickFileAsync(...args)

    uri: string

    constructor(directory: string, name: string) {
      mockFileConstructor(directory, name)
      this.uri = `${directory}/${name}`
    }

    create(...args: unknown[]) {
      return mockFileCreate(...args)
    }

    write(...args: unknown[]) {
      return mockFileWrite(...args)
    }
  }

  return {
    File: MockFile,
    Paths: {
      cache: "/cache",
    },
  }
})

jest.mock("expo-sharing", () => ({
  isAvailableAsync: (...args: unknown[]) => mockIsAvailableAsync(...args),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}))

jest.mock("@/features/cards/data/db-context", () => ({
  useDb: () => mockUseDb(),
}))

import { act, renderHook } from "@testing-library/react-native"
import { Alert } from "react-native"

import { useCardBackupActions } from "@/features/cards/backup/hooks/use-card-backup-actions"
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

describe("useCardBackupActions", () => {
  const cardStore = {
    exportCards: jest.fn(),
    importCards: jest.fn(),
  }
  let alertBehavior: "none" | "confirm" | "dismiss" = "none"
  let alertSpy: jest.SpiedFunction<typeof Alert.alert>

  beforeEach(() => {
    jest.clearAllMocks()
    alertBehavior = "none"
    mockUseDb.mockReturnValue({ cardStore })
    mockIsAvailableAsync.mockResolvedValue(true)
    mockShareAsync.mockResolvedValue(undefined)
    cardStore.exportCards.mockResolvedValue(createBackupEnvelope())
    cardStore.importCards.mockResolvedValue(undefined)
    alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons, options) => {
        if (alertBehavior === "confirm") {
          buttons?.[1]?.onPress?.()
        }

        if (alertBehavior === "dismiss") {
          options?.onDismiss?.()
        }
      })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("exports cards to a dated json file and opens the share flow", async () => {
    const backup = createBackupEnvelope()
    cardStore.exportCards.mockResolvedValue(backup)

    const { result } = renderHook(() => useCardBackupActions())

    await act(async () => {
      await result.current.onExport()
    })

    expect(cardStore.exportCards).toHaveBeenCalledTimes(1)
    expect(mockFileConstructor).toHaveBeenCalledWith(
      "/cache",
      "flashcards-export-2026-04-29.json",
    )
    expect(mockFileCreate).toHaveBeenCalledWith({ overwrite: true })
    expect(mockFileWrite).toHaveBeenCalledWith(JSON.stringify(backup, null, 2))
    expect(mockShareAsync).toHaveBeenCalledWith(
      "/cache/flashcards-export-2026-04-29.json",
      {
        dialogTitle: "Export flashcards",
        mimeType: "application/json",
        UTI: "public.json",
      },
    )
    expect(result.current.isExporting).toBe(false)
    expect(alertSpy).not.toHaveBeenCalled()
  })

  it("shows an error when sharing is unavailable", async () => {
    mockIsAvailableAsync.mockResolvedValue(false)
    const { result } = renderHook(() => useCardBackupActions())

    await act(async () => {
      await result.current.onExport()
    })

    expect(mockFileConstructor).not.toHaveBeenCalled()
    expect(mockShareAsync).not.toHaveBeenCalled()
    expect(alertSpy).toHaveBeenCalledWith(
      "Error",
      "Export is not available on this device.",
    )
    expect(result.current.isExporting).toBe(false)
  })

  it("shows the thrown export failure without leaving stale exporting state", async () => {
    cardStore.exportCards.mockRejectedValue(new Error("Export crashed."))
    const { result } = renderHook(() => useCardBackupActions())

    await act(async () => {
      await result.current.onExport()
    })

    expect(alertSpy).toHaveBeenCalledWith("Error", "Export crashed.")
    expect(mockShareAsync).not.toHaveBeenCalled()
    expect(result.current.isExporting).toBe(false)
  })

  it("ignores file picker cancellation without importing or alerting", async () => {
    mockPickFileAsync.mockRejectedValue(new Error("User canceled the picker"))
    const { result } = renderHook(() => useCardBackupActions())

    await act(async () => {
      await result.current.onImport()
    })

    expect(mockPickFileAsync).toHaveBeenCalledWith(
      undefined,
      "application/json",
    )
    expect(cardStore.importCards).not.toHaveBeenCalled()
    expect(alertSpy).not.toHaveBeenCalled()
    expect(result.current.isImporting).toBe(false)
  })

  it("shows the invalid-backup message for malformed json", async () => {
    mockPickFileAsync.mockResolvedValue({
      text: jest.fn().mockResolvedValue("{"),
    })
    const { result } = renderHook(() => useCardBackupActions())

    await act(async () => {
      await result.current.onImport()
    })

    expect(cardStore.importCards).not.toHaveBeenCalled()
    expect(alertSpy).toHaveBeenCalledWith(
      "Error",
      "This file is not a valid flashcards backup.",
    )
    expect(result.current.isImporting).toBe(false)
  })

  it("shows the validation failure for structurally invalid backup data", async () => {
    mockPickFileAsync.mockResolvedValue({
      text: jest.fn().mockResolvedValue(
        JSON.stringify({
          ...createBackupEnvelope(),
          app: "other-app",
        }),
      ),
    })
    const { result } = renderHook(() => useCardBackupActions())

    await act(async () => {
      await result.current.onImport()
    })

    expect(cardStore.importCards).not.toHaveBeenCalled()
    expect(alertSpy).toHaveBeenCalledWith(
      "Error",
      "Backup file is not a flashcards export.",
    )
    expect(result.current.isImporting).toBe(false)
  })

  it("stops after the user dismisses import confirmation", async () => {
    alertBehavior = "dismiss"
    mockPickFileAsync.mockResolvedValue({
      text: jest.fn().mockResolvedValue(JSON.stringify(createBackupEnvelope())),
    })
    const { result } = renderHook(() => useCardBackupActions())

    await act(async () => {
      await result.current.onImport()
    })

    expect(cardStore.importCards).not.toHaveBeenCalled()
    expect(alertSpy).toHaveBeenCalledTimes(1)
    expect(alertSpy.mock.calls[0]?.[0]).toBe("Import backup?")
    expect(alertSpy.mock.calls[0]?.[1]).toBe("Import 2 cards from this backup?")
    expect(result.current.isImporting).toBe(false)
  })

  it("confirms valid imports and shows a success alert", async () => {
    alertBehavior = "confirm"
    const backup = createBackupEnvelope()
    mockPickFileAsync.mockResolvedValue({
      text: jest.fn().mockResolvedValue(JSON.stringify(backup)),
    })
    const { result } = renderHook(() => useCardBackupActions())

    await act(async () => {
      await result.current.onImport()
    })

    expect(cardStore.importCards).toHaveBeenCalledWith(backup)
    expect(alertSpy.mock.calls[0]?.[0]).toBe("Import backup?")
    expect(alertSpy.mock.calls[0]?.[1]).toBe("Import 2 cards from this backup?")
    expect(alertSpy.mock.calls[1]).toEqual(["Success", "Imported 2 cards."])
    expect(result.current.isImporting).toBe(false)
  })
})
