import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { useAuthActions } from "@/features/auth/hooks/use-auth-actions"
import { useCardBackupActions } from "@/features/cards/backup/hooks/use-card-backup-actions"

export function useSettingsActions() {
  const { t } = useTranslation("common", { keyPrefix: "settings" })
  const { signOut } = useAuthActions()
  const { isExporting, isImporting, onExport, onImport } =
    useCardBackupActions()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const showErrorAlert = (message: string) => {
    Alert.alert(t("errorTitle"), message)
  }

  const onSignOut = async () => {
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

  return {
    isExporting,
    isImporting,
    isSigningOut,
    onExport,
    onImport,
    onSignOut,
  }
}
