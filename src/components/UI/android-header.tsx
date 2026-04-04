import type { ReactNode } from "react"
import { Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import { IconButtonClose } from "@/components/UI/icon-button"

type AndroidHeaderProps = {
  title?: string
  closeAccessibilityLabel: string
  onClose: () => void
  leftAction?: ReactNode
  rightAction?: ReactNode
}

export default function AndroidHeader({
  title,
  closeAccessibilityLabel,
  onClose,
  leftAction,
  rightAction,
}: AndroidHeaderProps) {
  const { theme } = useUnistyles()
  const hasTitle = Boolean(title)
  const hasLeftAction = leftAction != null
  const hasRightAction = rightAction != null

  return (
    <View style={styles.container}>
      <View
        style={hasTitle ? styles.leadingWithTitle : styles.leadingOnlyClose}
      >
        <IconButtonClose
          accessibilityLabel={closeAccessibilityLabel}
          onPress={onClose}
          tintColor={theme.colors.primary}
        />
        {hasTitle ? (
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        ) : null}
      </View>
      {hasLeftAction ? <View style={styles.actions}>{leftAction}</View> : null}
      {hasRightAction ? (
        <View style={styles.actions}>{rightAction}</View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Math.max(rt.insets.top, 8),
    paddingRight: Math.max(rt.insets.right, 16),
    paddingBottom: 10,
    paddingLeft: Math.max(rt.insets.left, 16),
    backgroundColor: theme.colors.background,
  },
  leadingWithTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 12,
  },
  leadingOnlyClose: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    ...theme.typography.styles.headline,
    flex: 1,
    textAlign: "left",
    color: theme.colors.primary,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
}))
