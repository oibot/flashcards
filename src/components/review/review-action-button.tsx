import { Pressable, Text } from "react-native"
import { StyleSheet } from "react-native-unistyles"

type ReviewActionVariant = "again" | "hard" | "good" | "plain"

type Props = {
  disabled: boolean
  label: string
  onPress: () => void
  variant: ReviewActionVariant
}

export default function ReviewActionButton({
  disabled,
  label,
  onPress,
  variant,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, getButtonStyle(variant)]}
    >
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        numberOfLines={1}
        style={[styles.buttonLabel, getButtonLabelStyle(variant)]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const getButtonStyle = (variant: ReviewActionVariant) => {
  switch (variant) {
    case "again":
      return styles.buttonAgain
    case "hard":
      return styles.buttonHard
    case "good":
      return styles.buttonGood
    case "plain":
      return styles.buttonPlain
  }
}

const getButtonLabelStyle = (variant: ReviewActionVariant) => {
  switch (variant) {
    case "plain":
      return styles.buttonLabelPlain
    case "again":
    case "hard":
    case "good":
      return styles.buttonLabelOnColor
  }
}

const styles = StyleSheet.create((theme) => ({
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  buttonAgain: {
    backgroundColor: theme.colors.destructive,
    borderColor: theme.colors.destructive,
  },
  buttonHard: {
    backgroundColor: theme.colors.warning,
    borderColor: theme.colors.warning,
  },
  buttonGood: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  buttonPlain: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  buttonLabel: {
    ...theme.typography.styles.body,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonLabelOnColor: {
    color: theme.colors.background,
  },
  buttonLabelPlain: {
    color: theme.colors.primary,
  },
}))
