import { NativeTabs } from "expo-router/unstable-native-tabs"

export default function Layout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(review)">
        <NativeTabs.Trigger.Label>Review</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="rectangle.on.rectangle" md="collections" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
