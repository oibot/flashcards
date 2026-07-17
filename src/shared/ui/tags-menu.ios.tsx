import { Button, Host, Menu } from "@expo/ui/swift-ui"
import { labelStyle } from "@expo/ui/swift-ui/modifiers"

type TagsMenuProps = {
  accessibilityLabel: string
  availableTags: string[]
  cancelLabel: string
  onSelectTag: (tag: string) => void
  title: string
}

export default function TagsMenu({
  accessibilityLabel,
  availableTags,
  onSelectTag,
}: TagsMenuProps) {
  if (availableTags.length === 0) {
    return null
  }

  return (
    <Host matchContents>
      <Menu
        label={accessibilityLabel}
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
