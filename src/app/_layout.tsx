import "@/shared/i18n/i18n"

import * as Sentry from "@sentry/react-native"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { useUnistyles } from "react-native-unistyles"

import { useAuthSession } from "@/features/auth/hooks/use-auth-session"
import { useEnsureProfile } from "@/features/auth/hooks/use-ensure-profile"
import { DbProvider } from "@/features/cards/data/db-context"
import { SENTRY_DSN } from "@/shared/lib/sentry"
import LoadingScreen from "@/shared/ui/loading-screen"
import NavigationThemeProvider from "@/shared/ui/navigation-theme-provider"

Sentry.init({
  dsn: SENTRY_DSN,

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
})

function Layout() {
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

export default Sentry.wrap(Layout)
