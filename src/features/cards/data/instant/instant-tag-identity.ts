import { v5 as uuidv5 } from "uuid"

import { normalizeTagTitle } from "@/features/cards/model/card"

const TAG_ID_NAMESPACE = uuidv5("com.tobio.flashcards.tags", uuidv5.DNS)

export function getTagOwnerTitle(userId: string, title: string) {
  return `${userId}:${normalizeTagTitle(title)}`
}

/**
 * Tag IDs are a durable identity contract. Changing the namespace or normalized
 * owner/title format requires migrating existing tag entities and links.
 */
export function getTagId(userId: string, title: string) {
  return uuidv5(getTagOwnerTitle(userId, title), TAG_ID_NAMESPACE)
}
