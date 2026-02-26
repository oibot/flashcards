import { Deck } from "@/domain/deck"
import { toExpoFontWeight } from "@/utils/expo-font"
import { Host, List, Text, VStack } from "@expo/ui/swift-ui"
import { useUnistyles } from "react-native-unistyles"
import { font } from "@expo/ui/swift-ui/modifiers"

type Props = {
  decks: Array<Deck>
}

export default function DecksList({ decks }: Props) {
  const { rt, theme } = useUnistyles()
  const contentSizeCategory = rt.contentSizeCategory
  const titleTypography = theme.typography.getScaledStyle(
    "headline",
    contentSizeCategory,
  )
  const descriptionTypography = theme.typography.getScaledStyle(
    "caption",
    contentSizeCategory,
  )

  return (
    <Host key={contentSizeCategory} style={{ flex: 1 }}>
      <List>
        <List.ForEach>
          {decks.map((deck) => {
            return (
              <VStack key={deck.id} alignment="leading">
                <Text
                  modifiers={[
                    font({
                      size: titleTypography.fontSize,
                      weight: toExpoFontWeight(titleTypography.fontWeight),
                    }),
                  ]}
                >
                  {deck.title}
                </Text>
                {!!deck.description && (
                  <Text
                    modifiers={[
                      font({
                        size: descriptionTypography.fontSize,
                        weight: toExpoFontWeight(descriptionTypography.fontWeight),
                      }),
                    ]}
                  >
                    {deck.description}
                  </Text>
                )}
              </VStack>
            )
          })}
        </List.ForEach>
      </List>
    </Host>
  )
}
