import { authClient } from "@/features/auth/api/auth-client"

const authActions = {
  requestCode: authClient.requestCode,
  signInWithCode: authClient.signInWithCode,
  signOut: authClient.signOut,
}

export function useAuthActions() {
  return authActions
}
