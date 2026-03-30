import { useEffect, useRef } from "react"

import type { AuthSession } from "@/auth/auth-types"
import { db } from "@/db/instant/db"

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

    void db
      .transact(
        db.tx.profiles[user.id]
          .update({
            createdAt: Date.now(),
          })
          .link({ $user: user.id }),
      )
      .catch((profileError) => {
        console.error("Failed to ensure profile", profileError)
      })
      .finally(() => {
        isCreatingProfileRef.current = false
      })
  }, [error, hasProfile, isLoading, status, user])
}
