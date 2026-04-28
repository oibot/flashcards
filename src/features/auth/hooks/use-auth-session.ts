import { authClient } from "@/features/auth/api/auth-client"

export function useAuthSession() {
  return authClient.useSession()
}
