import { Stack, useRouter } from "expo-router"
import { Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"
import HeaderButtonIcon from "@/components/UI/header-button-icon"

export default function NewDeck() {
  const { theme } = useUnistyles()
  const { back } = useRouter()

  const handleCancel = () => {
    back()
  }

  const handleSave = () => {
    back()
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <HeaderButtonIcon
              icon="xmark"
              accessibilityLabel="Cancel"
              onPress={handleCancel}
              style={styles.cancelButton}
              tintColor={theme.colors.primary}
            />
          ),
          headerRight: () => (
            <HeaderButtonIcon
              icon="checkmark"
              accessibilityLabel="Save"
              onPress={handleSave}
              style={styles.confirmButton}
              tintColor={theme.colors.background}
            />
          ),
        }}
      />
      <View style={styles.container}>
        <Text style={styles.title}>New Deck</Text>
        <Text style={styles.subtitle}>Form content goes here.</Text>
      </View>
    </>
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
  cancelButton: {
    backgroundColor: theme.colors.chromeMuted,
  },
  confirmButton: {
    backgroundColor: theme.colors.accent,
  },
}))
