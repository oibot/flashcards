import { Pressable, Text } from "react-native"
import { StyleSheet } from "react-native-unistyles"
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
          color={isDisabled ? "rgba(255, 255, 255, 0.45)" : "white"}
        />
      ) : (
        <Text style={styles.text}>{text}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    minWidth: 40,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderCurve: "continuous",
    backgroundColor: "rgba(0, 26, 114, 0.8)",
  },
  containerActive: {
    backgroundColor: "rgb(0, 26, 114)",
  },
  containerDisabled: {
    backgroundColor: "rgb(0, 26, 114)",
    opacity: 0.3,
  },
  text: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
})
