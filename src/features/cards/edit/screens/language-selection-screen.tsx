import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { SymbolView } from "expo-symbols"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Pressable, ScrollView, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import { TTS_LANGUAGE_NATIVE_LABELS } from "@/features/cards/audio/components/audio-labels"
import {
  clearAudioSelectionDraftSide,
  setAudioSelectionDraftCreating,
  useAudioSelectionDraft,
} from "@/features/cards/audio/lib/audio-selection-draft"
import {
  SUPPORTED_TTS_LOCALES,
  type SupportedTtsLocale,
} from "@/features/cards/audio/model/card-audio"
import type { VisibleCardSide } from "@/features/cards/model/card"

const checkmarkIconName = "checkmark" as const

function isVisibleCardSide(value: unknown): value is VisibleCardSide {
  return value === "front" || value === "back"
}

export default function LanguageSelectionScreen() {
  const { dismiss } = useRouter()
  const { theme } = useUnistyles()
  const { t, i18n } = useTranslation("editCard")
  const { t: tCommon } = useTranslation("common")
  const params = useLocalSearchParams<{ side?: string | string[] }>()
  const side = isVisibleCardSide(params.side) ? params.side : "front"
  const audioSelectionDraft = useAudioSelectionDraft()
  const sideDraft = audioSelectionDraft[side]
  const preferredLocale: SupportedTtsLocale =
    i18n.resolvedLanguage === "de" ? "de-DE" : "en-US"
  const currentLocale = sideDraft.locale
  const [selectedLocale, setSelectedLocale] =
    useState<SupportedTtsLocale | null>(currentLocale)
  const [lastNonNullSelectedLocale, setLastNonNullSelectedLocale] =
    useState<SupportedTtsLocale | null>(currentLocale)
  const hasExistingAudioAsset =
    sideDraft.fileUrl != null || sideDraft.assetId != null
  const handleDismiss = () => {
    dismiss()
  }
  const handleSave = () => {
    if (selectedLocale === null) {
      if (hasExistingAudioAsset) {
        Alert.alert(
          t("languageSelection.deleteConfirmation.title"),
          t("languageSelection.deleteConfirmation.message"),
          [
            {
              text: t("languageSelection.deleteConfirmation.cancel"),
              style: "cancel",
              onPress: () => {
                setSelectedLocale(lastNonNullSelectedLocale)
              },
            },
            {
              text: tCommon("delete"),
              style: "destructive",
              onPress: () => {
                clearAudioSelectionDraftSide(side)
                dismiss()
              },
            },
          ],
        )
        return
      }

      clearAudioSelectionDraftSide(side)
      dismiss()
      return
    }

    setAudioSelectionDraftCreating(side, selectedLocale)
    dismiss()
  }
  const languages = useMemo(() => {
    const orderedLocales = [
      preferredLocale,
      ...SUPPORTED_TTS_LOCALES.filter((locale) => locale !== preferredLocale),
    ]

    return [
      {
        locale: null,
        label: t("languageSelection.none"),
        nativeLabel: null,
      },
      ...orderedLocales.map((locale) => ({
        locale,
        label: t(`languageSelection.languages.${locale}.label`),
        nativeLabel: TTS_LANGUAGE_NATIVE_LABELS[locale],
      })),
    ]
  }, [preferredLocale, t])

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerTransparent: true,
          headerShadowVisible: false,
          unstable_headerLeftItems: () => [
            {
              type: "button" as const,
              label: tCommon("cancel"),
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
              label: t("saveCard"),
              icon: {
                type: "sfSymbol" as const,
                name: "checkmark" as const,
              },
              tintColor: theme.colors.accent,
              variant: "prominent" as const,
              onPress: handleSave,
            },
          ],
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
              language.locale != null &&
              language.locale !== preferredLocale &&
              language.nativeLabel !== language.label
            const isSelected = language.locale === selectedLocale

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={language.locale ?? "none"}
                onPress={() => {
                  setSelectedLocale(language.locale)

                  if (language.locale !== null) {
                    setLastNonNullSelectedLocale(language.locale)
                  }
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
}))
