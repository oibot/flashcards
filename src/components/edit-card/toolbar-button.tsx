import { Pressable, Text } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"
import FontAwesome6 from "@expo/vector-icons/FontAwesome6"

type ToolbarButtonTextProps = {
  text: string
  icon?: never
  isActive: boolean
  isDisabled: boolean
  onPress: () => void
}

type ToolbarButtonIconProps = {
  text?: never
  icon: string
  isActive: boolean
  isDisabled: boolean
  onPress: () => void
}

export type ToolbarButtonProps = ToolbarButtonTextProps | ToolbarButtonIconProps

export default function ToolbarButton({
  text,
  icon,
  isActive,
  isDisabled,
  onPress,
}: ToolbarButtonProps) {
  const { theme } = useUnistyles()
  const iconColor = isDisabled
    ? theme.colors.secondary
    : isActive
      ? theme.colors.background
      : theme.colors.primary

  return (
    <Pressable
      style={[
        styles.container,
        isActive && styles.containerActive,
        isDisabled && styles.containerDisabled,
      ]}
      disabled={isDisabled}
      onPress={onPress}
    >
      {icon ? (
        <FontAwesome6
          name={icon}
          size={18}
          color={iconColor}
        />
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
