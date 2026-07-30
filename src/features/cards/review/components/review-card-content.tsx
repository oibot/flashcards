import type { ReactNode } from "react"
import { Fragment, useMemo } from "react"
import { Text, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import {
  getHtmlTextAlignment,
  type HtmlElementNode,
  type HtmlNode,
  parseHtmlFragment,
} from "@/shared/lib/html"

type Props = {
  html: string
}

export default function ReviewCardContent({ html }: Props) {
  const nodes = useMemo(() => parseHtmlFragment(html), [html])

  return <View style={styles.container}>{renderBlocks(nodes)}</View>
}

const renderBlocks = (nodes: HtmlNode[], keyPrefix = "block"): ReactNode[] => {
  return nodes.flatMap((node, index) =>
    renderBlock(node, `${keyPrefix}-${index}`),
  )
}

const renderBlock = (node: HtmlNode, key: string): ReactNode[] => {
  if (node.type === "text") {
    if (node.value.trim().length === 0) {
      return []
    }

    return [
      <Text key={key} style={styles.paragraph}>
        {node.value.trim()}
      </Text>,
    ]
  }

  if (node.tag === "root" || node.tag === "html") {
    return renderBlocks(node.children, key)
  }

  if (node.tag === "p") {
    return [
      <Text key={key} style={getAlignedBlockStyle(node, styles.paragraph)}>
        {renderInlineChildren(node.children, key)}
      </Text>,
    ]
  }

  if (node.tag === "h1") {
    return [
      <Text key={key} style={getAlignedBlockStyle(node, styles.heading1)}>
        {renderInlineChildren(node.children, key)}
      </Text>,
    ]
  }

  if (node.tag === "h2") {
    return [
      <Text key={key} style={getAlignedBlockStyle(node, styles.heading2)}>
        {renderInlineChildren(node.children, key)}
      </Text>,
    ]
  }

  if (node.tag === "h3") {
    return [
      <Text key={key} style={getAlignedBlockStyle(node, styles.heading3)}>
        {renderInlineChildren(node.children, key)}
      </Text>,
    ]
  }

  if (node.tag === "blockquote") {
    return [
      <View key={key} style={styles.blockquote}>
        <Text style={styles.blockquoteText}>
          {renderInlineChildren(node.children, key)}
        </Text>
      </View>,
    ]
  }

  if (node.tag === "codeblock") {
    return [
      <View key={key} style={styles.codeBlock}>
        <Text style={styles.codeBlockText}>
          {renderInlineChildren(node.children, key)}
        </Text>
      </View>,
    ]
  }

  if (node.tag === "ul" || node.tag === "ol") {
    const isOrdered = node.tag === "ol"

    return [
      <View key={key} style={styles.list}>
        {node.children
          .filter(
            (child): child is HtmlElementNode =>
              child.type === "element" && child.tag === "li",
          )
          .map((child, index) => (
            <Text key={`${key}-item-${index}`} style={styles.listItem}>
              <Text style={styles.listMarker}>
                {isOrdered ? `${index + 1}. ` : "• "}
              </Text>
              {renderInlineChildren(child.children, `${key}-item-${index}`)}
            </Text>
          ))}
      </View>,
    ]
  }

  return [
    <Fragment key={key}>{renderInlineChildren(node.children, key)}</Fragment>,
  ]
}

const getAlignedBlockStyle = (node: HtmlElementNode, baseStyle: object) => {
  const alignment = getHtmlTextAlignment(node)

  if (alignment === "left") return [baseStyle, styles.alignLeft]
  if (alignment === "right") return [baseStyle, styles.alignRight]
  if (alignment === "justify") return [baseStyle, styles.alignJustify]
  return [baseStyle, styles.alignCenter]
}

const renderInlineChildren = (
  nodes: HtmlNode[],
  keyPrefix: string,
): ReactNode[] => {
  return nodes.flatMap((node, index) => {
    const key = `${keyPrefix}-inline-${index}`

    if (node.type === "text") {
      return node.value
    }

    if (node.tag === "br") {
      return "\n"
    }

    const children = renderInlineChildren(node.children, key)

    if (node.tag === "b") {
      return (
        <Text key={key} style={styles.bold}>
          {children}
        </Text>
      )
    }

    if (node.tag === "i") {
      return (
        <Text key={key} style={styles.italic}>
          {children}
        </Text>
      )
    }

    if (node.tag === "u") {
      return (
        <Text key={key} style={styles.underline}>
          {children}
        </Text>
      )
    }

    if (node.tag === "s" || node.tag === "strike") {
      return (
        <Text key={key} style={styles.strikeThrough}>
          {children}
        </Text>
      )
    }

    if (node.tag === "code") {
      return (
        <Text key={key} style={styles.inlineCode}>
          {children}
        </Text>
      )
    }

    if (node.tag === "a") {
      return (
        <Text key={key} style={styles.link}>
          {children}
        </Text>
      )
    }

    if (node.tag === "mention") {
      return (
        <Text key={key} style={styles.mention}>
          {children}
        </Text>
      )
    }

    return <Fragment key={key}>{children}</Fragment>
  })
}

const styles = StyleSheet.create((theme, rt) => {
  const largeTitle = theme.typography.getScaledStyle(
    "largeTitle",
    rt.contentSizeCategory,
  )
  const title = theme.typography.getScaledStyle("title", rt.contentSizeCategory)
  const title2 = theme.typography.getScaledStyle(
    "title2",
    rt.contentSizeCategory,
  )
  const large = {
    ...title,
    fontSize: theme.typography.getScaledSize(32, rt.contentSizeCategory),
  }
  const title3 = theme.typography.getScaledStyle(
    "title3",
    rt.contentSizeCategory,
  )
  const blockLineHeight = (fontSize: number) => Math.round(fontSize * 1.32)

  return {
    container: {
      width: "100%",
      maxWidth: 560,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
    },
    paragraph: {
      ...title,
      width: "100%",
      lineHeight: blockLineHeight(title.fontSize),
      color: theme.colors.primary,
    },
    heading1: {
      ...largeTitle,
      width: "100%",
      lineHeight: blockLineHeight(largeTitle.fontSize),
      fontWeight: "700",
      color: theme.colors.primary,
    },
    heading2: {
      ...title,
      width: "100%",
      fontWeight: "700",
      lineHeight: blockLineHeight(title.fontSize),
      color: theme.colors.primary,
    },
    heading3: {
      ...large,
      width: "100%",
      fontWeight: "400",
      lineHeight: blockLineHeight(large.fontSize),
      color: theme.colors.primary,
    },
    alignLeft: {
      textAlign: "left",
    },
    alignCenter: {
      textAlign: "center",
    },
    alignRight: {
      textAlign: "right",
    },
    alignJustify: {
      textAlign: "justify",
    },
    bold: {
      fontWeight: "700",
    },
    italic: {
      fontStyle: "italic",
    },
    underline: {
      textDecorationLine: "underline",
    },
    strikeThrough: {
      textDecorationLine: "line-through",
    },
    inlineCode: {
      fontFamily: "Menlo",
      backgroundColor: theme.colors.secondaryBackground,
      color: theme.colors.primary,
    },
    codeBlock: {
      width: "100%",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 18,
      borderCurve: "continuous",
      backgroundColor: theme.colors.secondaryBackground,
    },
    codeBlockText: {
      ...title3,
      fontFamily: "Menlo",
      lineHeight: blockLineHeight(title3.fontSize),
      color: theme.colors.primary,
      textAlign: "left",
    },
    blockquote: {
      width: "100%",
      paddingLeft: 18,
      borderLeftWidth: 4,
      borderColor: theme.colors.chromeMuted,
    },
    blockquoteText: {
      ...title2,
      lineHeight: blockLineHeight(title2.fontSize),
      color: theme.colors.secondary,
      textAlign: "center",
    },
    list: {
      width: "100%",
      gap: 10,
    },
    listItem: {
      ...title,
      lineHeight: blockLineHeight(title.fontSize),
      color: theme.colors.primary,
      textAlign: "left",
    },
    listMarker: {
      fontWeight: "700",
      color: theme.colors.secondary,
    },
    link: {
      color: theme.colors.accent,
      textDecorationLine: "underline",
    },
    mention: {
      color: theme.colors.accent,
    },
  }
})
