import {
  extractNormalizedTtsTextFromHtml,
  getCardSetTtsLocale,
  isSupportedTtsLocale,
  resolveCardContentSide,
  toCanonicalCardTtsPatch,
  toCanonicalCardTtsSelectionPatch,
} from "@/features/cards/audio/model/card-audio"

describe("audio card model helpers", () => {
  it("maps visible sides back to canonical content sides for each variant", () => {
    expect(resolveCardContentSide("forward", "front")).toBe("sideA")
    expect(resolveCardContentSide("forward", "back")).toBe("sideB")
    expect(resolveCardContentSide("reverse", "front")).toBe("sideB")
    expect(resolveCardContentSide("reverse", "back")).toBe("sideA")
  })

  it("extracts normalized TTS text from representative html", () => {
    expect(
      extractNormalizedTtsTextFromHtml(
        "<div>Hello &amp;<br />goodbye</div><p>See&nbsp;you later</p>",
      ),
    ).toBe("Hello & goodbye See you later")
  })

  it("guards supported locales and reads the locale for a canonical content side", () => {
    expect(isSupportedTtsLocale("en-US")).toBe(true)
    expect(isSupportedTtsLocale("sv-SE")).toBe(false)

    expect(
      getCardSetTtsLocale(
        {
          sideATtsLocale: "de-DE",
          sideBTtsLocale: "ja-JP",
        },
        "sideB",
      ),
    ).toBe("ja-JP")
  })

  it("maps visible-side audio selections back to canonical card-set fields", () => {
    const selection = {
      front: {
        locale: "de-DE" as const,
        assetId: "asset-front",
      },
      back: {
        locale: null,
        assetId: "asset-back",
      },
    }

    expect(toCanonicalCardTtsPatch(selection, "reverse")).toEqual({
      sideATtsLocale: null,
      sideATtsAssetId: "asset-back",
      sideBTtsLocale: "de-DE",
      sideBTtsAssetId: "asset-front",
    })
    expect(toCanonicalCardTtsSelectionPatch(selection, "reverse")).toEqual({
      sideATtsAssetId: "asset-back",
      sideBTtsAssetId: "asset-front",
    })
  })
})
