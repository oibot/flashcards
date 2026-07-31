const mockDeleteAllCardData = jest.fn()
const mockSignOut = jest.fn()

jest.mock("react-i18next", () => ({
  useTranslation: (namespace: string) => ({
    t: (key: string) =>
      namespace === "common" && key === "cancel" ? "Cancel" : key,
  }),
}))

jest.mock("@/features/auth/hooks/use-auth-actions", () => ({
  useAuthActions: () => ({ signOut: mockSignOut }),
}))

jest.mock("@/features/cards/backup/hooks/use-card-backup-actions", () => ({
  useCardBackupActions: () => ({
    isExporting: false,
    isImporting: false,
    onExport: jest.fn(),
    onImport: jest.fn(),
  }),
}))

jest.mock("@/features/cards/data/db-context", () => ({
  useDb: () => ({
    cardStore: {
      deleteAllCardData: mockDeleteAllCardData,
    },
  }),
}))

import { act, renderHook } from "@testing-library/react-native"
import { Alert } from "react-native"

import { useSettingsActions } from "@/features/settings/hooks/use-settings-actions"

describe("useSettingsActions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDeleteAllCardData.mockResolvedValue("synced")
  })

  it("requires destructive confirmation before deleting all card data", async () => {
    const alertSpy = jest.spyOn(Alert, "alert")
    const { result } = renderHook(() => useSettingsActions())

    act(() => result.current.onDeleteAllCards())

    expect(mockDeleteAllCardData).not.toHaveBeenCalled()
    expect(alertSpy).toHaveBeenCalledWith(
      "deleteAllCards.confirmTitle",
      "deleteAllCards.confirmMessage",
      [
        { text: "Cancel", style: "cancel" },
        expect.objectContaining({
          text: "deleteAllCards.confirm",
          style: "destructive",
        }),
      ],
    )

    const confirmationButtons = alertSpy.mock.calls[0][2]
    const destructiveButton = confirmationButtons?.[1]

    await act(async () => {
      await destructiveButton?.onPress?.()
    })

    expect(mockDeleteAllCardData).toHaveBeenCalledTimes(1)
    expect(alertSpy).toHaveBeenLastCalledWith(
      "successTitle",
      "deleteAllCards.success",
    )
  })

  it("reports when deletion is queued instead of server-confirmed", async () => {
    mockDeleteAllCardData.mockResolvedValue("enqueued")
    const alertSpy = jest.spyOn(Alert, "alert")
    const { result } = renderHook(() => useSettingsActions())

    act(() => result.current.onDeleteAllCards())
    const destructiveButton = alertSpy.mock.calls[0][2]?.[1]

    await act(async () => {
      await destructiveButton?.onPress?.()
    })

    expect(alertSpy).toHaveBeenLastCalledWith(
      "deleteAllCards.pendingTitle",
      "deleteAllCards.pendingMessage",
    )
  })

  it("shows a localized error when deleting card data fails", async () => {
    mockDeleteAllCardData.mockRejectedValue(new Error("Delete failed."))
    const alertSpy = jest.spyOn(Alert, "alert")
    const { result } = renderHook(() => useSettingsActions())

    act(() => result.current.onDeleteAllCards())
    const destructiveButton = alertSpy.mock.calls[0][2]?.[1]

    await act(async () => {
      await destructiveButton?.onPress?.()
    })

    expect(alertSpy).toHaveBeenLastCalledWith(
      "errorTitle",
      "deleteAllCards.error",
    )
  })
})
