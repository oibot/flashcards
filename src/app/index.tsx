import { Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

export default function Page() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Page</Text>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  text: {
    textAlign: "center",
    color: theme.colors.primary,
  },
}))
