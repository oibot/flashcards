import { validate as validateUuid } from "uuid"

import {
  getTagId,
  getTagOwnerTitle,
} from "@/features/cards/data/instant/instant-tag-identity"

describe("instant tag identity", () => {
  it("creates a stable UUID from the normalized owner and title", () => {
    expect(getTagId("user-1", "Travel")).toBe(
      "ae1ac80e-efba-52e2-82a2-cfd3ee364217",
    )
    expect(getTagId("user-1", " travel ")).toBe(
      "ae1ac80e-efba-52e2-82a2-cfd3ee364217",
    )
    expect(getTagId("user-1", "café")).toBe(getTagId("user-1", "cafe\u0301"))
    expect(validateUuid(getTagId("user-1", "Travel"))).toBe(true)
  })

  it("keeps identities separate between users and normalized titles", () => {
    expect(getTagId("user-1", "Travel")).not.toBe(getTagId("user-2", "Travel"))
    expect(getTagId("user-1", "Travel")).not.toBe(getTagId("user-1", "German"))
  })

  it("uses the existing normalized owner-title identity", () => {
    expect(getTagOwnerTitle("user-1", " food and DRINK ")).toBe(
      "user-1:Food And Drink",
    )
  })
})
