import type {
  AuthClient,
  RequestCodeInput,
  SignInWithCodeInput,
} from "@/features/auth/api/auth-types"
import {
  normalizeAuthError,
  toAuthSession,
} from "@/features/auth/api/instant-auth-client-helpers"
import { db } from "@/features/cards/data/instant/db"

function useSession() {
  return toAuthSession(db.useAuth())
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
