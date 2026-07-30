export type HtmlNode = HtmlElementNode | HtmlTextNode

export type HtmlElementNode = {
  type: "element"
  tag: string
  attributes: Record<string, string>
  children: HtmlNode[]
}

export type HtmlTextNode = {
  type: "text"
  value: string
}

export type HtmlTextAlignment = "center" | "justify" | "left" | "right"

const VOID_TAGS = new Set(["br", "img"])
const BLOCK_BREAK_TAGS = new Set([
  "blockquote",
  "br",
  "codeblock",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "ol",
  "p",
  "ul",
])

const decodeHtmlEntities = (value: string) => {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

const parseAttributes = (rawAttributes: string) => {
  const attributes: Record<string, string> = {}
  const attributePattern = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g

  for (const match of rawAttributes.matchAll(attributePattern)) {
    const [, name, doubleQuoted, singleQuoted, bareValue] = match

    if (!name) continue

    const value = doubleQuoted ?? singleQuoted ?? bareValue ?? ""
    attributes[name.toLowerCase()] = decodeHtmlEntities(value)
  }

  return attributes
}

export function getHtmlTextAlignment(
  node: HtmlElementNode,
): HtmlTextAlignment | null {
  const style = node.attributes.style
  if (!style) return null

  const match = style.match(
    /(?:^|;)\s*text-align\s*:\s*(left|center|right|justify)/i,
  )
  const alignment = match?.[1]?.toLowerCase()

  if (
    alignment === "left" ||
    alignment === "center" ||
    alignment === "right" ||
    alignment === "justify"
  ) {
    return alignment
  }

  return null
}

export function hasMeaningfulHtmlContent(html: string) {
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0
  )
}

export function normalizeWhitespace(text: string) {
  return text.trim().replace(/\s+/g, " ")
}

export function normalizeHtmlForComparison(html?: string | null) {
  const normalizedHtml = html?.trim() ?? ""

  if (!hasMeaningfulHtmlContent(normalizedHtml)) {
    return ""
  }

  return normalizedHtml
}

export function parseHtmlFragment(html: string): HtmlNode[] {
  const root: HtmlElementNode = {
    type: "element",
    tag: "root",
    attributes: {},
    children: [],
  }
  const stack: HtmlElementNode[] = [root]
  const tokens = html.match(/<!--[\s\S]*?-->|<\/?[^>]+>|[^<]+/g) ?? []

  for (const token of tokens) {
    if (token.startsWith("<!--")) {
      continue
    }

    if (token.startsWith("</")) {
      const closingTag = token.slice(2, -1).trim().toLowerCase()

      while (stack.length > 1) {
        const node = stack.pop()
        if (node?.tag === closingTag) {
          break
        }
      }

      continue
    }

    if (token.startsWith("<")) {
      const innerToken = token.slice(1, -1).trim()
      const selfClosing = innerToken.endsWith("/")
      const normalizedToken = selfClosing
        ? innerToken.slice(0, -1).trim()
        : innerToken
      const [tagName = "", ...attributeParts] = normalizedToken.split(/\s+/)
      const tag = tagName.toLowerCase()

      if (!tag) continue

      const node: HtmlElementNode = {
        type: "element",
        tag,
        attributes: parseAttributes(attributeParts.join(" ")),
        children: [],
      }

      stack.at(-1)?.children.push(node)

      if (!selfClosing && !VOID_TAGS.has(tag)) {
        stack.push(node)
      }

      continue
    }

    const value = decodeHtmlEntities(token)
    if (!value) continue

    stack.at(-1)?.children.push({
      type: "text",
      value,
    })
  }

  return root.children
}

function collectHtmlText(nodes: HtmlNode[], segments: string[] = []) {
  for (const node of nodes) {
    if (node.type === "text") {
      segments.push(node.value)
      continue
    }

    if (node.tag === "br") {
      segments.push("\n")
      continue
    }

    collectHtmlText(node.children, segments)

    if (BLOCK_BREAK_TAGS.has(node.tag)) {
      segments.push("\n")
    }
  }

  return segments
}

export function extractPlainTextFromHtml(html: string) {
  return collectHtmlText(parseHtmlFragment(html)).join(" ")
}
