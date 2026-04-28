import type { TextStyle } from "react-native"

type ExpoFontWeight =
  | "ultraLight"
  | "thin"
  | "light"
  | "regular"
  | "medium"
  | "semibold"
  | "bold"
  | "heavy"
  | "black"

export function toExpoFontWeight(
  fontWeight: TextStyle["fontWeight"],
): ExpoFontWeight {
  switch (fontWeight) {
    case "100":
    case "thin":
      return "thin"
    case "200":
    case "ultralight":
      return "ultraLight"
    case "300":
    case "light":
      return "light"
    case "500":
    case "medium":
      return "medium"
    case "600":
    case "semibold":
      return "semibold"
    case "700":
    case "bold":
      return "bold"
    case "800":
    case "heavy":
      return "heavy"
    case "900":
    case "black":
      return "black"
    default:
      return "regular"
  }
}
