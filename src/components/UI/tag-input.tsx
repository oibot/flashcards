import { type Ref, useImperativeHandle, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { TextInputKeyPressEvent } from "react-native"
import { Pressable, Text, TextInput, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import { parseTags } from "@/domain/card"

export type TagInputHandle = {
  clear: () => void
  commitInput: () => string[]
  focus: () => void
  hasPendingInput: () => boolean
}

type TagInputProps = {
  tags: string[]
  onChange: (tags: string[]) => void
  error?: string
  maxTags?: number
  accessory?: React.ReactNode
  onBlur?: () => void
  onFocus?: () => void
  ref?: Ref<TagInputHandle>
}

export function TagInput({
  tags,
  onChange,
  error,
  maxTags,
  accessory,
  onBlur,
  onFocus,
  ref,
}: TagInputProps) {
  const { t } = useTranslation("common", { keyPrefix: "editCard" })
  const inputRef = useRef<TextInput>(null)
  const [input, setInput] = useState("")
  const hasReachedMaxTags = maxTags !== undefined && tags.length >= maxTags

  const appendTag = (candidate: string, currentTags: string[]) => {
    const nextTags = parseTags([...currentTags, candidate])

    if (
      nextTags.length === currentTags.length ||
      (maxTags !== undefined && nextTags.length > maxTags)
    ) {
      return currentTags
    }

    onChange(nextTags)
    return nextTags
  }

  const commitInput = () => {
    const nextTags = appendTag(input, tags)
    setInput("")
    return nextTags
  }

  useImperativeHandle(ref, () => ({
    clear: () => {
      setInput("")
    },
    commitInput,
    focus: () => {
      if (hasReachedMaxTags) {
        return
      }

      inputRef.current?.focus()
    },
    hasPendingInput: () => input.trim().length > 0,
  }))

  const handleInputChange = (text: string) => {
    if (hasReachedMaxTags) {
      return
    }

    const parts = text.replace(/\r/g, "").split(/[,\n]/)

    if (parts.length === 1) {
      setInput(text)
      return
    }

    const trailingInput = parts.pop() ?? ""
    let nextTags = tags

    for (const part of parts) {
      nextTags = appendTag(part, nextTags)
    }

    setInput(trailingInput)
  }

  const handleKeyPress = (event: TextInputKeyPressEvent) => {
    if (event.nativeEvent.key !== "Backspace" || input.length > 0) {
      return
    }

    onChange(tags.slice(0, -1))
  }

  const handleRemoveTag = (index: number) => {
    onChange(tags.filter((_, currentIndex) => currentIndex !== index))
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t("tagsLabel")}</Text>
      <View
        style={[
          styles.inputContainer,
          !!error ? styles.inputContainerError : null,
        ]}
      >
        <Pressable
          onPress={() => {
            if (hasReachedMaxTags) {
              return
            }

            inputRef.current?.focus()
          }}
          style={styles.inputContent}
        >
          {tags.map((tag, index) => (
            <View key={`${tag}-${index}`} style={styles.tag}>
              <Text numberOfLines={1} style={styles.tagLabel}>
                {tag}
              </Text>
              <Pressable
                accessibilityLabel={`Remove ${tag}`}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => handleRemoveTag(index)}
                style={styles.tagRemoveButton}
              >
                <Text style={styles.tagRemoveLabel}>x</Text>
              </Pressable>
            </View>
          ))}
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            editable={!hasReachedMaxTags}
            onBlur={() => {
              commitInput()
              onBlur?.()
            }}
            onChangeText={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={onFocus}
            onSubmitEditing={commitInput}
            ref={inputRef}
            returnKeyType="done"
            style={styles.input}
            submitBehavior="submit"
            value={input}
          />
        </Pressable>
        {!!accessory && (
          <View style={styles.accessoryContainer}>
            <View style={styles.accessoryDivider} />
            <View style={styles.accessoryContent}>{accessory}</View>
          </View>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: 8,
  },
  label: {
    ...theme.typography.styles.footnote,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: theme.colors.secondaryBackground,
    borderRadius: 14,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  inputContainerError: {
    borderWidth: 1,
    borderColor: theme.colors.destructive,
  },
  inputContent: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 10,
  },
  tag: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 7,
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    borderCurve: "continuous",
  },
  tagLabel: {
    ...theme.typography.styles.footnote,
    color: theme.colors.background,
    fontWeight: "600",
  },
  tagRemoveButton: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tagRemoveLabel: {
    ...theme.typography.styles.caption,
    color: theme.colors.background,
    fontWeight: "700",
    lineHeight: 12,
  },
  input: {
    minWidth: 96,
    flexGrow: 1,
    paddingVertical: 6,
    color: theme.colors.primary,
    ...theme.typography.styles.body,
  },
  accessoryContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    flexShrink: 0,
  },
  accessoryDivider: {
    width: 1,
    backgroundColor: theme.colors.chromeMuted,
  },
  accessoryContent: {
    minWidth: 52,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  error: {
    ...theme.typography.styles.footnote,
    color: theme.colors.destructive,
  },
}))
