jest.mock("@sentry/node", () => ({
  init: jest.fn(),
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

import * as Sentry from "@sentry/node"

import {
  logTtsError,
  logTtsInfo,
  logTtsWarn,
} from "@/features/cards/audio/server/log"
import { SENTRY_DSN } from "@/shared/lib/sentry"

const mockSentryInit = jest.mocked(Sentry.init)
const mockSentryInfo = jest.mocked(Sentry.logger.info)
const mockSentryWarn = jest.mocked(Sentry.logger.warn)
const mockSentryError = jest.mocked(Sentry.logger.error)

describe("TTS logging", () => {
  beforeEach(() => {
    mockSentryInfo.mockClear()
    mockSentryWarn.mockClear()
    mockSentryError.mockClear()
  })

  it("initializes Sentry structured logging", () => {
    expect(mockSentryInit).toHaveBeenCalledWith({
      dsn: SENTRY_DSN,
      enableLogs: true,
    })
  })

  it("sends structured logs to Sentry at the requested level", () => {
    logTtsInfo("Started", { userId: "user-1", missing: undefined })
    logTtsWarn("Degraded", { status: 429 })
    logTtsError("Failed", { error: "Unavailable" })

    expect(mockSentryInfo).toHaveBeenCalledWith("Started", {
      userId: "user-1",
      feature: "tts",
    })
    expect(mockSentryWarn).toHaveBeenCalledWith("Degraded", {
      status: 429,
      feature: "tts",
    })
    expect(mockSentryError).toHaveBeenCalledWith("Failed", {
      error: "Unavailable",
      feature: "tts",
    })
  })
})
