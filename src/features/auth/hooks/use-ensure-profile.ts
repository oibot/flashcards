import { useEffect, useRef } from "react"

import type { AuthSession } from "@/features/auth/api/auth-types"
import { instantProfileStore } from "@/features/auth/data/instant-profile-store"
import { shouldEnsureProfile } from "@/features/auth/hooks/use-ensure-profile-guard"

type EnsureProfileInput = Pick<AuthSession, "status" | "user">

export function useEnsureProfile({ status, user }: EnsureProfileInput) {
  const isCreatingProfileRef = useRef(false)
  const { hasProfile, isLoading, error } = instantProfileStore.useProfileQuery(
    user?.id ?? null,
  )

  useEffect(() => {
    if (
      !shouldEnsureProfile({
        status,
        user,
        isLoading,
        error,
        hasProfile,
      })
    ) {
      isCreatingProfileRef.current = false
      return
    }

    if (isCreatingProfileRef.current) {
      return
    }

    if (!user) {
      return
    }

    isCreatingProfileRef.current = true

    const ensureProfile = async () => {
      try {
        await instantProfileStore.ensureProfile(user.id)
      } finally {
        isCreatingProfileRef.current = false
      }
    }

    void ensureProfile()
  }, [error, hasProfile, isLoading, status, user])
}
