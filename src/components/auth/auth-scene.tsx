import { Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { TextInputProps } from "react-native"
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import { useAuthActions } from "@/auth/use-auth-actions"

type AuthFieldProps = {
  label: string
} & TextInputProps

function AuthField({ label, ...props }: AuthFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={styles.placeholder.color} {...props} />
    </View>
  )
}

export default function AuthScene() {
  const { theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "auth" })
  const { requestCode, signInWithCode } = useAuthActions()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [sentEmail, setSentEmail] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const trimmedEmail = email.trim()
  const trimmedCode = code.trim()
  const isRequestDisabled =
    trimmedEmail.length === 0 || isSendingCode || isSigningIn
  const isSignInDisabled =
    trimmedEmail.length === 0 ||
    trimmedCode.length === 0 ||
    isSendingCode ||
    isSigningIn

  const handleRequestMagicCode = () => {
    if (isRequestDisabled) return

    setErrorMessage(null)
    setStatusMessage(null)
    setIsSendingCode(true)

    requestCode({ email: trimmedEmail })
      .then(() => {
        setSentEmail(trimmedEmail)
        setStatusMessage(t("requestSent", { email: trimmedEmail }))
      })
      .catch((error: unknown) => {
        setSentEmail("")
        setStatusMessage(null)
        setErrorMessage(
          error instanceof Error ? error.message : t("requestCodeError"),
        )
      })
      .finally(() => {
        setIsSendingCode(false)
      })
  }

  const handleSignIn = () => {
    if (isSignInDisabled) return

    setErrorMessage(null)
    setStatusMessage(null)
    setIsSigningIn(true)

    signInWithCode({ email: trimmedEmail, code: trimmedCode })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error ? error.message : t("signInError"),
        )
      })
      .finally(() => {
        setIsSigningIn(false)
      })
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
            <AuthField
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              label={t("emailLabel")}
              onChangeText={setEmail}
              placeholder={t("emailPlaceholder")}
              style={styles.input}
              textContentType="emailAddress"
              value={email}
            />
            <AuthField
              autoCapitalize="characters"
              autoComplete="one-time-code"
              autoCorrect={false}
              keyboardType="number-pad"
              label={t("codeLabel")}
              maxLength={6}
              onChangeText={setCode}
              placeholder={t("codePlaceholder")}
              style={styles.input}
              textContentType="oneTimeCode"
              value={code}
            />
            <Pressable
              accessibilityLabel={t("requestMagicCodeAccessibilityLabel")}
              accessibilityRole="button"
              disabled={isRequestDisabled}
              onPress={handleRequestMagicCode}
              style={[
                styles.button,
                isRequestDisabled ? styles.buttonDisabled : null,
              ]}
            >
              <Text
                style={[
                  styles.buttonLabel,
                  isRequestDisabled ? styles.buttonLabelDisabled : null,
                ]}
              >
                {isSendingCode ? t("requestingCode") : t("requestMagicCode")}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel={t("signInAccessibilityLabel")}
              accessibilityRole="button"
              disabled={isSignInDisabled}
              onPress={handleSignIn}
              style={[
                styles.secondaryButton,
                isSignInDisabled ? styles.secondaryButtonDisabled : null,
              ]}
            >
              {isSigningIn ? (
                <ActivityIndicator color={theme.colors.accent} />
              ) : (
                <Text
                  style={[
                    styles.secondaryButtonLabel,
                    isSignInDisabled
                      ? styles.secondaryButtonLabelDisabled
                      : null,
                  ]}
                >
                  {t("signInButton")}
                </Text>
              )}
            </Pressable>
            {statusMessage ? (
              <Text selectable style={styles.feedback}>
                {statusMessage}
              </Text>
            ) : null}
            {errorMessage ? (
              <Text selectable style={styles.error}>
                {errorMessage}
              </Text>
            ) : null}
            {sentEmail && !statusMessage && !errorMessage ? (
              <Text selectable style={styles.feedback}>
                {t("requestSent", { email: sentEmail })}
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
  field: {
    gap: 8,
  },
  label: {
    ...theme.typography.styles.footnote,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  input: {
    minHeight: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.chromeMuted,
    borderRadius: 16,
    borderCurve: "continuous",
    backgroundColor: theme.colors.background,
    color: theme.colors.primary,
    ...theme.typography.styles.body,
  },
  placeholder: {
    color: theme.colors.secondary,
  },
  button: {
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.chromeMuted,
  },
  buttonLabel: {
    ...theme.typography.styles.headline,
    color: theme.colors.background,
  },
  buttonLabelDisabled: {
    color: theme.colors.primary,
  },
  secondaryButton: {
    minHeight: 54,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  secondaryButtonDisabled: {
    borderColor: theme.colors.chromeMuted,
    backgroundColor: theme.colors.secondaryBackground,
  },
  secondaryButtonLabel: {
    ...theme.typography.styles.headline,
    color: theme.colors.accent,
  },
  secondaryButtonLabelDisabled: {
    color: theme.colors.secondary,
  },
  feedback: {
    ...theme.typography.styles.footnote,
    color: theme.colors.secondary,
  },
  error: {
    ...theme.typography.styles.footnote,
    color: theme.colors.destructive,
  },
}))
