const mockUseDb = jest.fn()

jest.mock("@/features/cards/data/db-context", () => ({
  useDb: () => mockUseDb(),
}))

import { renderHook } from "@testing-library/react-native"

import { useTags } from "@/features/cards/queries/use-tags"

describe("useTags", () => {
  const tags = ["German", "Travel"]
  const error = new Error("Could not load tags.")
  const cardStore = {
    useTagsQuery: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    cardStore.useTagsQuery.mockReturnValue({
      tags,
      error,
      isLoading: true,
    })
    mockUseDb.mockReturnValue({ cardStore })
  })

  it("forwards tags query state", () => {
    const { result } = renderHook(() => useTags())

    expect(result.current).toEqual({
      tags,
      error,
      isLoading: true,
    })
    expect(cardStore.useTagsQuery).toHaveBeenCalledTimes(1)
  })
})
