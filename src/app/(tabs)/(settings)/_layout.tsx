import { Stack } from "expo-router"
import { StyleSheet } from "react-native-unistyles"

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: styles.content,
        headerTransparent: true,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  )
}

const styles = StyleSheet.create((theme) => ({
  content: {
    backgroundColor: theme.colors.background,
  },
}))
