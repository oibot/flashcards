import { Link, Stack } from "expo-router"
import { Pressable, Text } from "react-native"
import { StyleSheet } from "react-native-unistyles"
import { SymbolView } from "expo-symbols"

export default function Layout() {
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
            <Link href="/(home)/new-deck" asChild>
              <Pressable>
                <SymbolView name="plus" />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Stack.Screen
        name="new-deck"
        options={{
          title: "New Deck",
          presentation: "formSheet",
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
