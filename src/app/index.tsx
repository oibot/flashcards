import { Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"
import { useTranslation } from "react-i18next"

export default function Page() {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t("Page")}</Text>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  text: {
    textAlign: "center",
    color: theme.colors.primary,
  },
}))
