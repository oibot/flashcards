export type ProfileQueryState = {
  hasProfile: boolean
  isLoading: boolean
  error: Error | null
}

export type ProfileStore = {
  useProfileQuery: (userId: string | null) => ProfileQueryState
  ensureProfile: (userId: string) => Promise<void>
}
