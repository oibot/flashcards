import { Stack } from "expo-router"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

export default function Layout() {
  const { theme } = useUnistyles()

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerTitle: "",
        contentStyle: styles.content,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="new-card"
        options={{
          presentation: "modal",
          headerTransparent: false,
          headerShadowVisible: false,
          headerStyle: styles.header,
          headerTintColor: theme.colors.primary,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <Stack.Screen
        name="review"
        options={{
          presentation: "fullScreenModal",
          headerTransparent: false,
          headerShadowVisible: false,
          headerStyle: styles.header,
          headerTintColor: theme.colors.primary,
          headerTitleStyle: styles.headerTitle,
        }}
      ></Stack.Screen>
    </Stack>
  )
}

const styles = StyleSheet.create((theme) => ({
  content: {
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    color: theme.colors.primary,
  },
}))
