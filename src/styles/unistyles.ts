import { StyleSheet } from "react-native-unistyles"

const lightTheme = {
  colors: {
    primary: "black",
    background: "white",
    accent: "#0A84FF",
    chromeMuted: "rgba(0, 0, 0, 0.08)",
  },
}

const otherTheme = {
  colors: {
    primary: "white",
    background: "black",
    accent: "#0A84FF",
    chromeMuted: "rgba(255, 255, 255, 0.12)",
  },
}

const settings = {
  adaptiveThemes: true,
}

const appThemes = {
  light: lightTheme,
  dark: otherTheme,
}

type AppThemes = typeof appThemes

declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: appThemes,
  settings,
})
