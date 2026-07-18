import { Stack } from "expo-router"
import type { ComponentProps } from "react"
import { useTranslation } from "react-i18next"
import { useUnistyles } from "react-native-unistyles"

type Props = {
  isComplete: boolean
  isMutating: boolean
  onClose: () => void
  onDelete: () => void
  onEdit: () => void
  visibleSide?: "front" | "back"
  onShowFront?: () => void
}

type StackScreenOptions = Exclude<
  NonNullable<ComponentProps<typeof Stack.Screen>["options"]>,
  (...args: never[]) => unknown
>
type NativeStackHeaderItem = ReturnType<
  NonNullable<StackScreenOptions["unstable_headerRightItems"]>
>[number]

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
  const { t } = useTranslation("reviewSession")
  const canShowFront = visibleSide === "back" && onShowFront != null

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
        unstable_headerRightItems: () =>
          isComplete
            ? []
            : [
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
      }}
    />
  )
}
