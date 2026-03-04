import { Stack } from "expo-router"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

export default function Layout() {
  const { theme } = useUnistyles()

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        contentStyle: styles.content(theme),
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="new-card"
        options={{
          presentation: "modal",
          headerTransparent: false,
          headerShadowVisible: false,
          headerStyle: styles.header(theme),
          headerTintColor: theme.colors.primary,
          headerTitleStyle: styles.headerTitle(theme),
        }}
      />
      <Stack.Screen
        name="review"
        options={{ presentation: "fullScreenModal" }}
      ></Stack.Screen>
    </Stack>
  )
}

const styles = StyleSheet.create({
  content: (theme) => ({
    backgroundColor: theme.colors.background,
  }),
  header: (theme) => ({
    backgroundColor: theme.colors.background,
  }),
  headerTitle: (theme) => ({
    color: theme.colors.primary,
  }),
})
