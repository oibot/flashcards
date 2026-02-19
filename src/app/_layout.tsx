import { NativeTabs } from "expo-router/unstable-native-tabs"
import "@/locales/i18n"

export default function Layout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Decks</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="square.stack.3d.up.fill"
          md="collections"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
