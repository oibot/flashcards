import { SymbolView } from "expo-symbols"
import type { ComponentProps } from "react"
import { Pressable, Text } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import RichTextToolbarButton from "./rich-text-toolbar-button"

type ToolbarSymbol = Extract<ComponentProps<typeof SymbolView>["name"], string>

export type RichTextToolbarOption<Value extends string> = {
  label: string
  systemImage: ToolbarSymbol
  value: Value
}

type RichTextToolbarOptionsProps<Value extends string> = {
  closeAccessibilityLabel: string
  display: "icons" | "labels"
  onClose: () => void
  onSelect: (value: Value) => void
  options: RichTextToolbarOption<Value>[]
  selectedValue: Value
}

export default function RichTextToolbarOptions<Value extends string>({
  closeAccessibilityLabel,
  display,
  onClose,
  onSelect,
  options,
  selectedValue,
}: RichTextToolbarOptionsProps<Value>) {
  const { theme } = useUnistyles()

  return (
    <>
      <RichTextToolbarButton
        accessibilityLabel={closeAccessibilityLabel}
        icon="chevron.backward"
        isActive={false}
        isDisabled={false}
        onPress={onClose}
      />
      {options.map((option) => {
        const isSelected = option.value === selectedValue

        return (
          <Pressable
            accessibilityLabel={option.label}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={option.value}
            onPress={() => {
              onSelect(option.value)
              onClose()
            }}
            style={({ pressed }) => [
              styles.option,
              display === "labels" && styles.labelOption,
              isSelected && styles.optionSelected,
              pressed && styles.optionPressed,
            ]}
          >
            {display === "icons" ? (
              <SymbolView
                name={option.systemImage}
                size={18}
                tintColor={
                  isSelected ? theme.colors.accent : theme.colors.primary
                }
              />
            ) : (
              <Text
                numberOfLines={1}
                style={[styles.label, isSelected && styles.labelSelected]}
              >
                {option.label}
              </Text>
            )}
          </Pressable>
        )
      })}
    </>
  )
}

const styles = StyleSheet.create((theme) => ({
  option: {
    width: 40,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    borderCurve: "continuous",
  },
  labelOption: {
    width: "auto",
    minWidth: 52,
    paddingHorizontal: 10,
  },
  optionSelected: {
    backgroundColor: theme.colors.chromeMuted,
  },
  optionPressed: {
    opacity: 0.45,
  },
  label: {
    ...theme.typography.styles.subheadline,
    color: theme.colors.primary,
  },
  labelSelected: {
    color: theme.colors.accent,
    fontWeight: "600",
  },
}))
