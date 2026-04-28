import { Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { StyleSheet } from "react-native-unistyles"

import AuthCodeStep from "@/features/auth/auth-code-step"
import AuthEmailStep from "@/features/auth/auth-email-step"
import { useAuthActions } from "@/features/auth/use-auth-actions"

export default function AuthScene() {
  const { t } = useTranslation("common", { keyPrefix: "auth" })
  const { requestCode, signInWithCode } = useAuthActions()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [sentEmail, setSentEmail] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const trimmedEmail = email.trim()
  const trimmedCode = code.trim()

  const handleRequestMagicCode = async () => {
    if (trimmedEmail.length === 0 || isSendingCode) return

    setErrorMessage(null)
    setIsSendingCode(true)

    try {
      await requestCode({ email: trimmedEmail })
      setSentEmail(trimmedEmail)
      setCode("")
    } catch (error: unknown) {
      setSentEmail("")
      setErrorMessage(
        error instanceof Error ? error.message : t("requestCodeError"),
      )
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleSignIn = async () => {
    if (sentEmail.length === 0 || trimmedCode.length === 0 || isSigningIn)
      return

    setErrorMessage(null)
    setIsSigningIn(true)

    try {
      await signInWithCode({ email: sentEmail, code: trimmedCode })
    } catch (error: unknown) {
      setCode("")
      setErrorMessage(error instanceof Error ? error.message : t("signInError"))
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleUseDifferentEmail = () => {
    setSentEmail("")
    setCode("")
    setErrorMessage(null)
  }

  return (
    <>
      <Stack.Screen options={{ title: t("title") }} />
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>{t("title")}</Text>
          <View style={styles.card}>
            {!sentEmail ? (
              <AuthEmailStep
                email={email}
                isSendingCode={isSendingCode}
                onChangeEmail={setEmail}
                onRequestCode={() => {
                  void handleRequestMagicCode()
                }}
              />
            ) : (
              <AuthCodeStep
                code={code}
                isSigningIn={isSigningIn}
                sentEmail={sentEmail}
                onChangeCode={setCode}
                onSignIn={() => {
                  void handleSignIn()
                }}
                onUseDifferentEmail={handleUseDifferentEmail}
              />
            )}
            {errorMessage ? (
              <Text selectable style={styles.error}>
                {errorMessage}
              </Text>
            ) : null}
          </View>
        </View>
      </KeyboardAwareScrollView>
    </>
  )
}

const styles = StyleSheet.create((theme, rt) => ({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: Math.max(rt.insets.bottom, 24) + 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 28,
  },
  title: {
    ...theme.typography.styles.title2,
    color: theme.colors.primary,
  },
  card: {
    gap: 18,
    padding: 20,
    borderRadius: 24,
    borderCurve: "continuous",
    backgroundColor: theme.colors.secondaryBackground,
    boxShadow: `0 12px 32px ${theme.colors.shadowSoft}`,
  },
  error: {
    ...theme.typography.styles.footnote,
    color: theme.colors.destructive,
  },
}))
