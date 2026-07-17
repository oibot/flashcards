import { getErrorLogAttributes, normalizeError } from "@/shared/lib/error"

describe("normalizeError", () => {
  it("returns null for empty errors", () => {
    expect(normalizeError(null)).toBeNull()
    expect(normalizeError(undefined)).toBeNull()
  })

  it("returns Error instances unchanged", () => {
    const error = new Error("failed")

    expect(normalizeError(error)).toBe(error)
  })

  it("wraps non-Error values", () => {
    expect(normalizeError("failed")).toEqual(new Error("failed"))
  })
})

describe("getErrorLogAttributes", () => {
  it("returns searchable attributes for errors", () => {
    expect(getErrorLogAttributes(new TypeError("failed"))).toEqual({
      error: "failed",
      error_type: "TypeError",
    })
  })

  it("returns no attributes for empty errors", () => {
    expect(getErrorLogAttributes(null)).toEqual({})
  })
})
