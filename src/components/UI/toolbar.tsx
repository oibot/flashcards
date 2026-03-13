import { ScrollView, View } from "react-native"
import type { OnChangeStateEvent } from "react-native-enriched"
import { StyleSheet } from "react-native-unistyles"

import ToolbarButton from "./toolbar-button"

export const STYLE_ITEMS = [
  {
    name: "bold",
    icon: "bold",
  },
  {
    name: "italic",
    icon: "italic",
  },
  {
    name: "underline",
    icon: "underline",
  },
  {
    name: "strikethrough",
    icon: "strikethrough",
  },
  {
    name: "heading-1",
    text: "H1",
  },
  {
    name: "heading-2",
    text: "H2",
  },
  {
    name: "heading-3",
    text: "H3",
  },
] as const

export type ToolbarItem = (typeof STYLE_ITEMS)[number]
export type ToolbarStyleKey =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "h1"
  | "h2"
  | "h3"

export type SharedToolbarState = Record<ToolbarStyleKey, boolean>

export type ToolbarProps = {
  activeStyles: SharedToolbarState
  stylesState: OnChangeStateEvent | null
  onToggleStyle: (item: ToolbarItem) => void
}

export const stateKeyByItemName: Record<ToolbarItem["name"], ToolbarStyleKey> =
  {
    bold: "bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "strikeThrough",
    "heading-1": "h1",
    "heading-2": "h2",
    "heading-3": "h3",
  }

export default function Toolbar({
  activeStyles,
  stylesState,
  onToggleStyle,
}: ToolbarProps) {
  const getStateForItem = (item: ToolbarItem) => {
    const stateKey = stateKeyByItemName[item.name]
    return stylesState?.[stateKey]
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        contentContainerStyle={styles.content}
        showsHorizontalScrollIndicator={false}
      >
        {STYLE_ITEMS.map((item) => {
          const itemState = getStateForItem(item)

          return (
            <ToolbarButton
              key={item.name}
              {...item}
              isActive={activeStyles[stateKeyByItemName[item.name]]}
              isDisabled={itemState?.isBlocking ?? false}
              onPress={() => onToggleStyle(item)}
            />
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 48,
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 8,
  },
})
