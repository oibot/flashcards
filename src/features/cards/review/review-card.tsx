import { useTranslation } from "react-i18next"
import { Alert, Pressable, Text, View } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import { useReviewCardAudio } from "@/features/cards/audio/use-review-card-audio"
import { IconButtonAudio } from "@/shared/ui/icon-button"

import ReviewCardContent from "./review-card-content"

const CARD_HEIGHT_RATIO = 0.65

type Props = {
  cardId: string
  headerLabel: string
  hasSound: boolean
  visibleSide: "front" | "back"
  visibleHtml: string
  isSubmitting: boolean
  onReveal: () => void
}

export default function ReviewCard({
  cardId,
  headerLabel,
  hasSound,
  visibleSide,
  visibleHtml,
  isSubmitting,
  onReveal,
}: Props) {
  const { rt, theme } = useUnistyles()
  const { t } = useTranslation("common", { keyPrefix: "reviewSession.active" })
  const isAnswerVisible = visibleSide === "back"
  const cardHeight = rt.screen.height * CARD_HEIGHT_RATIO
  const audio = useReviewCardAudio({
    cardId,
    visibleSide,
  })
  const audioTintColor = audio.isPlaying
    ? theme.colors.accent
    : theme.colors.primary

  return (
    <View style={styles.cardStage}>
      <View
        style={[
          styles.cardSurface,
          { minHeight: cardHeight, paddingBottom: hasSound ? 72 : 24 },
        ]}
      >
        <Text numberOfLines={1} style={styles.tagLabel}>
          {headerLabel}
        </Text>
        <Pressable
          accessibilityRole={!isAnswerVisible ? "button" : undefined}
          disabled={isSubmitting || isAnswerVisible}
          onPress={onReveal}
          style={styles.cardBody}
        >
          <View pointerEvents="none" style={styles.cardContainer}>
            <ReviewCardContent
              key={`${cardId}-${visibleSide}`}
              html={visibleHtml}
            />
          </View>
        </Pressable>
        {hasSound ? (
          <IconButtonAudio
            accessibilityLabel={t("playAudioAccessibilityLabel")}
            disabled={audio.isLoading}
            loading={audio.isLoading}
            onPress={async () => {
              const result = await audio.playAudio()

              if (!result.ok) {
                Alert.alert(result.message)
              }
            }}
            size={28}
            style={styles.audioButton}
            tintColor={audioTintColor}
          />
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  cardStage: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cardSurface: {
    position: "relative",
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 72,
    gap: 16,
    borderRadius: 28,
    borderCurve: "continuous",
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.chromeMuted,
    boxShadow: `0 18px 30px ${theme.colors.shadowSoft}`,
  },
  tagLabel: {
    ...theme.typography.styles.caption,
    textAlign: "center",
    color: theme.colors.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  audioButton: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 60,
    height: 60,
    backgroundColor: theme.colors.chromeMuted,
  },
  cardBody: {
    flex: 1,
    justifyContent: "center",
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
}))
