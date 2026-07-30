import { Host, Text, Toggle } from "@expo/ui/swift-ui"
import { padding } from "@expo/ui/swift-ui/modifiers"
import { View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

export type OppositeDirectionToggleProps = {
  label: string
  onValueChange: (value: boolean) => void
  value: boolean
}

export default function OppositeDirectionToggle({
  label,
  onValueChange,
  value,
}: OppositeDirectionToggleProps) {
  return (
    <View style={styles.container}>
      <Host matchContents={{ vertical: true }}>
        <Toggle
          isOn={value}
          onIsOnChange={onValueChange}
          modifiers={[padding({ horizontal: 16, vertical: 14 })]}
        >
          <Text>{label}</Text>
        </Toggle>
      </Host>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: "100%",
    minHeight: 64,
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 20,
    borderCurve: "continuous",
    backgroundColor: theme.colors.secondaryBackground,
  },
}))
