import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import { HeaderButtonPlusIcon } from "@/components/UI/header-button-icon"

type Props = {
  onNewCard: () => void
  onReviewStart: () => void
}

export default function ReviewPrepScene({ onNewCard, onReviewStart }: Props) {
  const { theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "reviewPrep" })
  const isAndroid = Platform.OS === "android"

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
          headerRight: isAndroid
            ? undefined
            : () => (
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
        {isAndroid ? (
          <Pressable
            accessibilityLabel={t("newCardAccessibilityLabel")}
            accessibilityRole="button"
            onPress={onNewCard}
            style={styles.fab}
          >
            <MaterialCommunityIcons
              name="plus"
              size={28}
              color={theme.colors.background}
            />
          </Pressable>
        ) : null}
      </View>
    </>
  )
}

const styles = StyleSheet.create((theme, rt) => ({
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
  fab: {
    position: "absolute",
    right: Math.max(rt.insets.right, 16),
    bottom: Math.max(rt.insets.bottom, 16),
    width: 56,
    height: 56,
    borderRadius: 28,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
    boxShadow: `0 8px 18px ${theme.colors.chromeMuted}`,
  },
}))
