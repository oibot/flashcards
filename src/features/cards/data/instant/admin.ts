import { init } from "@instantdb/admin"

import schema, {
  type AppSchema,
} from "@/features/cards/data/instant/instant.schema"

let adminDb: ReturnType<typeof init<AppSchema, true>> | null = null

function requireInstantAdminEnv() {
  const appId = process.env.INSTANT_APP_ID
  const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN

  if (!appId) {
    throw new Error("Missing INSTANT_APP_ID")
  }

  if (!adminToken) {
    throw new Error("Missing INSTANT_APP_ADMIN_TOKEN")
  }

  return {
    appId,
    adminToken,
  }
}

export function getAdminDb() {
  if (!adminDb) {
    const env = requireInstantAdminEnv()

    adminDb = init<AppSchema, true>({
      appId: env.appId,
      adminToken: env.adminToken,
      schema,
      useDateObjects: true,
    })
  }

  return adminDb
}
