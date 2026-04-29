const mockUseTags = jest.fn()

jest.mock("@/features/cards/queries/use-tags", () => ({
  useTags: () => mockUseTags(),
}))

import { act, renderHook } from "@testing-library/react-native"

import { useEditCardTags } from "@/features/cards/edit/hooks/use-edit-card-tags"

describe("useEditCardTags", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTags.mockReturnValue({
      tags: ["German", "Travel", "Verbs"],
    })
  })

  it("normalizes added tags and filters them out of the available tags list", () => {
    const { result } = renderHook(() => useEditCardTags())

    expect(result.current.availableTags).toEqual(["German", "Travel", "Verbs"])

    act(() => {
      result.current.handleAddTag(" german ")
      result.current.handleAddTag("travel")
      result.current.handleAddTag("German")
    })

    expect(result.current.tags).toEqual(["German", "Travel"])
    expect(result.current.availableTags).toEqual(["Verbs"])
  })

  it("resets tags and clears the pending tag input handle", () => {
    const clear = jest.fn()
    const focus = jest.fn()
    const { result } = renderHook(() => useEditCardTags())

    act(() => {
      result.current.handleAddTag("German")
      result.current.tagInputRef.current = {
        clear,
        commitInput: () => result.current.tags,
        focus,
        hasPendingInput: () => false,
      }
    })

    expect(result.current.tags).toEqual(["German"])

    act(() => {
      result.current.resetTags()
    })

    expect(result.current.tags).toEqual([])
    expect(clear).toHaveBeenCalledTimes(1)
    expect(focus).toHaveBeenCalledTimes(1)
  })
})
