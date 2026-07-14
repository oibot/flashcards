import { SymbolView } from "expo-symbols"
import type { ComponentProps } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { ActivityIndicator, Pressable, StyleSheet } from "react-native"

type SymbolName = ComponentProps<typeof SymbolView>["name"]

type IconButtonProps = {
  iconName: SymbolName
  accessibilityLabel: string
  onPress: () => void
  tintColor: string
  disabled?: boolean
  loading?: boolean
  size?: number
  style?: StyleProp<ViewStyle>
}

const plusIconName = "plus" as const
const closeIconName = "xmark" as const
const checkmarkIconName = "checkmark" as const
const trashIconName = "trash" as const
const undoIconName = "arrow.uturn.backward" as const
const pencilIconName = "pencil" as const
const audioIconName = "speaker.wave.2.fill" as const
const audioNoneIconName = "speaker.slash" as const
const audioSelectedIconName = "speaker.wave.2" as const
const audioStaleIconName = "arrow.clockwise.circle" as const

function IconButtonBase({
  iconName,
  accessibilityLabel,
  onPress,
  tintColor,
  disabled = false,
  loading = false,
  size = 16,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={10}
      onPress={onPress}
      style={[styles.button, disabled ? styles.buttonDisabled : null, style]}
    >
      {loading ? (
        <ActivityIndicator color={tintColor} size="small" />
      ) : (
        <SymbolView name={iconName} size={size} tintColor={tintColor} />
      )}
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

export function IconButtonTrash(props: IconButtonInstanceProps) {
  return <IconButtonBase {...props} iconName={trashIconName} />
}

export function IconButtonUndo(props: IconButtonInstanceProps) {
  return <IconButtonBase {...props} iconName={undoIconName} />
}

export function IconButtonPencil(props: IconButtonInstanceProps) {
  return <IconButtonBase {...props} iconName={pencilIconName} />
}

export function IconButtonAudio(props: IconButtonInstanceProps) {
  return <IconButtonBase {...props} iconName={audioIconName} />
}

export function IconButtonAudioNone(props: IconButtonInstanceProps) {
  return <IconButtonBase {...props} iconName={audioNoneIconName} />
}

export function IconButtonAudioSelected(props: IconButtonInstanceProps) {
  return <IconButtonBase {...props} iconName={audioSelectedIconName} />
}

export function IconButtonAudioStale(props: IconButtonInstanceProps) {
  return <IconButtonBase {...props} iconName={audioStaleIconName} />
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
  buttonDisabled: {
    opacity: 0.5,
  },
})
