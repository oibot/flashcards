const mockJsonError = jest.fn()
const mockLogTtsError = jest.fn()

jest.mock("@/shared/server/api-utils", () => ({
  jsonError: (...args: unknown[]) => mockJsonError(...args),
}))

jest.mock("@/features/cards/audio/server/log", () => ({
  logTtsError: (...args: unknown[]) => mockLogTtsError(...args),
}))

import { TtsResolveError } from "@/features/cards/audio/server/errors"
import { handleTtsRouteError } from "@/features/cards/audio/server/route-utils"

const options = {
  expectedMessage: "Expected audio error",
  fallbackMessage: "Fallback audio error",
  unexpectedMessage: "Unexpected audio error",
  unknownMessage: "Unknown audio error",
}

describe("audio route error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockJsonError.mockImplementation((message: string, status: number) => ({
      message,
      status,
    }))
  })

  it("maps expected TTS errors to their status codes", () => {
    expect(
      handleTtsRouteError(new TtsResolveError("Missing locale", 422), options),
    ).toEqual({
      message: "Missing locale",
      status: 422,
    })
    expect(mockLogTtsError).toHaveBeenCalledWith("Expected audio error", {
      status: 422,
      error: "Missing locale",
    })
  })

  it("maps unexpected Error instances to a 500 response with the thrown message", () => {
    expect(handleTtsRouteError(new Error("Boom"), options)).toEqual({
      message: "Boom",
      status: 500,
    })
    expect(mockLogTtsError).toHaveBeenCalledWith("Unexpected audio error", {
      error: "Boom",
    })
  })

  it("maps unknown thrown values to the fallback 500 response", () => {
    expect(handleTtsRouteError("badness", options)).toEqual({
      message: "Fallback audio error",
      status: 500,
    })
    expect(mockLogTtsError).toHaveBeenCalledWith("Unknown audio error")
  })
})
