import { authClient } from "@/auth/auth-client"

export function useAuthSession() {
  return authClient.useSession()
}
