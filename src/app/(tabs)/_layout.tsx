import { NativeTabs } from "expo-router/unstable-native-tabs"
import { useTranslation } from "react-i18next"

export default function Layout() {
  const { t } = useTranslation("tabs")

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(review)">
        <NativeTabs.Trigger.Label>{t("review")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="rectangle.on.rectangle" md="hourglass" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <NativeTabs.Trigger.Label>{t("settings")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
