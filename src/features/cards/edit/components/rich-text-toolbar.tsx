import { useState } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"
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
import RichTextToolbarOptions, {
  type RichTextToolbarOption,
} from "./rich-text-toolbar-options"

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
  const [expandedControl, setExpandedControl] = useState<
    "alignment" | "textSize" | null
  >(null)
  const alignment = getRichTextAlignment(stylesState)
  const textSize = getRichTextSize(stylesState)
  const alignmentOptions: RichTextToolbarOption<RichTextAlignment>[] = [
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
  const textSizeOptions: RichTextToolbarOption<RichTextSize>[] = [
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
      <View style={styles.controls}>
        {expandedControl === "alignment" ? (
          <RichTextToolbarOptions
            closeAccessibilityLabel={t("cancelAccessibilityLabel")}
            display="icons"
            onClose={() => setExpandedControl(null)}
            onSelect={onSetAlignment}
            options={alignmentOptions}
            selectedValue={alignment}
          />
        ) : expandedControl === "textSize" ? (
          <RichTextToolbarOptions
            closeAccessibilityLabel={t("cancelAccessibilityLabel")}
            display="labels"
            onClose={() => setExpandedControl(null)}
            onSelect={onSetTextSize}
            options={textSizeOptions}
            selectedValue={textSize}
          />
        ) : (
          <>
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
            <View style={styles.separatorContainer}>
              <View style={styles.separator} />
            </View>
            <RichTextToolbarButton
              accessibilityLabel={t("formatting.alignment.label")}
              icon={
                alignmentOptions.find((option) => option.value === alignment)
                  ?.systemImage ?? "text.alignleft"
              }
              isActive={false}
              isDisabled={false}
              onPress={() => setExpandedControl("alignment")}
            />
            <RichTextToolbarButton
              accessibilityLabel={t("formatting.textSize.label")}
              isActive={false}
              isDisabled={false}
              onPress={() => setExpandedControl("textSize")}
              text={
                textSizeOptions.find((option) => option.value === textSize)
                  ?.label ?? t("formatting.textSize.body")
              }
            />
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: "100%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  separatorContainer: {
    height: 36,
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.chromeMuted,
  },
}))
