import { Deck } from "@/domain/deck"
import { FlatList, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

type Props = {
  decks: Array<Deck>
}

export default function DecksList({ decks }: Props) {
  const { rt } = useUnistyles()
  const contentSizeCategory = rt.contentSizeCategory

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={decks}
      key={contentSizeCategory}
      keyExtractor={(deck) => deck.id}
      renderItem={({ item: deck }) => {
        return (
          <View style={styles.row}>
            <Text numberOfLines={1} style={styles.title(contentSizeCategory)}>
              {deck.title}
            </Text>
            {!!deck.description && (
              <Text
                numberOfLines={2}
                style={styles.description(contentSizeCategory)}
              >
                {deck.description}
              </Text>
            )}
          </View>
        )
      }}
      style={styles.list}
    />
  )
}

const styles = StyleSheet.create((theme) => ({
  list: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingVertical: 8,
  },
  row: {
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: (contentSizeCategory) => ({
    ...theme.typography.getScaledStyle("headline", contentSizeCategory),
    color: theme.colors.primary,
  }),
  description: (contentSizeCategory) => ({
    ...theme.typography.getScaledStyle("caption", contentSizeCategory),
    color: theme.colors.primary,
    opacity: 0.65,
  }),
}))
