import { Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"
import { Stack } from "expo-router"
import HeaderButtonIcon from "@/components/UI/header-button-icon"

type Props = {
  onNewCard: () => void
}

export default function ReviewScene({ onNewCard }: Props) {
  const { theme } = useUnistyles()

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButtonIcon
              icon="plus"
              tintColor={theme.colors.accent}
              accessibilityLabel="Create new card"
              onPress={onNewCard}
            />
          ),
        }}
      />
      <View style={styles.container}>
        <Text>Training</Text>
      </View>
    </>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
}))
