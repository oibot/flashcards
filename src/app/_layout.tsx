import "@/locales/i18n"

import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { useUnistyles } from "react-native-unistyles"

import { useAuthSession } from "@/auth/use-auth-session"
import { useEnsureProfile } from "@/auth/use-ensure-profile"
import LoadingScreen from "@/components/UI/loading-screen"
import NavigationThemeProvider from "@/components/UI/navigation-theme-provider"
import { DbProvider } from "@/db/db-context"

export default function Layout() {
  const { rt } = useUnistyles()
  const { status, user } = useAuthSession()
  useEnsureProfile({ status, user })
  const isLoggedIn = !!user
  const statusBarStyle = rt.themeName === "dark" ? "light" : "dark"

  return (
    <KeyboardProvider>
      <DbProvider>
        <NavigationThemeProvider>
          <StatusBar style={statusBarStyle} />
          {status === "loading" ? (
            <LoadingScreen />
          ) : (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Protected guard={isLoggedIn}>
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
                <Stack.Screen
                  name="(modals)/edit-card/[id]"
                  options={{
                    headerTitle: "",
                    headerShown: true,
                    headerShadowVisible: false,
                    headerTransparent: true,
                    presentation: "modal",
                  }}
                />
                <Stack.Screen
                  name="(modals)/edit-card-language-selection"
                  options={{
                    headerShown: true,
                    presentation: "formSheet",
                    sheetAllowedDetents: [0.45, 1],
                    sheetGrabberVisible: true,
                  }}
                />
              </Stack.Protected>
              <Stack.Protected guard={!isLoggedIn}>
                <Stack.Screen name="(auth)" />
              </Stack.Protected>
            </Stack>
          )}
        </NavigationThemeProvider>
      </DbProvider>
    </KeyboardProvider>
  )
}
