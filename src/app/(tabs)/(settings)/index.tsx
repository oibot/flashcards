import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useAuthActions } from "@/auth/use-auth-actions"
import SettingsScene from "@/components/settings/settings-scene"

export default function Page() {
  const { t } = useTranslation("common", { keyPrefix: "settings" })
  const { signOut } = useAuthActions()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSignOut = async () => {
    if (isSigningOut) return

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
      isSigningOut={isSigningOut}
      onSignOut={handleSignOut}
    />
  )
}
