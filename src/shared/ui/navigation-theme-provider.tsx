import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation"
import type { PropsWithChildren } from "react"
import { useUnistyles } from "react-native-unistyles"

export default function NavigationThemeProvider({
  children,
}: PropsWithChildren) {
  const { rt, theme } = useUnistyles()
  const baseTheme = rt.themeName === "dark" ? DarkTheme : DefaultTheme
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.primary,
      border: theme.colors.chromeMuted,
      notification: theme.colors.destructive,
    },
  }

  return <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>
}
