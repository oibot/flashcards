import { SymbolView } from "expo-symbols"
import type { ComponentProps } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { Pressable, StyleSheet } from "react-native"

type SymbolName = ComponentProps<typeof SymbolView>["name"]

type HeaderButtonIconProps = {
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

function HeaderButtonIconBase({
  iconName,
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
      <SymbolView name={iconName} size={size} tintColor={tintColor} />
    </Pressable>
  )
}

type HeaderButtonInstanceProps = Omit<HeaderButtonIconProps, "iconName">

export function HeaderButtonPlusIcon(props: HeaderButtonInstanceProps) {
  return <HeaderButtonIconBase {...props} iconName={plusIconName} />
}

export function HeaderButtonCloseIcon(props: HeaderButtonInstanceProps) {
  return <HeaderButtonIconBase {...props} iconName={closeIconName} />
}

export function HeaderButtonCheckmarkIcon(props: HeaderButtonInstanceProps) {
  return <HeaderButtonIconBase {...props} iconName={checkmarkIconName} />
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
