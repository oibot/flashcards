import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, Text } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import AndroidHeader from "@/shared/ui/android-header"
import { IconButtonPlus } from "@/shared/ui/icon-button"

type EditCardHeaderProps = {
  isEditing?: boolean
  onClose: () => void
  onAddAnother?: () => void
  onSave: () => void
}

export default function EditCardHeader({
  isEditing = false,
  onClose,
  onAddAnother,
  onSave,
}: EditCardHeaderProps) {
  const { theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "editCard" })
  const isIOS = Platform.OS === "ios"
  const isAndroid = Platform.OS === "android"
  const title = isEditing ? t("editHeaderTitle") : t("headerTitle")
  const canAddAnother = !isEditing && onAddAnother != null
  const handleAddAnother = () => {
    onAddAnother?.()
  }

  return (
    <Stack.Screen
      options={{
        title: isIOS ? "" : title,
        headerTransparent: isIOS,
        headerShadowVisible: false,
        ...(isIOS
          ? {
              unstable_headerLeftItems: () => [
                {
                  type: "button" as const,
                  label: t("cancel"),
                  icon: { type: "sfSymbol" as const, name: "xmark" as const },
                  tintColor: theme.colors.primary,
                  onPress: onClose,
                },
              ],
              unstable_headerRightItems: () => [
                ...(canAddAnother
                  ? [
                      {
                        type: "button" as const,
                        label: t("addAnotherCard"),
                        icon: {
                          type: "sfSymbol" as const,
                          name: "plus" as const,
                        },
                        tintColor: theme.colors.primary,
                        onPress: handleAddAnother,
                      },
                    ]
                  : []),
                {
                  type: "button" as const,
                  label: t("saveCard"),
                  icon: {
                    type: "sfSymbol" as const,
                    name: "checkmark" as const,
                  },
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
                    title={title}
                    closeAccessibilityLabel={t("cancelAccessibilityLabel")}
                    onClose={onClose}
                    leftAction={
                      canAddAnother ? (
                        <IconButtonPlus
                          accessibilityLabel={t(
                            "addAnotherCardAccessibilityLabel",
                          )}
                          onPress={onAddAnother}
                          tintColor={theme.colors.primary}
                        />
                      ) : null
                    }
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
