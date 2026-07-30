import { Button, Host, Menu } from "@expo/ui/swift-ui"
import {
  accessibilityLabel as accessibilityLabelModifier,
  accessibilityValue,
} from "@expo/ui/swift-ui/modifiers"
import type { ComponentProps } from "react"

export type RichTextToolbarMenuOption<Value extends string> = {
  label: string
  systemImage: string
  value: Value
}

type RichTextToolbarMenuProps<Value extends string> = {
  accessibilityLabel: string
  onSelect: (value: Value) => void
  options: RichTextToolbarMenuOption<Value>[]
  selectedValue: Value
  systemImage: string
}

export default function RichTextToolbarMenu<Value extends string>({
  accessibilityLabel,
  onSelect,
  options,
  selectedValue,
  systemImage,
}: RichTextToolbarMenuProps<Value>) {
  const selectedOption =
    options.find((option) => option.value === selectedValue) ?? options[0]

  if (!selectedOption) return null

  return (
    <Host matchContents>
      <Menu
        label={selectedOption.label}
        modifiers={[
          accessibilityLabelModifier(accessibilityLabel),
          accessibilityValue(selectedOption.label),
        ]}
        systemImage={systemImage}
      >
        {options.map((option) => (
          <Button
            key={option.value}
            label={option.label}
            onPress={() => onSelect(option.value)}
            systemImage={
              (option.value === selectedValue
                ? "checkmark"
                : option.systemImage) as ComponentProps<
                typeof Button
              >["systemImage"]
            }
          />
        ))}
      </Menu>
    </Host>
  )
}
