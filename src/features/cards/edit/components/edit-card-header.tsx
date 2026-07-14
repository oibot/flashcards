import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { useUnistyles } from "react-native-unistyles"

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
  const canAddAnother = !isEditing && onAddAnother != null
  const handleAddAnother = () => {
    onAddAnother?.()
  }

  return (
    <Stack.Screen
      options={{
        title: "",
        headerTransparent: true,
        headerShadowVisible: false,
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
            variant: "prominent" as const,
            onPress: onSave,
          },
        ],
      }}
    />
  )
}
