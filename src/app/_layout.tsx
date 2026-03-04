import { Slot } from "expo-router"
import { KeyboardProvider } from "react-native-keyboard-controller"
import "@/locales/i18n"
import { DbProvider } from "@/db/db-context"

export default function Layout() {
  return (
    <KeyboardProvider>
      <DbProvider>
        <Slot />
      </DbProvider>
    </KeyboardProvider>
  )
}
