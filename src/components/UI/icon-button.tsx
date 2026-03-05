import { SymbolView } from "expo-symbols"
import type { ComponentProps } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { Pressable, StyleSheet } from "react-native"

type SymbolName = ComponentProps<typeof SymbolView>["name"]

type IconButtonProps = {
  iconName: SymbolName
  accessibilityLabel: string
  onPress: () => void
  tintColor: string
  size?: number
  style?: StyleProp<ViewStyle>
}

const plusIconName = { ios: "plus", android: "add" } as const
const closeIconName = { ios: "xmark", android: "close" } as const
const checkmarkIconName = { ios: "checkmark", android: "done" } as const

function IconButtonBase({
  iconName,
  accessibilityLabel,
  onPress,
  tintColor,
  size = 16,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}
      style={[styles.button, style]}
    >
      <SymbolView name={iconName} size={size} tintColor={tintColor} />
    </Pressable>
  )
}

type IconButtonInstanceProps = Omit<IconButtonProps, "iconName">

export function IconButtonPlus(props: IconButtonInstanceProps) {
  return <IconButtonBase {...props} iconName={plusIconName} />
}

export function IconButtonClose(props: IconButtonInstanceProps) {
  return <IconButtonBase {...props} iconName={closeIconName} />
}

export function IconButtonCheckmark(props: IconButtonInstanceProps) {
  return <IconButtonBase {...props} iconName={checkmarkIconName} />
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
