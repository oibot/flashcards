import { Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

export default function NewDeck() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Deck</Text>
      <Text style={styles.subtitle}>Form content goes here.</Text>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.primary,
    opacity: 0.7,
  },
}))
