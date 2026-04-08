import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Pressable, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

type SettingsSceneProps = {
  errorMessage: string | null
  isExporting: boolean
  isSigningOut: boolean
  onExport: () => void
  onSignOut: () => void
}

export default function SettingsScene({
  errorMessage,
  isExporting,
  isSigningOut,
  onExport,
  onSignOut,
}: SettingsSceneProps) {
  const { theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "settings" })

  return (
    <>
      <Stack.Screen options={{ title: t("title") }} />
      <View style={styles.content}>
        <Pressable
          accessibilityLabel={t("exportAccessibilityLabel")}
          accessibilityRole="button"
          disabled={isExporting || isSigningOut}
          onPress={onExport}
          style={[
            styles.button,
            styles.exportButton,
            isExporting || isSigningOut ? styles.buttonDisabled : null,
          ]}
        >
          {isExporting ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.buttonLabel}>{t("export")}</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityLabel={t("signOutAccessibilityLabel")}
          accessibilityRole="button"
          disabled={isSigningOut || isExporting}
          onPress={onSignOut}
          style={[
            styles.button,
            styles.signOutButton,
            isSigningOut || isExporting ? styles.buttonDisabled : null,
          ]}
        >
          {isSigningOut ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.buttonLabel}>{t("signOut")}</Text>
          )}
        </Pressable>
        {errorMessage ? (
          <Text selectable style={styles.error}>
            {errorMessage}
          </Text>
        ) : null}
      </View>
    </>
  )
}

const styles = StyleSheet.create((theme) => ({
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
    backgroundColor: theme.colors.background,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    minWidth: 220,
  },
  exportButton: {
    backgroundColor: theme.colors.accent,
  },
  signOutButton: {
    backgroundColor: theme.colors.destructive,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonLabel: {
    ...theme.typography.styles.headline,
    color: theme.colors.background,
  },
  error: {
    ...theme.typography.styles.footnote,
    color: theme.colors.destructive,
    textAlign: "center",
  },
}))
