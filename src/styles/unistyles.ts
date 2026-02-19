import { StyleSheet } from "react-native-unistyles"

const lightTheme = {
  colors: {
    primary: "black",
    background: "white",
  },
}

const otherTheme = {
  colors: {
    primary: "white",
    background: "black",
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
