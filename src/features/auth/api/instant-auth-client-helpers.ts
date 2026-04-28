import type { AuthSession, AuthUser } from "@/features/auth/api/auth-types"

type InstantAuthUser = {
  id: string
  email?: string | null
  refresh_token: string
}

type InstantAuthState = {
  isLoading: boolean
  user: InstantAuthUser | null | undefined
  error: unknown | null | undefined
}

export function normalizeAuthError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "body" in error &&
    error.body &&
    typeof error.body === "object" &&
    "message" in error.body &&
    typeof error.body.message === "string"
  ) {
    return new Error(error.body.message)
  }

  if (error instanceof Error) {
    return error
  }

  return new Error(String(error))
}

export function toAuthUser(
  user: InstantAuthUser | null | undefined,
): AuthUser | null {
  if (!user) return null

  return {
    id: user.id,
    email: user.email ?? null,
    refreshToken: user.refresh_token,
  }
}

export function toAuthSession({
  isLoading,
  user,
  error,
}: InstantAuthState): AuthSession {
  if (isLoading) {
    return {
      status: "loading",
      user: null,
      error: null,
    }
  }

  if (error) {
    return {
      status: "signed-out",
      user: null,
      error: normalizeAuthError(error),
    }
  }

  const authUser = toAuthUser(user)

  return {
    status: authUser ? "signed-in" : "signed-out",
    user: authUser,
    error: null,
  }
}
