import { Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { TextInputProps } from "react-native"
import { Pressable, Text, TextInput, View } from "react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { StyleSheet } from "react-native-unistyles"

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
  const { t } = useTranslation("common", { keyPrefix: "auth" })
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [hasRequestedCode, setHasRequestedCode] = useState(false)

  const isRequestDisabled = email.trim().length === 0
  const requestFeedback = hasRequestedCode
    ? t("requestSent", { email: email.trim() })
    : null

  const handleRequestMagicCode = () => {
    if (isRequestDisabled) {
      return
    }

    setHasRequestedCode(true)
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
                {t("requestMagicCode")}
              </Text>
            </Pressable>
            {requestFeedback ? (
              <Text style={styles.feedback}>{requestFeedback}</Text>
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
  feedback: {
    ...theme.typography.styles.footnote,
    color: theme.colors.secondary,
  },
}))
