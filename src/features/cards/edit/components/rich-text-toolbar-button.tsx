import { SymbolView } from "expo-symbols"
import type { ComponentProps } from "react"
import { Pressable, Text } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

type SharedRichTextToolbarButtonProps = {
  accessibilityLabel: string
  isActive: boolean
  isDisabled: boolean
  onPress: () => void
}

type RichTextToolbarButtonTextProps = SharedRichTextToolbarButtonProps & {
  text: string
  icon?: never
}

type RichTextToolbarButtonIconProps = SharedRichTextToolbarButtonProps & {
  text?: never
  icon: ComponentProps<typeof SymbolView>["name"]
}

export type RichTextToolbarButtonProps =
  | RichTextToolbarButtonTextProps
  | RichTextToolbarButtonIconProps

export default function RichTextToolbarButton({
  accessibilityLabel,
  text,
  icon,
  isActive,
  isDisabled,
  onPress,
}: RichTextToolbarButtonProps) {
  const { theme } = useUnistyles()
  const iconColor = isDisabled
    ? theme.colors.secondary
    : isActive
      ? theme.colors.background
      : theme.colors.primary

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, selected: isActive }}
      style={[
        styles.container,
        isActive && styles.containerActive,
        isDisabled && styles.containerDisabled,
      ]}
      disabled={isDisabled}
      onPress={onPress}
    >
      {icon ? (
        <SymbolView name={icon} size={18} tintColor={iconColor} />
      ) : (
        <Text
          style={[
            styles.text,
            isActive && styles.textActive,
            isDisabled && styles.textDisabled,
          ]}
        >
          {text}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    justifyContent: "center",
    alignItems: "center",
    minWidth: 40,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderCurve: "continuous",
    backgroundColor: theme.colors.chromeMuted,
  },
  containerActive: {
    backgroundColor: theme.colors.accent,
  },
  containerDisabled: {
    opacity: 0.45,
  },
  text: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  textActive: {
    color: theme.colors.background,
  },
  textDisabled: {
    color: theme.colors.secondary,
  },
}))
