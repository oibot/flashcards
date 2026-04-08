import { File, Paths } from "expo-file-system"
import * as Sharing from "expo-sharing"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useAuthActions } from "@/auth/use-auth-actions"
import SettingsScene from "@/components/settings/settings-scene"
import { useDb } from "@/db/db-context"

export default function Page() {
  const { t } = useTranslation("common", { keyPrefix: "settings" })
  const { cardStore } = useDb()
  const { signOut } = useAuthActions()
  const [isExporting, setIsExporting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleExport = async () => {
    if (isExporting || isSigningOut) return

    setErrorMessage(null)
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
      setErrorMessage(error instanceof Error ? error.message : t("exportError"))
    } finally {
      setIsExporting(false)
    }
  }

  const handleSignOut = async () => {
    if (isSigningOut || isExporting) return

    setErrorMessage(null)
    setIsSigningOut(true)

    try {
      await signOut()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("signOutError"),
      )
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <SettingsScene
      errorMessage={errorMessage}
      isExporting={isExporting}
      isSigningOut={isSigningOut}
      onExport={handleExport}
      onSignOut={handleSignOut}
    />
  )
}
