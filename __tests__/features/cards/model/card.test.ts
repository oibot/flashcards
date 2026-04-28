import {
  parseTags,
  resolveCardContent,
  toCanonicalCardContent,
} from "@/features/cards/model/card"

describe("card helpers", () => {
  it("normalizes, deduplicates, and filters empty tags", () => {
    expect(
      parseTags(["  geRMan ", "", "verbs", "German", "two   WORDS"]),
    ).toEqual(["German", "Verbs", "Two Words"])
  })

  it("supports comma-delimited tag input", () => {
    expect(parseTags(" travel,food, Travel ,  ")).toEqual(["Travel", "Food"])
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

  it("maps visible content back to canonical sides", () => {
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
