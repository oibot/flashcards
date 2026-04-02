import { useTranslation } from "react-i18next"
import { ActivityIndicator, Pressable, Text } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import AuthField from "@/components/auth/auth-field"

type AuthCodeStepProps = {
  code: string
  isSigningIn: boolean
  sentEmail: string
  onChangeCode: (code: string) => void
  onSignIn: () => void
  onUseDifferentEmail: () => void
}

export default function AuthCodeStep({
  code,
  isSigningIn,
  sentEmail,
  onChangeCode,
  onSignIn,
  onUseDifferentEmail,
}: AuthCodeStepProps) {
  const { theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "auth" })
  const isSignInDisabled =
    sentEmail.length === 0 || code.trim().length === 0 || isSigningIn

  return (
    <>
      <Text style={styles.stepTitle}>{t("codeStepTitle")}</Text>
      <Text selectable style={styles.feedback}>
        {t("requestSent", { email: sentEmail })}
      </Text>
      <AuthField
        autoCapitalize="characters"
        autoComplete="one-time-code"
        autoCorrect={false}
        keyboardType="number-pad"
        label={t("codeLabel")}
        maxLength={6}
        onChangeText={onChangeCode}
        placeholder={t("codePlaceholder")}
        style={styles.input}
        textContentType="oneTimeCode"
        value={code}
      />
      <Pressable
        accessibilityLabel={t("signInAccessibilityLabel")}
        accessibilityRole="button"
        disabled={isSignInDisabled}
        onPress={onSignIn}
        style={[styles.button, isSignInDisabled ? styles.buttonDisabled : null]}
      >
        {isSigningIn ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Text
            style={[
              styles.buttonLabel,
              isSignInDisabled ? styles.buttonLabelDisabled : null,
            ]}
          >
            {t("signInButton")}
          </Text>
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onUseDifferentEmail}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonLabel}>
          {t("useDifferentEmail")}
        </Text>
      </Pressable>
    </>
  )
}

const styles = StyleSheet.create((theme) => ({
  stepTitle: {
    ...theme.typography.styles.headline,
    color: theme.colors.primary,
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
  secondaryButtonLabel: {
    ...theme.typography.styles.headline,
    color: theme.colors.accent,
  },
  feedback: {
    ...theme.typography.styles.footnote,
    color: theme.colors.secondary,
  },
}))
