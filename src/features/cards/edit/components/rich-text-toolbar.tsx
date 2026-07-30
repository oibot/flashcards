import { useTranslation } from "react-i18next"
import { ScrollView, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import {
  getRichTextAlignment,
  getRichTextSize,
  type RichTextAlignment,
  type RichTextEditorState,
  type RichTextInlineStyle,
  type RichTextSize,
} from "@/features/cards/edit/lib/rich-text-editor"

import RichTextToolbarButton from "./rich-text-toolbar-button"
import RichTextToolbarMenu, {
  type RichTextToolbarMenuOption,
} from "./rich-text-toolbar-menu"

export type RichTextToolbarProps = {
  onSetAlignment: (alignment: RichTextAlignment) => void
  onSetTextSize: (size: RichTextSize) => void
  onToggleInlineStyle: (style: RichTextInlineStyle) => void
  stylesState: RichTextEditorState | null
}

export default function RichTextToolbar({
  onSetAlignment,
  onSetTextSize,
  onToggleInlineStyle,
  stylesState,
}: RichTextToolbarProps) {
  const { t } = useTranslation("editCard")
  const alignment = getRichTextAlignment(stylesState)
  const textSize = getRichTextSize(stylesState)
  const alignmentOptions: RichTextToolbarMenuOption<RichTextAlignment>[] = [
    {
      label: t("formatting.alignment.left"),
      systemImage: "text.alignleft",
      value: "left",
    },
    {
      label: t("formatting.alignment.center"),
      systemImage: "text.aligncenter",
      value: "center",
    },
    {
      label: t("formatting.alignment.right"),
      systemImage: "text.alignright",
      value: "right",
    },
  ]
  const textSizeOptions: RichTextToolbarMenuOption<RichTextSize>[] = [
    {
      label: t("formatting.textSize.body"),
      systemImage: "textformat.size.smaller",
      value: "body",
    },
    {
      label: t("formatting.textSize.large"),
      systemImage: "textformat.size",
      value: "large",
    },
    {
      label: t("formatting.textSize.title"),
      systemImage: "textformat.size.larger",
      value: "title",
    },
  ]

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        contentContainerStyle={styles.content}
        showsHorizontalScrollIndicator={false}
      >
        <RichTextToolbarButton
          accessibilityLabel={t("formatting.bold")}
          icon="bold"
          isActive={stylesState?.bold.isActive ?? false}
          isDisabled={stylesState?.bold.isBlocking ?? false}
          onPress={() => onToggleInlineStyle("bold")}
        />
        <RichTextToolbarButton
          accessibilityLabel={t("formatting.italic")}
          icon="italic"
          isActive={stylesState?.italic.isActive ?? false}
          isDisabled={stylesState?.italic.isBlocking ?? false}
          onPress={() => onToggleInlineStyle("italic")}
        />
        <RichTextToolbarMenu
          accessibilityLabel={t("formatting.alignment.label")}
          onSelect={onSetAlignment}
          options={alignmentOptions}
          selectedValue={alignment}
          systemImage={
            alignmentOptions.find((option) => option.value === alignment)
              ?.systemImage ?? "text.alignleft"
          }
        />
        <RichTextToolbarMenu
          accessibilityLabel={t("formatting.textSize.label")}
          onSelect={onSetTextSize}
          options={textSizeOptions}
          selectedValue={textSize}
          systemImage="textformat.size"
        />
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
