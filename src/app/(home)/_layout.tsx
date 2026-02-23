import { Stack, useRouter } from "expo-router"
import { StyleSheet, useUnistyles } from "react-native-unistyles"
import HeaderButtonIcon from "@/components/UI/header-button-icon"

export default function Layout() {
  const { theme } = useUnistyles()
  const { push } = useRouter()

  const handleAddDeck = () => {
    push("/(home)/new-deck")
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: styles.container,
        headerBackButtonDisplayMode: "minimal",
        headerShadowVisible: false,
        headerTransparent: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Decks",
          headerRight: () => (
            <HeaderButtonIcon
              icon="plus"
              accessibilityLabel="Add new deck"
              onPress={handleAddDeck}
              tintColor={theme.colors.primary}
            />
          ),
        }}
      />
      <Stack.Screen
        name="new-deck"
        options={{
          title: "New Deck",
          presentation: "formSheet",
          sheetAllowedDetents: [0.5],
          sheetInitialDetentIndex: 0,
          headerTransparent: false,
        }}
      />
    </Stack>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
  },
}))
