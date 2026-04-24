import { Stack, useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import type { VisibleCardSide } from "@/domain/card"

function isVisibleCardSide(value: unknown): value is VisibleCardSide {
  return value === "front" || value === "back"
}

export default function EditCardSoundScene() {
  const { t } = useTranslation("common", { keyPrefix: "editCard.soundSheet" })
  const params = useLocalSearchParams<{ side?: string | string[] }>()
  const side = isVisibleCardSide(params.side) ? params.side : "front"
  const sideLabel = t(side)

  return (
    <>
      <Stack.Screen
        options={{
          title: t("title", { side: sideLabel }),
        }}
      />
      <View style={styles.container}>
        <Text style={styles.title}>{t("headline", { side: sideLabel })}</Text>
        <Text style={styles.description}>{t("description")}</Text>
      </View>
    </>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    gap: 12,
    padding: 24,
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.typography.styles.title3,
    color: theme.colors.primary,
  },
  description: {
    ...theme.typography.styles.body,
    color: theme.colors.secondary,
  },
}))
