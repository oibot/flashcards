import { useEffect, useRef } from "react"

import type { AuthSession } from "@/features/auth/auth-types"
import { db } from "@/features/cards/data/instant/db"

type EnsureProfileInput = Pick<AuthSession, "status" | "user">

export function useEnsureProfile({ status, user }: EnsureProfileInput) {
  const isCreatingProfileRef = useRef(false)
  const query =
    user !== null
      ? {
          $users: {
            $: {
              where: {
                id: user.id,
              },
            },
            profile: {},
          },
        }
      : null
  const { isLoading, error, data } = db.useQuery(query)
  const hasProfile = !!data?.$users[0]?.profile

  useEffect(() => {
    if (status !== "signed-in" || !user || isLoading || error || hasProfile) {
      isCreatingProfileRef.current = false
      return
    }

    if (isCreatingProfileRef.current) {
      return
    }

    isCreatingProfileRef.current = true

    const ensureProfile = async () => {
      try {
        await db.transact(
          db.tx.profiles[user.id]
            .update({
              createdAt: Date.now(),
            })
            .link({ $user: user.id }),
        )
      } catch (profileError) {
        console.error("Failed to ensure profile", profileError)
      } finally {
        isCreatingProfileRef.current = false
      }
    }

    void ensureProfile()
  }, [error, hasProfile, isLoading, status, user])
}
