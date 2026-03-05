import "@/locales/i18n"

import { Stack } from "expo-router"
import { KeyboardProvider } from "react-native-keyboard-controller"

import { DbProvider } from "@/db/db-context"

export default function Layout() {
  return (
    <KeyboardProvider>
      <DbProvider>
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
