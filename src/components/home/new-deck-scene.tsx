import { Stack, useRouter } from "expo-router"
import { useState } from "react"
import { Text, TextInput, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"
import HeaderButtonIcon from "@/components/UI/header-button-icon"
import { SafeAreaView } from "react-native-safe-area-context"

export default function NewDeck() {
  const { theme } = useUnistyles()
  const { back } = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

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
      <SafeAreaView style={styles.container}>
        <View style={styles.field}>
          <Text style={styles.label}>Deck name</Text>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            placeholder="e.g. French Basics"
            placeholderTextColor={styles.placeholder.color}
            returnKeyType="done"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            autoCapitalize="sentences"
            placeholder="Optional notes about this deck"
            placeholderTextColor={styles.placeholder.color}
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
          />
        </View>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.chromeMuted,
    borderRadius: 14,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  placeholder: {
    color: theme.colors.primary,
    opacity: 0.4,
  },
  cancelButton: {
    backgroundColor: theme.colors.chromeMuted,
  },
  confirmButton: {
    backgroundColor: theme.colors.accent,
  },
}))
