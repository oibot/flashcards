import type { NativeStackHeaderItem } from "@react-navigation/native-stack"
import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { Platform } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import AndroidHeader from "@/components/UI/android-header"
import {
  IconButtonPencil,
  IconButtonTrash,
  IconButtonUndo,
} from "@/components/UI/icon-button"

type Props = {
  isComplete: boolean
  isMutating: boolean
  onClose: () => void
  onDelete: () => void
  onEdit: () => void
  visibleSide?: "front" | "back"
  onShowFront?: () => void
}

export default function ReviewSessionHeader({
  isComplete,
  isMutating,
  visibleSide,
  onClose,
  onDelete,
  onEdit,
  onShowFront,
}: Props) {
  const { theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "reviewSession" })
  const isIOS = Platform.OS === "ios"
  const isAndroid = Platform.OS === "android"
  const canShowFront = visibleSide === "back" && onShowFront != null

  if (isIOS) {
    return (
      <Stack.Screen
        options={{
          title: "",
          headerTransparent: false,
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.primary,
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
                  ...(canShowFront
                    ? [
                        {
                          type: "button",
                          label: t("showFrontAccessibilityLabel"),
                          icon: {
                            type: "sfSymbol",
                            name: "arrow.uturn.backward",
                          },
                          disabled: isMutating,
                          tintColor: theme.colors.primary,
                          onPress: onShowFront,
                        } satisfies NativeStackHeaderItem,
                      ]
                    : []),
                  {
                    type: "button",
                    label: t("editAccessibilityLabel"),
                    icon: { type: "sfSymbol", name: "pencil" },
                    disabled: isMutating,
                    tintColor: theme.colors.primary,
                    onPress: onEdit,
                  } satisfies NativeStackHeaderItem,
                  {
                    type: "button",
                    label: t("delete.accessibilityLabel"),
                    icon: { type: "sfSymbol", name: "trash" },
                    disabled: isMutating,
                    tintColor: theme.colors.destructive,
                    onPress: onDelete,
                  } satisfies NativeStackHeaderItem,
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
                  <>
                    {canShowFront ? (
                      <IconButtonUndo
                        accessibilityLabel={t("showFrontAccessibilityLabel")}
                        disabled={isMutating}
                        onPress={onShowFront}
                        style={styles.headerButton}
                        tintColor={theme.colors.primary}
                      />
                    ) : null}
                    <IconButtonPencil
                      accessibilityLabel={t("editAccessibilityLabel")}
                      disabled={isMutating}
                      onPress={onEdit}
                      style={styles.headerButton}
                      tintColor={theme.colors.primary}
                    />
                    <IconButtonTrash
                      accessibilityLabel={t("delete.accessibilityLabel")}
                      disabled={isMutating}
                      onPress={onDelete}
                      style={styles.headerButton}
                      tintColor={theme.colors.destructive}
                    />
                  </>
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
