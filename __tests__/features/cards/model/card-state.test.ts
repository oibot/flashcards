import {
  CARD_STATES,
  isCardState,
  parseCardState,
} from "@/features/cards/model/card-state"

describe("card state helpers", () => {
  it("accepts every exported card state", () => {
    for (const state of CARD_STATES) {
      expect(isCardState(state)).toBe(true)
    }
  })

  it("rejects unsupported card state values", () => {
    expect(isCardState("")).toBe(false)
    expect(isCardState("New")).toBe(false)
    expect(isCardState("done")).toBe(false)
    expect(isCardState("forward")).toBe(false)
  })

  it("parses valid card states", () => {
    expect(parseCardState("new")).toBe("new")
    expect(parseCardState("learning")).toBe("learning")
    expect(parseCardState("review")).toBe("review")
    expect(parseCardState("relearning")).toBe("relearning")
  })

  it("returns undefined for missing, empty, or invalid card states", () => {
    expect(parseCardState()).toBeUndefined()
    expect(parseCardState("")).toBeUndefined()
    expect(parseCardState("done")).toBeUndefined()
  })
})
