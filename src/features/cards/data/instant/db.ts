import { init } from "@instantdb/react-native"
import MMKVStore from "@instantdb/react-native-mmkv"

import schema, {
  type AppSchema,
} from "@/features/cards/data/instant/instant.schema"

const appId = process.env.EXPO_PUBLIC_INSTANT_APP_ID

if (!appId) {
  throw new Error("Missing EXPO_PUBLIC_INSTANT_APP_ID")
}

export const db = init<AppSchema>({ appId, schema, Store: MMKVStore })
