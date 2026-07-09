const mockTransact = jest.fn()
const mockUseQuery = jest.fn()

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

import { renderHook } from "@testing-library/react-native"

import { instantProfileStore } from "@/features/auth/data/instant-profile-store"

describe("instantProfileStore", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Date, "now").mockReturnValue(123)
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        $users: [{ profile: null }],
      },
    })
    mockTransact.mockResolvedValue(undefined)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    jest.restoreAllMocks()
  })

  it("queries a user's profile", () => {
    const { result } = renderHook(() =>
      instantProfileStore.useProfileQuery("user-1"),
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
    expect(result.current).toEqual({
      hasProfile: false,
      isLoading: false,
      error: null,
    })
  })

  it("does not query when no user id is available", () => {
    renderHook(() => instantProfileStore.useProfileQuery(null))

    expect(mockUseQuery).toHaveBeenCalledWith(null)
  })

  it("normalizes profile query errors", () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: "query failed",
      data: undefined,
    })

    const { result } = renderHook(() =>
      instantProfileStore.useProfileQuery("user-1"),
    )

    expect(result.current.error).toEqual(new Error("query failed"))
  })

  it("creates and links a profile", async () => {
    await instantProfileStore.ensureProfile("user-1")

    expect(mockTransact).toHaveBeenCalledWith({
      userId: "user-1",
      update: { createdAt: 123 },
      link: { $user: "user-1" },
    })
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it("logs profile creation failures", async () => {
    const error = new Error("profile failed")
    mockTransact.mockRejectedValue(error)

    await instantProfileStore.ensureProfile("user-1")

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to ensure profile",
      error,
    )
  })
})
