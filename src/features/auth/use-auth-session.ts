import { authClient } from "@/features/auth/auth-client"

export function useAuthSession() {
  return authClient.useSession()
}
