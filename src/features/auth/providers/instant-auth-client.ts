import type {
  AuthClient,
  AuthSession,
  AuthUser,
  RequestCodeInput,
  SignInWithCodeInput,
} from "@/features/auth/auth-types"
import { db } from "@/features/cards/data/instant/db"

function normalizeAuthError(error: unknown) {
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

function toAuthUser(
  user: ReturnType<typeof db.useAuth>["user"],
): AuthUser | null {
  if (!user) return null

  return {
    id: user.id,
    email: user.email ?? null,
    refreshToken: user.refresh_token,
  }
}

function useSession(): AuthSession {
  const { isLoading, user, error } = db.useAuth()

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

async function requestCode({ email }: RequestCodeInput) {
  try {
    await db.auth.sendMagicCode({ email })
  } catch (error) {
    throw normalizeAuthError(error)
  }
}

async function signInWithCode({ email, code }: SignInWithCodeInput) {
  try {
    await db.auth.signInWithMagicCode({ email, code })
  } catch (error) {
    throw normalizeAuthError(error)
  }
}

async function signOut() {
  try {
    await db.auth.signOut()
  } catch (error) {
    throw normalizeAuthError(error)
  }
}

export const instantAuthClient: AuthClient = {
  useSession,
  requestCode,
  signInWithCode,
  signOut,
}
