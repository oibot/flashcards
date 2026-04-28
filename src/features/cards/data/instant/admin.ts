import { init } from "@instantdb/admin"

import schema, {
  type AppSchema,
} from "@/features/cards/data/instant/instant.schema"

const appId = process.env.EXPO_PUBLIC_INSTANT_APP_ID
const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN

if (!appId) {
  throw new Error("Missing EXPO_PUBLIC_INSTANT_APP_ID")
}

if (!adminToken) {
  console.log(adminToken)
  throw new Error("Missing INSTANT_APP_ADMIN_TOKEN")
}

export const adminDb = init<AppSchema, true>({
  appId,
  adminToken,
  schema,
  useDateObjects: true,
})
