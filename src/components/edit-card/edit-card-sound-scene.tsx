import { Stack, useLocalSearchParams } from "expo-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import type { VisibleCardSide } from "@/domain/card"
import {
  SUPPORTED_TTS_LOCALES,
  type SupportedTtsLocale,
} from "@/domain/card-audio"

const TTS_LANGUAGE_NATIVE_LABELS = {
  "en-US": "English",
  "ja-JP": "日本語",
  "zh-CN": "中文",
  "de-DE": "Deutsch",
  "hi-IN": "हिन्दी",
  "fr-FR": "Français",
  "ko-KR": "한국어",
  "pt-BR": "Português",
  "it-IT": "Italiano",
  "es-ES": "Español",
  "id-ID": "Bahasa Indonesia",
  "nl-NL": "Nederlands",
  "tr-TR": "Türkçe",
  "fil-PH": "Filipino",
  "pl-PL": "Polski",
  "sv-SE": "Svenska",
  "bg-BG": "Български",
  "ro-RO": "Română",
  "ar-SA": "العربية",
  "cs-CZ": "Čeština",
  "el-GR": "Ελληνικά",
  "fi-FI": "Suomi",
  "hr-HR": "Hrvatski",
  "ms-MY": "Bahasa Melayu",
  "sk-SK": "Slovenčina",
  "da-DK": "Dansk",
  "ta-IN": "தமிழ்",
  "uk-UA": "Українська",
  "ru-RU": "Русский",
} satisfies Record<SupportedTtsLocale, string>

function isVisibleCardSide(value: unknown): value is VisibleCardSide {
  return value === "front" || value === "back"
}

export default function EditCardSoundScene() {
  const { t, i18n } = useTranslation("common", {
    keyPrefix: "editCard.soundSheet",
  })
  const params = useLocalSearchParams<{ side?: string | string[] }>()
  const side = isVisibleCardSide(params.side) ? params.side : "front"
  const sideLabel = t(side)
  const preferredLocale: SupportedTtsLocale =
    i18n.resolvedLanguage === "de" ? "de-DE" : "en-US"
  const languages = useMemo(() => {
    const orderedLocales = [
      preferredLocale,
      ...SUPPORTED_TTS_LOCALES.filter((locale) => locale !== preferredLocale),
    ]

    return orderedLocales.map((locale) => ({
      locale,
      label: t(`languages.${locale}.label`),
      nativeLabel: TTS_LANGUAGE_NATIVE_LABELS[locale],
    }))
  }, [preferredLocale, t])

  return (
    <>
      <Stack.Screen
        options={{
          title: t("title", { side: sideLabel }),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        style={styles.container}
      >
        <View style={styles.languageList}>
          {languages.map((language) => {
            const showNativeLabel =
              language.locale !== preferredLocale &&
              language.nativeLabel !== language.label

            return (
              <View key={language.locale} style={styles.languageRow}>
                <View style={styles.languageLabelGroup}>
                  <Text style={styles.languageLabel}>{language.label}</Text>
                  {showNativeLabel ? (
                    <Text style={styles.languageNativeLabel}>
                      {language.nativeLabel}
                    </Text>
                  ) : null}
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: Math.max(rt.insets.bottom, 24),
  },
  languageList: {
    gap: 8,
  },
  languageRow: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 18,
    borderCurve: "continuous",
    backgroundColor: theme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: theme.colors.chromeMuted,
  },
  languageLabelGroup: {
    flex: 1,
    gap: 2,
  },
  languageLabel: {
    ...theme.typography.styles.body,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  languageNativeLabel: {
    ...theme.typography.styles.caption,
    color: theme.colors.secondary,
  },
}))
