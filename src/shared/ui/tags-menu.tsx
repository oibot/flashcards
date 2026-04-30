import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Modal, Pressable, Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

type TagsMenuProps = {
  availableTags: string[]
  onSelectTag: (tag: string) => void
}

export default function TagsMenu({
  availableTags,
  onSelectTag,
}: TagsMenuProps) {
  const { t } = useTranslation("common", { keyPrefix: "editCard.tagsMenu" })
  const [isOpen, setIsOpen] = useState(false)

  if (availableTags.length === 0) {
    return null
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <>
      <Pressable
        accessibilityLabel={t("accessibilityLabel")}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => {
          setIsOpen(true)
        }}
        style={styles.trigger}
      >
        <Text style={styles.triggerPlus}>+</Text>
        <Text style={styles.triggerChevron}>v</Text>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={closeMenu}
        transparent
        visible={isOpen}
      >
        <View style={styles.modalRoot}>
          <Pressable onPress={closeMenu} style={styles.backdrop} />
          <View style={styles.sheet}>
            <Text style={styles.title}>{t("title")}</Text>
            {availableTags.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => {
                  onSelectTag(tag)
                  closeMenu()
                }}
                style={({ pressed }) => [
                  styles.itemButton,
                  pressed ? styles.itemButtonPressed : null,
                ]}
              >
                <Text style={styles.itemLabel}>{tag}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={closeMenu}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed ? styles.itemButtonPressed : null,
              ]}
            >
              <Text style={styles.cancelLabel}>{t("cancel")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create((theme) => ({
  trigger: {
    minHeight: 36,
    minWidth: 44,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 10,
    borderCurve: "continuous",
    backgroundColor: theme.colors.chromeMuted,
  },
  triggerPlus: {
    ...theme.typography.styles.headline,
    color: theme.colors.primary,
    lineHeight: 18,
  },
  triggerChevron: {
    ...theme.typography.styles.caption,
    color: theme.colors.secondary,
    fontWeight: "700",
    lineHeight: 12,
    marginTop: 2,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.shadowSoft,
  },
  sheet: {
    gap: 8,
    padding: 16,
    backgroundColor: theme.colors.secondaryBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderCurve: "continuous",
  },
  title: {
    ...theme.typography.styles.title3,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  itemButton: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 12,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    backgroundColor: theme.colors.background,
  },
  itemButtonPressed: {
    opacity: 0.8,
  },
  itemLabel: {
    ...theme.typography.styles.body,
    color: theme.colors.primary,
  },
  cancelButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderCurve: "continuous",
    paddingHorizontal: 14,
  },
  cancelLabel: {
    ...theme.typography.styles.body,
    color: theme.colors.secondary,
    fontWeight: "600",
  },
}))
