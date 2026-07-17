import * as Sentry from "@sentry/react-native"

import type {
  ProfileQueryState,
  ProfileStore,
} from "@/features/auth/data/profile-store"
import { db } from "@/features/cards/data/instant/db"
import { getErrorLogAttributes, normalizeError } from "@/shared/lib/error"

export const instantProfileStore: ProfileStore = {
  useProfileQuery: (userId: string | null): ProfileQueryState => {
    const query =
      userId !== null
        ? {
            $users: {
              $: {
                where: {
                  id: userId,
                },
              },
              profile: {},
            },
          }
        : null
    const { isLoading, error, data } = db.useQuery(query)

    return {
      hasProfile: !!data?.$users[0]?.profile,
      isLoading,
      error: normalizeError(error),
    }
  },
  ensureProfile: async (userId: string) => {
    try {
      await db.transact(
        db.tx.profiles[userId]
          .update({
            createdAt: Date.now(),
          })
          .link({ $user: userId }),
      )
    } catch (profileError) {
      Sentry.logger.error("Failed to ensure profile", {
        feature: "auth",
        ...getErrorLogAttributes(profileError),
      })
    }
  },
}
