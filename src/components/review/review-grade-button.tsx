import { Pressable, Text } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import type { ReviewGrade } from "@/domain/review-scheduler"

type Props = {
  disabled: boolean
  grade: ReviewGrade
  label: string
  onPress: (grade: ReviewGrade) => void
}

export default function ReviewGradeButton({
  disabled,
  grade,
  label,
  onPress,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => onPress(grade)}
      style={[styles.button, getGradeButtonStyle(grade)]}
    >
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        numberOfLines={1}
        style={styles.buttonLabel}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const getGradeButtonStyle = (grade: ReviewGrade) => {
  switch (grade) {
    case "again":
      return styles.buttonAgain
    case "hard":
      return styles.buttonHard
    case "good":
      return styles.buttonGood
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
  buttonLabel: {
    ...theme.typography.styles.body,
    color: theme.colors.background,
    fontWeight: "600",
    textAlign: "center",
  },
}))
