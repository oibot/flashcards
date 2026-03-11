import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { Platform } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import AndroidHeader from "@/components/UI/android-header"
import { IconButtonTrash } from "@/components/UI/icon-button"

type Props = {
  isComplete: boolean
  isMutating: boolean
  onClose: () => void
  onDelete: () => void
}

export default function ReviewSessionHeader({
  isComplete,
  isMutating,
  onClose,
  onDelete,
}: Props) {
  const { theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "reviewSession" })
  const isIOS = Platform.OS === "ios"
  const isAndroid = Platform.OS === "android"

  if (isIOS) {
    return (
      <Stack.Screen
        options={{
          title: "",
          headerTransparent: true,
          headerShadowVisible: false,
          unstable_headerLeftItems: () => [
            {
              type: "button",
              label: t("closeAccessibilityLabel"),
              icon: { type: "sfSymbol", name: "xmark" },
              tintColor: theme.colors.primary,
              onPress: onClose,
            },
          ],
          ...(isComplete
            ? {}
            : {
                unstable_headerRightItems: () => [
                  {
                    type: "button",
                    label: t("delete.accessibilityLabel"),
                    icon: { type: "sfSymbol", name: "trash" },
                    tintColor: theme.colors.destructive,
                    onPress: onDelete,
                  },
                ],
              }),
        }}
      />
    )
  }

  return (
    <Stack.Screen
      options={{
        title: undefined,
        headerTransparent: false,
        headerShadowVisible: false,
        header: () =>
          isAndroid ? (
            <AndroidHeader
              closeAccessibilityLabel={t("closeAccessibilityLabel")}
              onClose={onClose}
              rightAction={
                isComplete ? null : (
                  <IconButtonTrash
                    accessibilityLabel={t("delete.accessibilityLabel")}
                    disabled={isMutating}
                    onPress={onDelete}
                    style={styles.headerButton}
                    tintColor={theme.colors.destructive}
                  />
                )
              }
            />
          ) : null,
      }}
    />
  )
}

const styles = StyleSheet.create((theme) => ({
  headerButton: {
    backgroundColor: theme.colors.chromeMuted,
  },
}))
