import { useLocalSearchParams, useRouter } from "expo-router"
import { Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import EditCardScreen from "@/features/cards/edit/screens/edit-card-screen"
import { useCard } from "@/features/cards/queries/use-card"
import LoadingScreen from "@/shared/ui/loading-screen"

export default function EditCardRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { dismiss } = useRouter()
  const { card, isLoading, error } = useCard(id)

  const handleClose = () => {
    dismiss()
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error || !card) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          {error?.message ?? "Could not load card."}
        </Text>
      </View>
    )
  }

  return <EditCardScreen initialCard={card} onClose={handleClose} />
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: theme.colors.background,
  },
  message: {
    ...theme.typography.styles.body,
    color: theme.colors.secondary,
    textAlign: "center",
  },
}))
