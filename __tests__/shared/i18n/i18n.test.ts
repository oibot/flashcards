jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}))

import deEditCard from "@/shared/i18n/de/editCard.json"
import enEditCard from "@/shared/i18n/en/editCard.json"
import i18n from "@/shared/i18n/i18n"

const getLeafKeys = (value: object, prefix = ""): string[] => {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return child && typeof child === "object"
      ? getLeafKeys(child, path)
      : [path]
  })
}

describe("i18n", () => {
  it("registers feature and screen namespaces for every supported language", () => {
    expect(i18n.t("title", { lng: "en", ns: "auth" })).toBe("Sign in")
    expect(i18n.t("title", { lng: "de", ns: "reviewPrep" })).toBe(
      "Bereit zum Lernen",
    )
    expect(i18n.t("settings", { lng: "en", ns: "tabs" })).toBe("Settings")
    expect(
      i18n.t("languageSelection.languages.en-US.label", {
        lng: "en",
        ns: "editCard",
      }),
    ).toBe("English")
  })

  it("keeps English and German edit-card translation keys in parity", () => {
    expect(getLeafKeys(deEditCard).sort()).toEqual(
      getLeafKeys(enEditCard).sort(),
    )
  })

  it("keeps common limited to shared labels", () => {
    expect(i18n.t("cancel", { lng: "en", ns: "common" })).toBe("Cancel")
    expect(i18n.exists("auth.title", { lng: "en", ns: "common" })).toBe(false)
  })
})
