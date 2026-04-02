import type { TextInputProps } from "react-native"
import { Text, TextInput, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

type AuthFieldProps = {
  label: string
} & TextInputProps

export default function AuthField({ label, ...props }: AuthFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={styles.placeholder.color} {...props} />
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  field: {
    gap: 8,
  },
  label: {
    ...theme.typography.styles.footnote,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  placeholder: {
    color: theme.colors.secondary,
  },
}))
