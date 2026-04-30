const mockVerifyToken = jest.fn()

jest.mock("@instantdb/admin", () => {
  class MockInstantAPIError extends Error {
    body: unknown
    status: number

    constructor(error: { body: unknown; status: number }) {
      const message =
        !!error.body &&
        typeof error.body === "object" &&
        "message" in error.body &&
        typeof error.body.message === "string"
          ? error.body.message
          : `API Error (${error.status})`

      super(message)
      this.name = "InstantAPIError"
      this.body = error.body
      this.status = error.status
    }
  }

  return {
    InstantAPIError: MockInstantAPIError,
  }
})

jest.mock("@/features/cards/data/instant/admin", () => ({
  getAdminDb: () => ({
    auth: {
      verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
    },
  }),
}))

import { InstantAPIError } from "@instantdb/admin"

import {
  getBearerToken,
  readJsonBody,
  requireAuthenticatedUser,
} from "@/shared/server/api-utils"

function createRequest(init?: RequestInit) {
  return new Request("https://example.com", init)
}

async function expectJsonError(
  response: Response,
  status: number,
  message: string,
) {
  expect(response).toBeInstanceOf(Response)
  expect(response.status).toBe(status)
  expect(await response.json()).toEqual({ error: message })
}

describe("getBearerToken", () => {
  it("returns null for missing or invalid authorization headers", () => {
    expect(getBearerToken(createRequest())).toBeNull()
    expect(
      getBearerToken(
        createRequest({
          headers: {
            authorization: "Basic abc123",
          },
        }),
      ),
    ).toBeNull()
    expect(
      getBearerToken(
        createRequest({
          headers: {
            authorization: "Bearer   ",
          },
        }),
      ),
    ).toBeNull()
  })

  it("returns the trimmed bearer token for valid authorization headers", () => {
    expect(
      getBearerToken(
        createRequest({
          headers: {
            authorization: "Bearer  abc123  ",
          },
        }),
      ),
    ).toBe("abc123")
  })
})

describe("requireAuthenticatedUser", () => {
  const baseOptions = {
    invalidTokenLog: "invalid-token",
    missingTokenLog: "missing-token",
    logWarning: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns an unauthorized response when the token is missing", async () => {
    const result = await requireAuthenticatedUser(createRequest(), baseOptions)

    expect(baseOptions.logWarning).toHaveBeenCalledWith("missing-token")
    await expectJsonError(result as Response, 401, "Unauthorized")
    expect(mockVerifyToken).not.toHaveBeenCalled()
  })

  it("returns an unauthorized response when token verification returns no user", async () => {
    mockVerifyToken.mockResolvedValue(null)

    const result = await requireAuthenticatedUser(
      createRequest({
        headers: {
          authorization: "Bearer token-123",
        },
      }),
      baseOptions,
    )

    expect(mockVerifyToken).toHaveBeenCalledWith("token-123")
    expect(baseOptions.logWarning).toHaveBeenCalledWith("invalid-token")
    await expectJsonError(result as Response, 401, "Unauthorized")
  })

  it("returns an unauthorized response for authentication failures", async () => {
    mockVerifyToken.mockRejectedValue(
      new InstantAPIError({
        status: 401,
        body: {
          type: undefined,
          message: "Invalid token",
        },
      }),
    )

    const result = await requireAuthenticatedUser(
      createRequest({
        headers: {
          authorization: "Bearer token-123",
        },
      }),
      baseOptions,
    )

    expect(baseOptions.logWarning).toHaveBeenCalledWith("invalid-token")
    await expectJsonError(result as Response, 401, "Unauthorized")
  })

  it("returns the authenticated user for valid tokens", async () => {
    const authenticatedUser = {
      id: "user-1",
      email: "user@example.com",
    }
    mockVerifyToken.mockResolvedValue(authenticatedUser)

    const result = await requireAuthenticatedUser(
      createRequest({
        headers: {
          authorization: "Bearer token-123",
        },
      }),
      baseOptions,
    )

    expect(result).toEqual(authenticatedUser)
    expect(baseOptions.logWarning).not.toHaveBeenCalled()
  })
})

describe("readJsonBody", () => {
  const baseOptions = {
    context: {
      route: "/api/example",
    },
    invalidBodyLog: "invalid-body",
    invalidBodyMessage: "Body shape is invalid.",
    invalidJsonLog: "invalid-json",
    logWarning: jest.fn(),
  }

  type ExampleBody = {
    count: number
  }

  const isExampleBody = (value: unknown): value is ExampleBody => {
    return (
      !!value &&
      typeof value === "object" &&
      "count" in value &&
      typeof value.count === "number"
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns an error response for invalid json payloads", async () => {
    const result = await readJsonBody<ExampleBody>(
      createRequest({
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: "{",
      }),
      isExampleBody,
      baseOptions,
    )

    expect(baseOptions.logWarning).toHaveBeenCalledWith("invalid-json", {
      route: "/api/example",
    })
    await expectJsonError(
      result as Response,
      400,
      "Request body must be valid JSON.",
    )
  })

  it("returns an error response for invalid body shapes", async () => {
    const result = await readJsonBody<ExampleBody>(
      createRequest({
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ count: "1" }),
      }),
      isExampleBody,
      baseOptions,
    )

    expect(baseOptions.logWarning).toHaveBeenCalledWith("invalid-body", {
      route: "/api/example",
    })
    await expectJsonError(result as Response, 400, "Body shape is invalid.")
  })

  it("returns the parsed body when validation succeeds", async () => {
    const result = await readJsonBody<ExampleBody>(
      createRequest({
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ count: 2 }),
      }),
      isExampleBody,
      baseOptions,
    )

    expect(result).toEqual({ count: 2 })
    expect(baseOptions.logWarning).not.toHaveBeenCalled()
  })
})
