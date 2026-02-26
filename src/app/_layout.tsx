import { NativeTabs } from "expo-router/unstable-native-tabs"
import "@/locales/i18n"
import { DbProvider } from "@/db/db-context"

export default function Layout() {
  return (
    <DbProvider>
      <NativeTabs>
        <NativeTabs.Trigger name="(home)">
          <NativeTabs.Trigger.Label>Decks</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf="square.stack.3d.up.fill"
            md="collections"
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </DbProvider>
  )
}
