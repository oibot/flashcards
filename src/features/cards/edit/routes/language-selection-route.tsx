import { Redirect } from "expo-router"

import LanguageSelectionScreen from "@/features/cards/edit/screens/language-selection-screen"
import { featureFlags } from "@/shared/config/feature-flags"

export default function LanguageSelectionRoute() {
  if (!featureFlags.audioCreation) {
    return <Redirect href="/" />
  }

  return <LanguageSelectionScreen />
}
