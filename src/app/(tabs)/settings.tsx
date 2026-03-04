import { Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

export default function Page() {
  return (
    <View style={styles.container}>
      <Text>Settings</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})
