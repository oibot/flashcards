import type { TextStyle } from "react-native"
import type {
  AndroidContentSizeCategory,
  IOSContentSizeCategory,
} from "react-native-unistyles"
import { StyleSheet } from "react-native-unistyles"

type ContentSizeCategory =
  | IOSContentSizeCategory
  | AndroidContentSizeCategory
  | "unspecified"
  | "web-unspecified"

const textScaleByCategory: Record<ContentSizeCategory, number> = {
  xSmall: 0.9,
  Small: 0.95,
  Medium: 1,
  Large: 1.05,
  xLarge: 1.12,
  xxLarge: 1.2,
  xxxLarge: 1.3,
  accessibilityMedium: 1.45,
  accessibilityLarge: 1.6,
  accessibilityExtraLarge: 1.75,
  accessibilityExtraExtraLarge: 1.9,
  accessibilityExtraExtraExtraLarge: 2.1,
  Default: 1,
  ExtraLarge: 1.25,
  Huge: 1.4,
  ExtraHuge: 1.6,
  ExtraExtraHuge: 1.8,
  unspecified: 1,
  "web-unspecified": 1,
}

type TypographyStyle = {
  fontSize: number
  fontWeight: NonNullable<TextStyle["fontWeight"]>
}

const typographyStyles = {
  largeTitle: { fontSize: 34, fontWeight: "400" },
  title: { fontSize: 28, fontWeight: "400" },
  title2: { fontSize: 22, fontWeight: "400" },
  title3: { fontSize: 20, fontWeight: "400" },
  headline: { fontSize: 17, fontWeight: "600" },
  body: { fontSize: 17, fontWeight: "400" },
  callout: { fontSize: 16, fontWeight: "400" },
  subheadline: { fontSize: 15, fontWeight: "400" },
  footnote: { fontSize: 13, fontWeight: "400" },
  caption: { fontSize: 12, fontWeight: "400" },
  caption2: { fontSize: 11, fontWeight: "400" },
} as const satisfies Record<string, TypographyStyle>

type TypographyStyleName = keyof typeof typographyStyles

function getTextScale(contentSizeCategory?: ContentSizeCategory) {
  if (!contentSizeCategory) return 1
  return textScaleByCategory[contentSizeCategory] ?? 1
}

const typography = {
  textScaleByCategory,
  sizes: {
    largeTitle: typographyStyles.largeTitle.fontSize,
    title: typographyStyles.title.fontSize,
    title2: typographyStyles.title2.fontSize,
    title3: typographyStyles.title3.fontSize,
    headline: typographyStyles.headline.fontSize,
    body: typographyStyles.body.fontSize,
    callout: typographyStyles.callout.fontSize,
    subheadline: typographyStyles.subheadline.fontSize,
    footnote: typographyStyles.footnote.fontSize,
    caption: typographyStyles.caption.fontSize,
    caption2: typographyStyles.caption2.fontSize,
  },
  styles: {
    ...typographyStyles,
  },
  getScaledSize(size: number, contentSizeCategory?: ContentSizeCategory) {
    return size * getTextScale(contentSizeCategory)
  },
  getScaledStyle(
    styleName: TypographyStyleName,
    contentSizeCategory?: ContentSizeCategory,
  ) {
    const style = typographyStyles[styleName]
    return {
      ...style,
      fontSize: style.fontSize * getTextScale(contentSizeCategory),
    }
  },
}

const lightTheme = {
  colors: {
    primary: "black",
    secondary: "#6B7280",
    background: "white",
    secondaryBackground: "#F3F4F6",
    accent: "#0A84FF",
    destructive: "#D11A2A",
    warning: "#D98E04",
    success: "#1F9D55",
    chromeMuted: "rgba(0, 0, 0, 0.08)",
    shadowSoft: "rgba(0, 0, 0, 0.08)",
  },
  typography,
}

const otherTheme = {
  colors: {
    primary: "white",
    secondary: "#9CA3AF",
    background: "black",
    secondaryBackground: "#1F2937",
    accent: "#0A84FF",
    destructive: "#FF6B6B",
    warning: "#F4B740",
    success: "#4DD18B",
    chromeMuted: "rgba(255, 255, 255, 0.12)",
    shadowSoft: "rgba(0, 0, 0, 0.16)",
  },
  typography,
}

const settings = {
  adaptiveThemes: true,
}

const appThemes = {
  light: lightTheme,
  dark: otherTheme,
}

type AppThemes = typeof appThemes

declare module "react-native-unistyles" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: appThemes,
  settings,
})
