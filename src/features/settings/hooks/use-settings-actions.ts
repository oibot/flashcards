import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { useAuthActions } from "@/features/auth/hooks/use-auth-actions"
import { useCardBackupActions } from "@/features/cards/backup/hooks/use-card-backup-actions"
import { useDb } from "@/features/cards/data/db-context"

export function useSettingsActions() {
  const { t } = useTranslation("settings")
  const { t: tCommon } = useTranslation("common")
  const { signOut } = useAuthActions()
  const { cardStore } = useDb()
  const { isExporting, isImporting, onExport, onImport } =
    useCardBackupActions()
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)
  const deleteCardDataInFlightRef = useRef(false)
  const [isDeletingCardData, setIsDeletingCardData] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const showErrorAlert = (message: string) => {
    Alert.alert(t("errorTitle"), message)
  }

  const onCheckHealth = async () => {
    if (
      isCheckingHealth ||
      isDeletingCardData ||
      isSigningOut ||
      isExporting ||
      isImporting
    )
      return

    setIsCheckingHealth(true)

    try {
      const requestUrl = "/api/health"
      const resolvedRequestUrl =
        typeof window !== "undefined" && window.location?.origin
          ? new URL(requestUrl, window.location.origin).toString()
          : requestUrl
      const response = await fetch(requestUrl)
      const body = await response.text()
      let responseBody = body || t("healthEmpty")

      try {
        responseBody = JSON.stringify(JSON.parse(body), null, 2)
      } catch {
        // Keep non-JSON responses readable when the endpoint fails upstream.
      }

      const message = [
        `Request URL: ${resolvedRequestUrl}`,
        `HTTP ${response.status}`,
        responseBody,
      ].join("\n\n")

      Alert.alert(t("healthResultTitle"), message)
    } catch (error) {
      showErrorAlert(error instanceof Error ? error.message : t("healthError"))
    } finally {
      setIsCheckingHealth(false)
    }
  }

  const deleteAllCardData = async () => {
    if (deleteCardDataInFlightRef.current) return

    deleteCardDataInFlightRef.current = true
    setIsDeletingCardData(true)

    try {
      const status = await cardStore.deleteAllCardData()

      if (status === "enqueued") {
        Alert.alert(
          t("deleteAllCards.pendingTitle"),
          t("deleteAllCards.pendingMessage"),
        )
        return
      }

      Alert.alert(t("successTitle"), t("deleteAllCards.success"))
    } catch {
      showErrorAlert(t("deleteAllCards.error"))
    } finally {
      deleteCardDataInFlightRef.current = false
      setIsDeletingCardData(false)
    }
  }

  const onDeleteAllCards = () => {
    if (
      isCheckingHealth ||
      isDeletingCardData ||
      isSigningOut ||
      isExporting ||
      isImporting
    )
      return

    Alert.alert(
      t("deleteAllCards.confirmTitle"),
      t("deleteAllCards.confirmMessage"),
      [
        {
          text: tCommon("cancel"),
          style: "cancel",
        },
        {
          text: t("deleteAllCards.confirm"),
          style: "destructive",
          onPress: deleteAllCardData,
        },
      ],
    )
  }

  const onSignOut = async () => {
    if (
      isSigningOut ||
      isCheckingHealth ||
      isDeletingCardData ||
      isExporting ||
      isImporting
    )
      return

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
    isDeletingCardData,
    isExporting,
    isImporting,
    isSigningOut,
    onCheckHealth,
    onDeleteAllCards,
    onExport,
    onImport,
    onSignOut,
  }
}
