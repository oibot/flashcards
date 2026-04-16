import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Pressable, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import { useSettingsActions } from "@/hooks/use-settings-actions"

export default function SettingsScene() {
  const { theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "settings" })
  const {
    isLegacyExporting,
    isExporting,
    isImporting,
    isSigningOut,
    onLegacyExport,
    onExport,
    onImport,
    onSignOut,
  } = useSettingsActions()
  const isBusy = isLegacyExporting || isExporting || isImporting || isSigningOut

  return (
    <>
      <Stack.Screen options={{ title: t("title") }} />
      <View style={styles.content}>
        <Pressable
          accessibilityLabel={t("legacyExportAccessibilityLabel")}
          accessibilityRole="button"
          disabled={isBusy}
          onPress={onLegacyExport}
          style={[
            styles.button,
            styles.primaryButton,
            isBusy ? styles.buttonDisabled : null,
          ]}
        >
          {isLegacyExporting ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.buttonLabel}>{t("legacyExport")}</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityLabel={t("exportAccessibilityLabel")}
          accessibilityRole="button"
          disabled={isBusy}
          onPress={onExport}
          style={[
            styles.button,
            styles.primaryButton,
            isBusy ? styles.buttonDisabled : null,
          ]}
        >
          {isExporting ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.buttonLabel}>{t("export")}</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityLabel={t("importAccessibilityLabel")}
          accessibilityRole="button"
          disabled={isBusy}
          onPress={onImport}
          style={[
            styles.button,
            styles.primaryButton,
            isBusy ? styles.buttonDisabled : null,
          ]}
        >
          {isImporting ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.buttonLabel}>{t("import")}</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityLabel={t("signOutAccessibilityLabel")}
          accessibilityRole="button"
          disabled={isBusy}
          onPress={onSignOut}
          style={[
            styles.button,
            styles.signOutButton,
            isBusy ? styles.buttonDisabled : null,
          ]}
        >
          {isSigningOut ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.buttonLabel}>{t("signOut")}</Text>
          )}
        </Pressable>
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
  primaryButton: {
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
}))
