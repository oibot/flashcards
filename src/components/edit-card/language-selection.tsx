import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { SymbolView } from "expo-symbols"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, ScrollView, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import AndroidHeader from "@/components/UI/android-header"
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

const checkmarkIconName = { ios: "checkmark", android: "done" } as const

function isVisibleCardSide(value: unknown): value is VisibleCardSide {
  return value === "front" || value === "back"
}

export default function LanguageSelection() {
  const { dismiss } = useRouter()
  const { theme } = useUnistyles()
  const { t: tSoundSheet, i18n } = useTranslation("common", {
    keyPrefix: "editCard.soundSheet",
  })
  const { t: tEditCard } = useTranslation("common", { keyPrefix: "editCard" })
  const params = useLocalSearchParams<{ side?: string | string[] }>()
  const side = isVisibleCardSide(params.side) ? params.side : "front"
  const isIOS = Platform.OS === "ios"
  const isAndroid = Platform.OS === "android"
  const sideLabel = tSoundSheet(side)
  const preferredLocale: SupportedTtsLocale =
    i18n.resolvedLanguage === "de" ? "de-DE" : "en-US"
  const [selectedLocale, setSelectedLocale] =
    useState<SupportedTtsLocale | null>(null)
  const handleDismiss = () => {
    dismiss()
  }
  const languages = useMemo(() => {
    const orderedLocales = [
      preferredLocale,
      ...SUPPORTED_TTS_LOCALES.filter((locale) => locale !== preferredLocale),
    ]

    return orderedLocales.map((locale) => ({
      locale,
      label: tSoundSheet(`languages.${locale}.label`),
      nativeLabel: TTS_LANGUAGE_NATIVE_LABELS[locale],
    }))
  }, [preferredLocale, tSoundSheet])

  return (
    <>
      <Stack.Screen
        options={{
          title: isIOS ? "" : tSoundSheet("title", { side: sideLabel }),
          headerTransparent: isIOS,
          headerShadowVisible: false,
          ...(isIOS
            ? {
                unstable_headerLeftItems: () => [
                  {
                    type: "button" as const,
                    label: tEditCard("cancel"),
                    icon: {
                      type: "sfSymbol" as const,
                      name: "xmark" as const,
                    },
                    tintColor: theme.colors.primary,
                    onPress: handleDismiss,
                  },
                ],
                unstable_headerRightItems: () => [
                  {
                    type: "button" as const,
                    label: tEditCard("saveCard"),
                    icon: {
                      type: "sfSymbol" as const,
                      name: "checkmark" as const,
                    },
                    tintColor: theme.colors.accent,
                    variant: "prominent",
                    onPress: handleDismiss,
                  },
                ],
              }
            : {
                header: () =>
                  isAndroid ? (
                    <AndroidHeader
                      title={tSoundSheet("title", { side: sideLabel })}
                      closeAccessibilityLabel={tEditCard(
                        "cancelAccessibilityLabel",
                      )}
                      onClose={handleDismiss}
                      rightAction={
                        <Pressable
                          accessibilityLabel={tEditCard(
                            "saveCardAccessibilityLabel",
                          )}
                          accessibilityRole="button"
                          onPress={handleDismiss}
                          style={styles.androidHeaderSaveButton}
                        >
                          <Text style={styles.androidHeaderSaveLabel}>
                            {tEditCard("saveCard")}
                          </Text>
                        </Pressable>
                      }
                    />
                  ) : null,
              }),
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
            const isSelected = language.locale === selectedLocale

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={language.locale}
                onPress={() => {
                  setSelectedLocale(language.locale)
                }}
                style={({ pressed }) => [
                  styles.languageRow,
                  pressed ? styles.languageRowPressed : null,
                  isSelected ? styles.languageRowSelected : null,
                ]}
              >
                <View style={styles.languageLabelGroup}>
                  <Text style={styles.languageLabel}>{language.label}</Text>
                  {showNativeLabel ? (
                    <Text style={styles.languageNativeLabel}>
                      {language.nativeLabel}
                    </Text>
                  ) : null}
                </View>
                {isSelected ? (
                  <SymbolView
                    name={checkmarkIconName}
                    size={18}
                    tintColor={theme.colors.accent}
                  />
                ) : null}
              </Pressable>
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
  languageRowPressed: {
    opacity: 0.85,
  },
  languageRowSelected: {
    borderColor: theme.colors.accent,
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
  androidHeaderSaveButton: {
    minHeight: 40,
    minWidth: 70,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
  },
  androidHeaderSaveLabel: {
    ...theme.typography.styles.subheadline,
    color: theme.colors.background,
    fontWeight: "600",
  },
}))
