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

type RichTextToolbarIconButtonProps = SharedRichTextToolbarButtonProps & {
  icon: ComponentProps<typeof SymbolView>["name"]
  text?: never
}

type RichTextToolbarTextButtonProps = SharedRichTextToolbarButtonProps & {
  icon?: never
  text: string
}

export type RichTextToolbarButtonProps =
  | RichTextToolbarIconButtonProps
  | RichTextToolbarTextButtonProps

export default function RichTextToolbarButton({
  accessibilityLabel,
  icon,
  text,
  isActive,
  isDisabled,
  onPress,
}: RichTextToolbarButtonProps) {
  const { theme } = useUnistyles()

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, selected: isActive }}
      disabled={isDisabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        text && styles.textControl,
        isActive && styles.controlActive,
        (isDisabled || pressed) && styles.controlDimmed,
      ]}
    >
      {icon ? (
        <SymbolView
          name={icon}
          size={18}
          tintColor={isActive ? theme.colors.accent : theme.colors.primary}
        />
      ) : (
        <Text style={[styles.text, isActive && styles.textActive]}>{text}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  control: {
    width: 40,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    borderCurve: "continuous",
  },
  textControl: {
    width: "auto",
    minWidth: 52,
    paddingHorizontal: 10,
  },
  controlActive: {
    backgroundColor: theme.colors.chromeMuted,
  },
  controlDimmed: {
    opacity: 0.45,
  },
  text: {
    ...theme.typography.styles.subheadline,
    color: theme.colors.primary,
  },
  textActive: {
    color: theme.colors.accent,
    fontWeight: "600",
  },
}))
