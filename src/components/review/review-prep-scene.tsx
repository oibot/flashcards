import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { Pressable, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import { HeaderButtonPlusIcon } from "@/components/UI/header-button-icon"

type Props = {
  onNewCard: () => void
  onReviewStart: () => void
}

export default function ReviewPrepScene({ onNewCard, onReviewStart }: Props) {
  const { theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "reviewPrep" })

  return (
    <>
      <Stack.Screen
        options={{
          unstable_headerRightItems: () => [
            {
              type: "button",
              label: t("newCardAccessibilityLabel"),
              icon: { type: "sfSymbol", name: "plus" },
              tintColor: theme.colors.accent,
              onPress: onNewCard,
            },
          ],
          headerRight: () => (
            <HeaderButtonPlusIcon
              tintColor={theme.colors.accent}
              accessibilityLabel={t("newCardAccessibilityLabel")}
              onPress={onNewCard}
            />
          ),
        }}
      />
      <View style={styles.container}>
        <Pressable onPress={onReviewStart} style={styles.button}>
          <Text style={styles.buttonLabel}>{t("startReview")}</Text>
        </Pressable>
      </View>
    </>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: theme.colors.accent,
  },
  buttonLabel: {
    ...theme.typography.styles.headline,
    color: theme.colors.background,
  },
}))
