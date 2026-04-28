import {
  extractPlainTextFromHtml,
  hasMeaningfulHtmlContent,
  normalizeHtmlForComparison,
  normalizeWhitespace,
  parseHtmlFragment,
} from "@/shared/lib/html"

describe("shared html helpers", () => {
  it("detects whether html has meaningful content", () => {
    expect(hasMeaningfulHtmlContent("<p>&nbsp;</p>")).toBe(false)
    expect(hasMeaningfulHtmlContent("<p>Hello</p>")).toBe(true)
  })

  it("normalizes empty html for comparison", () => {
    expect(normalizeHtmlForComparison("  <p>&nbsp;</p>  ")).toBe("")
    expect(normalizeHtmlForComparison("  <p>Hello</p>  ")).toBe("<p>Hello</p>")
    expect(normalizeHtmlForComparison(undefined)).toBe("")
  })

  it("parses nested fragments, strips comments, and decodes attributes", () => {
    expect(
      parseHtmlFragment(
        '<p data-name="Tom &amp; Jerry">Hello <strong>world</strong><!-- ignore --><br /></p>',
      ),
    ).toEqual([
      {
        type: "element",
        tag: "p",
        attributes: {
          "data-name": "Tom & Jerry",
        },
        children: [
          {
            type: "text",
            value: "Hello ",
          },
          {
            type: "element",
            tag: "strong",
            attributes: {},
            children: [
              {
                type: "text",
                value: "world",
              },
            ],
          },
          {
            type: "element",
            tag: "br",
            attributes: {},
            children: [],
          },
        ],
      },
    ])
  })

  it("extracts decoded plain text from representative html", () => {
    expect(
      normalizeWhitespace(
        extractPlainTextFromHtml(
          "<div>Hello &amp;<br />goodbye</div><p>See you later</p>",
        ),
      ),
    ).toBe("Hello & goodbye See you later")
  })
})
