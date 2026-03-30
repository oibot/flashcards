import { ActivityIndicator, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

export default function LoadingScreen() {
  const { theme } = useUnistyles()

  return (
    <View style={styles.container}>
      <ActivityIndicator color={theme.colors.accent} />
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
}))
