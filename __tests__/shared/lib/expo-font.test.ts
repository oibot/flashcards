import { toExpoFontWeight } from "@/shared/lib/expo-font"

describe("toExpoFontWeight", () => {
  it.each([
    ["100", "thin"],
    ["thin", "thin"],
    ["200", "ultraLight"],
    ["ultralight", "ultraLight"],
    ["300", "light"],
    ["light", "light"],
    ["500", "medium"],
    ["medium", "medium"],
    ["600", "semibold"],
    ["semibold", "semibold"],
    ["700", "bold"],
    ["bold", "bold"],
    ["800", "heavy"],
    ["heavy", "heavy"],
    ["900", "black"],
    ["black", "black"],
  ] as const)("maps %s to %s", (fontWeight, expected) => {
    expect(toExpoFontWeight(fontWeight)).toBe(expected)
  })

  it("falls back to regular for unsupported or default values", () => {
    expect(toExpoFontWeight(undefined)).toBe("regular")
    expect(toExpoFontWeight("400")).toBe("regular")
    expect(toExpoFontWeight("normal")).toBe("regular")
  })
})
