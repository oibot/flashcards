import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, Text } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import AndroidHeader from "@/components/UI/android-header"

type EditCardHeaderProps = {
  onClose: () => void
  onSave: () => void
}

export default function EditCardHeader({
  onClose,
  onSave,
}: EditCardHeaderProps) {
  const { theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "editCard" })
  const isIOS = Platform.OS === "ios"
  const isAndroid = Platform.OS === "android"

  return (
    <Stack.Screen
      options={{
        title: isIOS ? "" : t("headerTitle"),
        headerTransparent: isIOS,
        headerShadowVisible: false,
        ...(isIOS
          ? {
              unstable_headerLeftItems: () => [
                {
                  type: "button",
                  label: t("cancel"),
                  icon: { type: "sfSymbol", name: "xmark" },
                  tintColor: theme.colors.primary,
                  onPress: onClose,
                },
              ],
              unstable_headerRightItems: () => [
                {
                  type: "button",
                  label: t("saveCard"),
                  icon: { type: "sfSymbol", name: "checkmark" },
                  tintColor: theme.colors.accent,
                  variant: "prominent",
                  onPress: onSave,
                },
              ],
            }
          : {
              header: () =>
                isAndroid ? (
                  <AndroidHeader
                    title={t("headerTitle")}
                    closeAccessibilityLabel={t("cancelAccessibilityLabel")}
                    onClose={onClose}
                    rightAction={
                      <Pressable
                        accessibilityLabel={t("saveCardAccessibilityLabel")}
                        accessibilityRole="button"
                        onPress={onSave}
                        style={styles.androidHeaderSaveButton}
                      >
                        <Text style={styles.androidHeaderSaveLabel}>
                          {t("saveCard")}
                        </Text>
                      </Pressable>
                    }
                  />
                ) : null,
            }),
      }}
    />
  )
}

const styles = StyleSheet.create((theme) => ({
  androidHeaderSaveButton: {
    minHeight: 40,
    minWidth: 70,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
  },
  androidHeaderSaveLabel: {
    ...theme.typography.styles.subheadline,
    color: theme.colors.background,
    fontWeight: "600",
  },
}))
