export type AuthStatus = "loading" | "signed-in" | "signed-out"

export type AuthUser = {
  id: string
  email: string | null
}

export type AuthSession = {
  status: AuthStatus
  user: AuthUser | null
  error: Error | null
}

export type RequestCodeInput = {
  email: string
}

export type SignInWithCodeInput = {
  email: string
  code: string
}

export type AuthClient = {
  useSession: () => AuthSession
  requestCode: (input: RequestCodeInput) => Promise<void>
  signInWithCode: (input: SignInWithCodeInput) => Promise<void>
  signOut: () => Promise<void>
}
