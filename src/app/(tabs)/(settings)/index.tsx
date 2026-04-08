import { File, Paths } from "expo-file-system"
import * as Sharing from "expo-sharing"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { useAuthActions } from "@/auth/use-auth-actions"
import SettingsScene from "@/components/settings/settings-scene"
import { useDb } from "@/db/db-context"
import { validateCardBackup } from "@/domain/card-backup"

function isFilePickerCancellationError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLocaleLowerCase().includes("cancel")
  )
}

export default function Page() {
  const { t } = useTranslation("common", { keyPrefix: "settings" })
  const { cardStore } = useDb()
  const { signOut } = useAuthActions()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const showErrorAlert = (message: string) => {
    Alert.alert(t("errorTitle"), message)
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

  const handleExport = async () => {
    if (isExporting || isImporting || isSigningOut) return

    setIsExporting(true)

    try {
      const isSharingAvailable = await Sharing.isAvailableAsync()

      if (!isSharingAvailable) {
        throw new Error(t("exportUnavailableError"))
      }

      const backup = await cardStore.exportCards()
      const fileName = `flashcards-export-${backup.exportedAt.slice(0, 10)}.json`
      const file = new File(Paths.cache, fileName)

      file.create({ overwrite: true })
      file.write(JSON.stringify(backup, null, 2))

      await Sharing.shareAsync(file.uri, {
        dialogTitle: t("exportDialogTitle"),
        mimeType: "application/json",
        UTI: "public.json",
      })
    } catch (error) {
      showErrorAlert(error instanceof Error ? error.message : t("exportError"))
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async () => {
    if (isImporting || isExporting || isSigningOut) return

    setIsImporting(true)

    try {
      const selectedFile = await File.pickFileAsync(
        undefined,
        "application/json",
      )
      const file = Array.isArray(selectedFile) ? selectedFile[0] : selectedFile
      const fileContents = await file.text()
      const parsedBackup = JSON.parse(fileContents) as unknown
      const validationResult = validateCardBackup(parsedBackup)

      if (!validationResult.isValid) {
        throw new Error(validationResult.message)
      }

      const shouldImport = await confirmImport(
        validationResult.backup.cards.length,
      )

      if (!shouldImport) {
        return
      }

      await cardStore.importCards(validationResult.backup)
    } catch (error) {
      if (isFilePickerCancellationError(error)) {
        return
      }

      showErrorAlert(error instanceof Error ? error.message : t("importError"))
    } finally {
      setIsImporting(false)
    }
  }

  const handleSignOut = async () => {
    if (isSigningOut || isExporting || isImporting) return

    setIsSigningOut(true)

    try {
      await signOut()
    } catch (error) {
      showErrorAlert(error instanceof Error ? error.message : t("signOutError"))
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <SettingsScene
      isExporting={isExporting}
      isImporting={isImporting}
      isSigningOut={isSigningOut}
      onExport={handleExport}
      onImport={handleImport}
      onSignOut={handleSignOut}
    />
  )
}
