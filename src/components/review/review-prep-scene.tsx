import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import { IconButtonPlus } from "@/components/UI/icon-button"
import { useDueCards } from "@/hooks/use-due-cards"

type Props = {
  onNewCard: () => void
  onReviewStart: () => void
}

export default function ReviewPrepScene({ onNewCard, onReviewStart }: Props) {
  const { theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "reviewPrep" })
  const { cards: dueCards, isLoading, error } = useDueCards()
  const isAndroid = Platform.OS === "android"
  const dueCount = dueCards.length
  const isReviewDisabled = isLoading || !!error || dueCount === 0

  const handleReviewStart = () => {
    if (isReviewDisabled) return
    onReviewStart()
  }

  const statusLabel = isLoading
    ? t("loading")
    : error
      ? t("loadError")
      : t("dueCount", { count: dueCount })

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
                <IconButtonPlus
                  tintColor={theme.colors.accent}
                  accessibilityLabel={t("newCardAccessibilityLabel")}
                  onPress={onNewCard}
                />
              ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{t("title")}</Text>
          <View style={styles.statusBlock}>
            {isLoading ? (
              <ActivityIndicator color={theme.colors.accent} />
            ) : null}
            <Text style={styles.statusLabel}>{statusLabel}</Text>
            {!isLoading && !error && dueCount === 0 ? (
              <Text style={styles.emptyState}>{t("emptyState")}</Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isReviewDisabled}
            onPress={handleReviewStart}
            style={[
              styles.button,
              isReviewDisabled ? styles.buttonDisabled : null,
            ]}
          >
            <Text
              style={[
                styles.buttonLabel,
                isReviewDisabled ? styles.buttonLabelDisabled : null,
              ]}
            >
              {t("startReview")}
            </Text>
          </Pressable>
        </View>
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
  content: {
    width: "100%",
    paddingHorizontal: 24,
    gap: 24,
    alignItems: "center",
  },
  title: {
    ...theme.typography.styles.title3,
    color: theme.colors.primary,
    textAlign: "center",
  },
  statusBlock: {
    gap: 8,
    alignItems: "center",
  },
  statusLabel: {
    ...theme.typography.styles.body,
    color: theme.colors.primary,
    textAlign: "center",
  },
  emptyState: {
    ...theme.typography.styles.subheadline,
    color: theme.colors.secondary,
    textAlign: "center",
  },
  button: {
    minHeight: 52,
    minWidth: 180,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: theme.colors.accent,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.chromeMuted,
  },
  buttonLabel: {
    ...theme.typography.styles.headline,
    color: theme.colors.background,
  },
  buttonLabelDisabled: {
    color: theme.colors.primary,
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
    boxShadow: `0 8px 18px ${theme.colors.shadowSoft}`,
  },
}))
