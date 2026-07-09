import { normalizeError } from "@/shared/lib/error"

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
