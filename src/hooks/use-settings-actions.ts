import { File, Paths } from "expo-file-system"
import * as Sharing from "expo-sharing"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { useAuthActions } from "@/auth/use-auth-actions"
import { useDb } from "@/db/db-context"
import {
  getCardBackupCardCount,
  validateCardBackup,
} from "@/domain/card-backup"

function isFilePickerCancellationError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLocaleLowerCase().includes("cancel")
  )
}

export function useSettingsActions() {
  const { t } = useTranslation("common", { keyPrefix: "settings" })
  const { cardStore } = useDb()
  const { signOut } = useAuthActions()
  const [isLegacyExporting, setIsLegacyExporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const showErrorAlert = (message: string) => {
    Alert.alert(t("errorTitle"), message)
  }

  const showSuccessAlert = (message: string) => {
    Alert.alert(t("successTitle"), message)
  }

  const confirmImport = (cardCount: number) =>
    new Promise<boolean>((resolve) => {
      Alert.alert(
        t("importConfirm.title"),
        t("importConfirm.message", { count: cardCount }),
        [
          {
            text: t("importConfirm.cancel"),
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: t("importConfirm.confirm"),
            style: "default",
            onPress: () => resolve(true),
          },
        ],
        {
          cancelable: true,
          onDismiss: () => resolve(false),
        },
      )
    })

  const shareJsonFile = async (
    fileName: string,
    dialogTitle: string,
    payload: unknown,
  ) => {
    const isSharingAvailable = await Sharing.isAvailableAsync()

    if (!isSharingAvailable) {
      throw new Error(t("exportUnavailableError"))
    }

    const file = new File(Paths.cache, fileName)

    file.create({ overwrite: true })
    file.write(JSON.stringify(payload, null, 2))

    await Sharing.shareAsync(file.uri, {
      dialogTitle,
      mimeType: "application/json",
      UTI: "public.json",
    })
  }

  const onLegacyExport = async () => {
    if (isLegacyExporting || isExporting || isImporting || isSigningOut) return

    setIsLegacyExporting(true)

    try {
      const backup = await cardStore.exportLegacyCards()
      const fileName = `flashcards-legacy-export-${backup.exportedAt.slice(0, 10)}.json`

      await shareJsonFile(fileName, t("legacyExportDialogTitle"), backup)
    } catch (error) {
      showErrorAlert(
        error instanceof Error ? error.message : t("legacyExportError"),
      )
    } finally {
      setIsLegacyExporting(false)
    }
  }

  const onExport = async () => {
    if (isLegacyExporting || isExporting || isImporting || isSigningOut) return

    setIsExporting(true)

    try {
      const backup = await cardStore.exportCards()
      const fileName = `flashcards-export-${backup.exportedAt.slice(0, 10)}.json`

      await shareJsonFile(fileName, t("exportDialogTitle"), backup)
    } catch (error) {
      showErrorAlert(error instanceof Error ? error.message : t("exportError"))
    } finally {
      setIsExporting(false)
    }
  }

  const onImport = async () => {
    if (isLegacyExporting || isImporting || isExporting || isSigningOut) return

    setIsImporting(true)

    try {
      const selectedFile = await File.pickFileAsync(
        undefined,
        "application/json",
      )
      const file = Array.isArray(selectedFile) ? selectedFile[0] : selectedFile
      const fileContents = await file.text()
      let parsedBackup: unknown

      try {
        parsedBackup = JSON.parse(fileContents) as unknown
      } catch {
        throw new Error(t("invalidBackupError"))
      }

      const validationResult = validateCardBackup(parsedBackup)

      if (!validationResult.isValid) {
        throw new Error(validationResult.message)
      }

      const cardCount = getCardBackupCardCount(validationResult.backup)

      const shouldImport = await confirmImport(cardCount)

      if (!shouldImport) {
        return
      }

      await cardStore.importCards(validationResult.backup)
      showSuccessAlert(t("importSuccess", { count: cardCount }))
    } catch (error) {
      if (isFilePickerCancellationError(error)) {
        return
      }

      showErrorAlert(error instanceof Error ? error.message : t("importError"))
    } finally {
      setIsImporting(false)
    }
  }

  const onSignOut = async () => {
    if (isSigningOut || isLegacyExporting || isExporting || isImporting) return

    setIsSigningOut(true)

    try {
      await signOut()
    } catch (error) {
      showErrorAlert(error instanceof Error ? error.message : t("signOutError"))
    } finally {
      setIsSigningOut(false)
    }
  }

  return {
    isLegacyExporting,
    isExporting,
    isImporting,
    isSigningOut,
    onLegacyExport,
    onExport,
    onImport,
    onSignOut,
  }
}
