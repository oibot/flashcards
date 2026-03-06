import "@/locales/i18n"

import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { useUnistyles } from "react-native-unistyles"

import { DbProvider } from "@/db/db-context"

export default function Layout() {
  const { rt } = useUnistyles()
  const statusBarStyle = rt.themeName === "dark" ? "light" : "dark"

  return (
    <KeyboardProvider>
      <DbProvider>
        <StatusBar style={statusBarStyle} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="(modals)/new-card"
            options={{
              headerTitle: "",
              headerShown: true,
              headerShadowVisible: false,
              headerTransparent: true,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="(modals)/review-session"
            options={{
              headerTitle: "",
              headerShown: true,
              headerShadowVisible: false,
              headerTransparent: true,
              presentation: "fullScreenModal",
            }}
          />
        </Stack>
      </DbProvider>
    </KeyboardProvider>
  )
}
