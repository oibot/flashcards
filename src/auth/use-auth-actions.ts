import { authClient } from "@/auth/auth-client"

const authActions = {
  requestCode: authClient.requestCode,
  signInWithCode: authClient.signInWithCode,
  signOut: authClient.signOut,
}

export function useAuthActions() {
  return authActions
}
