import { NativeTabs } from "expo-router/unstable-native-tabs"
import { useTranslation } from "react-i18next"

export default function Layout() {
  const { t } = useTranslation()

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(review)">
        <NativeTabs.Trigger.Label>{t("tabs.review")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="rectangle.on.rectangle" md="collections" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
