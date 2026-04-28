jest.mock("@/features/cards/data/instant/db", () => ({
  db: {
    useAuth: jest.fn(),
    auth: {
      sendMagicCode: jest.fn(),
      signInWithMagicCode: jest.fn(),
      signOut: jest.fn(),
    },
  },
}))

import { instantAuthClient } from "@/features/auth/api/instant-auth-client"
import { db } from "@/features/cards/data/instant/db"

type MockDb = {
  useAuth: jest.Mock
  auth: {
    sendMagicCode: jest.Mock
    signInWithMagicCode: jest.Mock
    signOut: jest.Mock
  }
}

const mockDb = db as unknown as MockDb

describe("instant auth client", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("maps loading auth state into the app session contract", () => {
    mockDb.useAuth.mockReturnValue({
      isLoading: true,
      user: null,
      error: null,
    })

    expect(instantAuthClient.useSession()).toEqual({
      status: "loading",
      user: null,
      error: null,
    })
  })

  it("maps signed-out auth state into the app session contract", () => {
    mockDb.useAuth.mockReturnValue({
      isLoading: false,
      user: null,
      error: null,
    })

    expect(instantAuthClient.useSession()).toEqual({
      status: "signed-out",
      user: null,
      error: null,
    })
  })

  it("maps signed-in auth state into the app session contract", () => {
    mockDb.useAuth.mockReturnValue({
      isLoading: false,
      user: {
        id: "user-1",
        email: "user@example.com",
        refresh_token: "refresh-token",
      },
      error: null,
    })

    expect(instantAuthClient.useSession()).toEqual({
      status: "signed-in",
      user: {
        id: "user-1",
        email: "user@example.com",
        refreshToken: "refresh-token",
      },
      error: null,
    })
  })

  it("maps backend auth errors into the app session contract", () => {
    mockDb.useAuth.mockReturnValue({
      isLoading: false,
      user: null,
      error: {
        body: {
          message: "Session expired",
        },
      },
    })

    expect(instantAuthClient.useSession()).toEqual({
      status: "signed-out",
      user: null,
      error: new Error("Session expired"),
    })
  })

  it("normalizes request-code failures", async () => {
    mockDb.auth.sendMagicCode.mockRejectedValue({
      body: {
        message: "Unable to send code",
      },
    })

    await expect(
      instantAuthClient.requestCode({ email: "user@example.com" }),
    ).rejects.toThrow("Unable to send code")
  })

  it("normalizes sign-in failures", async () => {
    mockDb.auth.signInWithMagicCode.mockRejectedValue({
      body: {
        message: "Invalid code",
      },
    })

    await expect(
      instantAuthClient.signInWithCode({
        email: "user@example.com",
        code: "123456",
      }),
    ).rejects.toThrow("Invalid code")
  })

  it("normalizes sign-out failures", async () => {
    mockDb.auth.signOut.mockRejectedValue({
      body: {
        message: "Unable to sign out",
      },
    })

    await expect(instantAuthClient.signOut()).rejects.toThrow(
      "Unable to sign out",
    )
  })
})
