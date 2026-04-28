import {
  Column,
  Host,
  ModalBottomSheet,
  Text,
  TextButton,
} from "@expo/ui/jetpack-compose"
import { fillMaxWidth, paddingAll } from "@expo/ui/jetpack-compose/modifiers"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, Text as RNText } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

type TagsMenuProps = {
  availableTags: string[]
  onSelectTag: (tag: string) => void
}

export default function TagsMenu({
  availableTags,
  onSelectTag,
}: TagsMenuProps) {
  const { t } = useTranslation("common", { keyPrefix: "editCard.tagsMenu" })
  const { theme } = useUnistyles()
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
        <RNText style={styles.triggerPlus}>+</RNText>
        <RNText style={styles.triggerChevron}>v</RNText>
      </Pressable>

      {isOpen ? (
        <Host>
          <ModalBottomSheet onDismissRequest={closeMenu}>
            <Column
              modifiers={[fillMaxWidth(), paddingAll(16)]}
              verticalArrangement={{ spacedBy: 8 }}
            >
              <Text
                color={theme.colors.primary}
                style={{ typography: "titleMedium", fontWeight: "600" }}
              >
                {t("title")}
              </Text>
              {availableTags.map((tag) => (
                <TextButton
                  key={tag}
                  colors={{
                    contentColor: theme.colors.primary,
                  }}
                  modifiers={[fillMaxWidth()]}
                  onClick={() => {
                    onSelectTag(tag)
                    closeMenu()
                  }}
                >
                  {tag}
                </TextButton>
              ))}
              <TextButton
                colors={{
                  contentColor: theme.colors.secondary,
                }}
                onClick={closeMenu}
              >
                {t("cancel")}
              </TextButton>
            </Column>
          </ModalBottomSheet>
        </Host>
      ) : null}
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
}))
