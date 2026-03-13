import { Button, Host, Menu } from "@expo/ui/swift-ui"
import { labelStyle } from "@expo/ui/swift-ui/modifiers"
import { useTranslation } from "react-i18next"

type TagsMenuProps = {
  availableTags: string[]
  onSelectTag: (tag: string) => void
}

export default function TagsMenu({
  availableTags,
  onSelectTag,
}: TagsMenuProps) {
  const { t } = useTranslation("common", { keyPrefix: "editCard.tagsMenu" })

  if (availableTags.length === 0) {
    return null
  }

  return (
    <Host matchContents>
      <Menu
        label={t("accessibilityLabel")}
        systemImage="tag"
        modifiers={[labelStyle("iconOnly")]}
      >
        {availableTags.map((tag) => (
          <Button key={tag} label={tag} onPress={() => onSelectTag(tag)} />
        ))}
      </Menu>
    </Host>
  )
}
