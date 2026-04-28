import type { AuthSession } from "@/features/auth/api/auth-types"

type EnsureProfileGuardInput = {
  status: AuthSession["status"]
  user: AuthSession["user"]
  isLoading: boolean
  error: unknown | null
  hasProfile: boolean
}

export function shouldEnsureProfile({
  status,
  user,
  isLoading,
  error,
  hasProfile,
}: EnsureProfileGuardInput) {
  return (
    status === "signed-in" &&
    user !== null &&
    !isLoading &&
    error === null &&
    !hasProfile
  )
}
