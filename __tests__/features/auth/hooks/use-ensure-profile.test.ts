const mockEnsureProfile = jest.fn()
const mockUseProfileQuery = jest.fn()

jest.mock("@/features/auth/data/instant-profile-store", () => ({
  instantProfileStore: {
    useProfileQuery: (...args: unknown[]) => mockUseProfileQuery(...args),
    ensureProfile: (...args: unknown[]) => mockEnsureProfile(...args),
  },
}))

import { renderHook, waitFor } from "@testing-library/react-native"

import { useEnsureProfile } from "@/features/auth/hooks/use-ensure-profile"
import { shouldEnsureProfile } from "@/features/auth/hooks/use-ensure-profile-guard"

const signedInUser = {
  id: "user-1",
  email: "user@example.com",
  refreshToken: "refresh-token",
} as const

function createMissingProfileQueryResult() {
  return {
    hasProfile: false,
    isLoading: false,
    error: null,
  }
}

function createDeferredPromise() {
  let resolve!: () => void
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

describe("shouldEnsureProfile", () => {
  it.each([
    {
      label: "the user is signed in and missing a profile",
      input: {
        status: "signed-in" as const,
        user: signedInUser,
        isLoading: false,
        error: null,
        hasProfile: false,
      },
      expected: true,
    },
    {
      label: "the user is signed out",
      input: {
        status: "signed-out" as const,
        user: null,
        isLoading: false,
        error: null,
        hasProfile: false,
      },
      expected: false,
    },
    {
      label: "the profile query is still loading",
      input: {
        status: "signed-in" as const,
        user: signedInUser,
        isLoading: true,
        error: null,
        hasProfile: false,
      },
      expected: false,
    },
    {
      label: "the profile query failed",
      input: {
        status: "signed-in" as const,
        user: signedInUser,
        isLoading: false,
        error: new Error("query failed"),
        hasProfile: false,
      },
      expected: false,
    },
    {
      label: "the profile already exists",
      input: {
        status: "signed-in" as const,
        user: signedInUser,
        isLoading: false,
        error: null,
        hasProfile: true,
      },
      expected: false,
    },
  ])("returns $expected when %s", ({ input, expected }) => {
    expect(shouldEnsureProfile(input)).toBe(expected)
  })
})

describe("useEnsureProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseProfileQuery.mockReturnValue(createMissingProfileQueryResult())
    mockEnsureProfile.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("creates a profile for signed-in users when none exists", async () => {
    renderHook(() =>
      useEnsureProfile({
        status: "signed-in",
        user: signedInUser,
      }),
    )

    expect(mockUseProfileQuery).toHaveBeenCalledWith("user-1")

    await waitFor(() => {
      expect(mockEnsureProfile).toHaveBeenCalledWith("user-1")
    })
  })

  it("queries with null when the user is signed out", () => {
    renderHook(() =>
      useEnsureProfile({
        status: "signed-out",
        user: null,
      }),
    )

    expect(mockUseProfileQuery).toHaveBeenCalledWith(null)
    expect(mockEnsureProfile).not.toHaveBeenCalled()
  })

  it("does not start a second profile creation while one is already pending", async () => {
    const deferred = createDeferredPromise()
    mockEnsureProfile.mockReturnValue(deferred.promise)

    const { rerender } = renderHook<void, { user: typeof signedInUser }>(
      ({ user }) =>
        useEnsureProfile({
          status: "signed-in",
          user,
        }),
      {
        initialProps: {
          user: signedInUser,
        },
      },
    )

    await waitFor(() => {
      expect(mockEnsureProfile).toHaveBeenCalledTimes(1)
    })

    rerender({
      user: {
        ...signedInUser,
      },
    })

    await waitFor(() => {
      expect(mockEnsureProfile).toHaveBeenCalledTimes(1)
    })

    deferred.resolve()
  })
})
