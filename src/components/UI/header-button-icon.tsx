import { SymbolView } from "expo-symbols"
import type { ComponentProps } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { Pressable, StyleSheet } from "react-native"

type HeaderButtonIconProps = {
  icon: ComponentProps<typeof SymbolView>["name"]
  accessibilityLabel: string
  onPress: () => void
  tintColor: string
  size?: number
  style?: StyleProp<ViewStyle>
}

export default function HeaderButtonIcon({
  icon,
  accessibilityLabel,
  onPress,
  tintColor,
  size = 16,
  style,
}: HeaderButtonIconProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}
      style={[styles.button, style]}
    >
      <SymbolView name={icon} size={size} tintColor={tintColor} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
})
