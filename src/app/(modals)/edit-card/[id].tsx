import { useLocalSearchParams, useRouter } from "expo-router"
import { Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import EditCard from "@/components/edit-card/edit-card"
import LoadingScreen from "@/components/UI/loading-screen"
import { useCard } from "@/hooks/use-card"

export default function Page() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { dismiss } = useRouter()
  const { card, isLoading, error } = useCard(id)

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

  return <EditCard initialCard={card} onClose={dismiss} />
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
