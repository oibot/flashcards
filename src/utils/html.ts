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

const VOID_TAGS = new Set(["br", "img"])

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

export function hasMeaningfulHtmlContent(html: string) {
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0
  )
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
