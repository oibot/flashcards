import { Pressable, Text, View } from "react-native"
import { Stack } from "expo-router"
import { StyleSheet, useUnistyles } from "react-native-unistyles"
import HeaderButtonIcon from "@/components/UI/header-button-icon"

type Props = {
  onNewCard: () => void
  onReviewStart: () => void
}

export default function ReviewPrepScene({ onNewCard, onReviewStart }: Props) {
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
        <Pressable onPress={onReviewStart}>
          <Text>Start Review</Text>
        </Pressable>
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
