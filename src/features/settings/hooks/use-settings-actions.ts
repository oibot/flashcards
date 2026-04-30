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
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const showErrorAlert = (message: string) => {
    Alert.alert(t("errorTitle"), message)
  }

  const onCheckHealth = async () => {
    if (isCheckingHealth || isSigningOut || isExporting || isImporting) return

    setIsCheckingHealth(true)

    try {
      const response = await fetch("/api/health")
      const body = await response.text()
      let responseBody = body || t("healthEmpty")

      try {
        responseBody = JSON.stringify(JSON.parse(body), null, 2)
      } catch {
        // Keep non-JSON responses readable when the endpoint fails upstream.
      }

      const message = [`HTTP ${response.status}`, responseBody].join("\n\n")

      Alert.alert(t("healthResultTitle"), message)
    } catch (error) {
      showErrorAlert(error instanceof Error ? error.message : t("healthError"))
    } finally {
      setIsCheckingHealth(false)
    }
  }

  const onSignOut = async () => {
    if (isSigningOut || isCheckingHealth || isExporting || isImporting) return

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
    isCheckingHealth,
    isExporting,
    isImporting,
    isSigningOut,
    onCheckHealth,
    onExport,
    onImport,
    onSignOut,
  }
}
