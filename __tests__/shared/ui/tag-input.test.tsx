jest.mock("react-native-unistyles", () => ({
  StyleSheet: {
    create: (styles: unknown) =>
      typeof styles === "function"
        ? styles({
            typography: {
              styles: {
                footnote: {},
                caption: {},
                body: {},
              },
            },
            colors: {
              secondary: "#666666",
              secondaryBackground: "#ffffff",
              destructive: "#ff0000",
              accent: "#0000ff",
              background: "#ffffff",
              primary: "#111111",
              chromeMuted: "#dddddd",
            },
          })
        : styles,
  },
}))

import { useState } from "react"
import { TextInput } from "react-native"
import { fireEvent, render, screen } from "@testing-library/react-native"

import { TagInput } from "@/shared/ui/tag-input"

type RenderTagInputOptions = {
  initialTags?: string[]
  maxTags?: number
}

function renderTagInput({
  initialTags = [],
  maxTags,
}: RenderTagInputOptions = {}) {
  const onChangeSpy = jest.fn()
  const onBlurSpy = jest.fn()

  function TestHarness() {
    const [tags, setTags] = useState(initialTags)

    return (
      <TagInput
        label="Tags"
        maxTags={maxTags}
        onBlur={onBlurSpy}
        onChange={(nextTags) => {
          onChangeSpy(nextTags)
          setTags(nextTags)
        }}
        removeTagAccessibilityLabel={(tag) => `Remove ${tag}`}
        tags={tags}
      />
    )
  }

  const utils = render(<TestHarness />)

  return {
    ...utils,
    getInput: () => utils.UNSAFE_getByType(TextInput),
    onBlurSpy,
    onChangeSpy,
  }
}

describe("TagInput", () => {
  it("commits normalized tags from comma and newline delimiters while preserving trailing input", () => {
    const { getInput, onChangeSpy } = renderTagInput()

    fireEvent.changeText(getInput(), " german,travel\nfood")

    expect(onChangeSpy.mock.calls).toEqual([
      [["German"]],
      [["German", "Travel"]],
    ])
    expect(getInput().props.value).toBe("food")
  })

  it("commits pending input on blur and clears the field", () => {
    const { getInput, onBlurSpy, onChangeSpy } = renderTagInput({
      initialTags: ["German"],
    })

    fireEvent.changeText(getInput(), "travel")
    fireEvent(getInput(), "blur")

    expect(onChangeSpy).toHaveBeenLastCalledWith(["German", "Travel"])
    expect(onBlurSpy).toHaveBeenCalled()
    expect(getInput().props.value).toBe("")
  })

  it("commits pending input on submit editing", () => {
    const { getInput, onChangeSpy } = renderTagInput()

    fireEvent.changeText(getInput(), "travel")
    fireEvent(getInput(), "submitEditing")

    expect(onChangeSpy).toHaveBeenLastCalledWith(["Travel"])
    expect(getInput().props.value).toBe("")
  })

  it("removes the last tag when backspace is pressed on empty input", () => {
    const { getInput, onChangeSpy } = renderTagInput({
      initialTags: ["German", "Travel"],
    })

    fireEvent(getInput(), "keyPress", {
      nativeEvent: {
        key: "Backspace",
      },
    })

    expect(onChangeSpy).toHaveBeenLastCalledWith(["German"])
  })

  it("removes a specific tag when its remove button is pressed", () => {
    const { onChangeSpy } = renderTagInput({
      initialTags: ["German", "Travel"],
    })

    fireEvent.press(screen.getByLabelText("Remove German"))

    expect(onChangeSpy).toHaveBeenLastCalledWith(["Travel"])
  })

  it("suppresses additional input after reaching the max tag count", () => {
    const { getInput, onChangeSpy } = renderTagInput({
      initialTags: ["German", "Travel"],
      maxTags: 2,
    })

    expect(getInput().props.editable).toBe(false)

    fireEvent.changeText(getInput(), "food")

    expect(onChangeSpy).not.toHaveBeenCalled()
    expect(getInput().props.value).toBe("")
  })
})
