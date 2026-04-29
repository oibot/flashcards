import {
  isCardVariant,
  parseTags,
  resolveCardContent,
  toCanonicalCardContent,
} from "@/features/cards/model/card"

describe("card helpers", () => {
  it("accepts only supported card variants", () => {
    expect(isCardVariant("forward")).toBe(true)
    expect(isCardVariant("reverse")).toBe(true)

    expect(isCardVariant("")).toBe(false)
    expect(isCardVariant("unknown")).toBe(false)
    expect(isCardVariant(null)).toBe(false)
    expect(isCardVariant(1)).toBe(false)
  })

  it("normalizes, deduplicates, and filters empty tags", () => {
    expect(
      parseTags([
        "  geRMan ",
        "",
        "verbs",
        "German",
        "two   WORDS",
        "\nspaced\t tag\n",
      ]),
    ).toEqual(["German", "Verbs", "Two Words", "Spaced Tag"])
  })

  it("supports comma-delimited tag input", () => {
    expect(parseTags(" travel,food, Travel ,  ")).toEqual(["Travel", "Food"])
  })

  it("resolves visible content for forward cards", () => {
    expect(
      resolveCardContent(
        {
          sideAHtml: "<p>Question</p>",
          sideBHtml: "<p>Answer</p>",
        },
        "forward",
      ),
    ).toEqual({
      frontHtml: "<p>Question</p>",
      backHtml: "<p>Answer</p>",
    })
  })

  it("resolves visible content for reverse cards", () => {
    expect(
      resolveCardContent(
        {
          sideAHtml: "<p>Question</p>",
          sideBHtml: "<p>Answer</p>",
        },
        "reverse",
      ),
    ).toEqual({
      frontHtml: "<p>Answer</p>",
      backHtml: "<p>Question</p>",
    })
  })

  it("maps forward visible content back to canonical sides", () => {
    expect(
      toCanonicalCardContent(
        {
          frontHtml: "<p>Visible front</p>",
          backHtml: "<p>Visible back</p>",
        },
        "forward",
      ),
    ).toEqual({
      sideAHtml: "<p>Visible front</p>",
      sideBHtml: "<p>Visible back</p>",
    })
  })

  it("maps reverse visible content back to canonical sides", () => {
    expect(
      toCanonicalCardContent(
        {
          frontHtml: "<p>Visible front</p>",
          backHtml: "<p>Visible back</p>",
        },
        "reverse",
      ),
    ).toEqual({
      sideAHtml: "<p>Visible back</p>",
      sideBHtml: "<p>Visible front</p>",
    })
  })
})
