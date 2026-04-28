const mockUseQuery = jest.fn()
const mockTransact = jest.fn()

jest.mock("@/features/cards/data/instant/db", () => ({
  db: {
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
    transact: (...args: unknown[]) => mockTransact(...args),
    tx: {
      profiles: new Proxy(
        {},
        {
          get(_target, userId) {
            return {
              update(update: Record<string, unknown>) {
                return {
                  link(link: Record<string, string>) {
                    return {
                      userId: String(userId),
                      update,
                      link,
                    }
                  },
                }
              },
            }
          },
        },
      ),
    },
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
    isLoading: false,
    error: null,
    data: {
      $users: [{ profile: null }],
    },
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
    jest.spyOn(Date, "now").mockReturnValue(123)
    mockUseQuery.mockReturnValue(createMissingProfileQueryResult())
    mockTransact.mockResolvedValue(undefined)
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

    expect(mockUseQuery).toHaveBeenCalledWith({
      $users: {
        $: {
          where: {
            id: "user-1",
          },
        },
        profile: {},
      },
    })

    await waitFor(() => {
      expect(mockTransact).toHaveBeenCalledWith({
        userId: "user-1",
        update: { createdAt: 123 },
        link: { $user: "user-1" },
      })
    })
  })

  it("does not start a second profile creation while one is already pending", async () => {
    const deferred = createDeferredPromise()
    mockTransact.mockReturnValue(deferred.promise)

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
      expect(mockTransact).toHaveBeenCalledTimes(1)
    })

    rerender({
      user: {
        ...signedInUser,
      },
    })

    await waitFor(() => {
      expect(mockTransact).toHaveBeenCalledTimes(1)
    })

    deferred.resolve()
  })
})
