import "@/locales/i18n"

import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { ActivityIndicator, View } from "react-native"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import { DbProvider } from "@/db/db-context"
import { db } from "@/db/instant/db"

export default function Layout() {
  const { rt, theme } = useUnistyles()
  const { isLoading, user } = db.useAuth()
  const isLoggedIn = !!user
  const statusBarStyle = rt.themeName === "dark" ? "light" : "dark"

  return (
    <KeyboardProvider>
      <DbProvider>
        <StatusBar style={statusBarStyle} />
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.accent} />
          </View>
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
            </Stack.Protected>
            <Stack.Protected guard={!isLoggedIn}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
          </Stack>
        )}
      </DbProvider>
    </KeyboardProvider>
  )
}

const styles = StyleSheet.create((theme) => ({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
}))
