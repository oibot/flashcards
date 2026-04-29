import { File, Paths } from "expo-file-system"
import * as Sharing from "expo-sharing"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import {
  createCardBackupFileName,
  parseCardBackupImport,
} from "@/features/cards/backup/lib/card-backup-transfer"
import { useDb } from "@/features/cards/data/db-context"

function isFilePickerCancellationError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLocaleLowerCase().includes("cancel")
  )
}

export function useCardBackupActions() {
  const { t } = useTranslation("common", { keyPrefix: "settings" })
  const { cardStore } = useDb()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

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

  const onExport = async () => {
    if (isExporting || isImporting) return

    setIsExporting(true)

    try {
      const backup = await cardStore.exportCards()
      const fileName = createCardBackupFileName(backup.exportedAt)

      await shareJsonFile(fileName, t("exportDialogTitle"), backup)
    } catch (error) {
      showErrorAlert(error instanceof Error ? error.message : t("exportError"))
    } finally {
      setIsExporting(false)
    }
  }

  const onImport = async () => {
    if (isImporting || isExporting) return

    setIsImporting(true)

    try {
      const selectedFile = await File.pickFileAsync(
        undefined,
        "application/json",
      )
      const file = Array.isArray(selectedFile) ? selectedFile[0] : selectedFile
      const fileContents = await file.text()
      const { backup, cardCount } = parseCardBackupImport(
        fileContents,
        t("invalidBackupError"),
      )
      const shouldImport = await confirmImport(cardCount)

      if (!shouldImport) {
        return
      }

      await cardStore.importCards(backup)
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

  return {
    isExporting,
    isImporting,
    onExport,
    onImport,
  }
}
