import { useTranslation } from "react-i18next"
import { Pressable, Text } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import AuthField from "@/features/auth/auth-field"

type AuthEmailStepProps = {
  email: string
  isSendingCode: boolean
  onChangeEmail: (email: string) => void
  onRequestCode: () => void
}

export default function AuthEmailStep({
  email,
  isSendingCode,
  onChangeEmail,
  onRequestCode,
}: AuthEmailStepProps) {
  const { t } = useTranslation("common", { keyPrefix: "auth" })
  const isRequestDisabled = email.trim().length === 0 || isSendingCode

  return (
    <>
      <Text style={styles.stepTitle}>{t("emailStepTitle")}</Text>
      <Text selectable style={styles.feedback}>
        {t("emailStepDescription")}
      </Text>
      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        label={t("emailLabel")}
        onChangeText={onChangeEmail}
        placeholder={t("emailPlaceholder")}
        style={styles.input}
        textContentType="emailAddress"
        value={email}
      />
      <Pressable
        accessibilityLabel={t("requestMagicCodeAccessibilityLabel")}
        accessibilityRole="button"
        disabled={isRequestDisabled}
        onPress={onRequestCode}
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
  feedback: {
    ...theme.typography.styles.footnote,
    color: theme.colors.secondary,
  },
}))
