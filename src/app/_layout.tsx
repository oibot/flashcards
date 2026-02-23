import { NativeTabs } from "expo-router/unstable-native-tabs"
import "@/locales/i18n"
import { DecksProvider } from "@/contexts/decks-context"

export default function Layout() {
  return (
    <DecksProvider>
      <NativeTabs>
        <NativeTabs.Trigger name="(home)">
          <NativeTabs.Trigger.Label>Decks</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf="square.stack.3d.up.fill"
            md="collections"
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </DecksProvider>
  )
}
