import { Pressable, Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

type OppositeDirectionToggleProps = {
  description: string
  label: string
  onValueChange: (value: boolean) => void
  value: boolean
}

export default function OppositeDirectionToggle({
  description,
  label,
  onValueChange,
  value,
}: OppositeDirectionToggleProps) {
  const handlePress = () => {
    onValueChange(!value)
  }

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={handlePress}
      style={styles.container}
    >
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View
        style={[
          styles.switchTrack,
          value ? styles.switchTrackActive : styles.switchTrackInactive,
        ]}
      >
        <View
          style={[
            styles.switchThumb,
            value ? styles.switchThumbActive : styles.switchThumbInactive,
          ]}
        />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    backgroundColor: theme.colors.secondaryBackground,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  label: {
    ...theme.typography.styles.headline,
    color: theme.colors.primary,
  },
  description: {
    ...theme.typography.styles.footnote,
    color: theme.colors.secondary,
  },
  switchTrack: {
    width: 52,
    height: 32,
    padding: 3,
    borderRadius: 999,
    justifyContent: "center",
  },
  switchTrackActive: {
    backgroundColor: theme.colors.accent,
    alignItems: "flex-end",
  },
  switchTrackInactive: {
    backgroundColor: theme.colors.chromeMuted,
    alignItems: "flex-start",
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  switchThumbActive: {
    backgroundColor: theme.colors.background,
  },
  switchThumbInactive: {
    backgroundColor: theme.colors.background,
  },
}))
