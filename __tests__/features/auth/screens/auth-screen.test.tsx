const mockRequestCode = jest.fn()
const mockSignInWithCode = jest.fn()

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
}))

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      switch (key) {
        case "title":
          return "Auth"
        case "requestCodeError":
          return "Unable to request code"
        case "signInError":
          return "Unable to sign in"
        default:
          return key
      }
    },
  }),
}))

jest.mock("react-native-keyboard-controller", () => {
  const React = require("react")
  const { View } = require("react-native")

  return {
    KeyboardAwareScrollView({ children }: { children: React.ReactNode }) {
      return <View>{children}</View>
    },
  }
})

jest.mock("react-native-unistyles", () => ({
  StyleSheet: {
    create: (styles: unknown) =>
      typeof styles === "function"
        ? styles(
            {
              typography: {
                styles: {
                  title2: {},
                  footnote: {},
                  headline: {},
                },
              },
              colors: {
                primary: "#111111",
                secondaryBackground: "#ffffff",
                shadowSoft: "#00000033",
                destructive: "#ff0000",
              },
            },
            {
              insets: {
                bottom: 0,
              },
            },
          )
        : styles,
  },
}))

jest.mock("@/features/auth/hooks/use-auth-actions", () => ({
  useAuthActions: () => ({
    requestCode: mockRequestCode,
    signInWithCode: mockSignInWithCode,
  }),
}))

jest.mock("@/features/auth/components/auth-email-step", () => {
  const React = require("react")
  const { Pressable, Text, TextInput, View } = require("react-native")

  return function MockAuthEmailStep({
    email,
    isSendingCode,
    onChangeEmail,
    onRequestCode,
  }: {
    email: string
    isSendingCode: boolean
    onChangeEmail: (value: string) => void
    onRequestCode: () => void
  }) {
    return (
      <View>
        <Text testID="email-step">{isSendingCode ? "sending" : "idle"}</Text>
        <TextInput
          accessibilityLabel="email-input"
          onChangeText={onChangeEmail}
          value={email}
        />
        <Pressable
          accessibilityLabel="request-code"
          accessibilityRole="button"
          onPress={onRequestCode}
        >
          <Text>request-code</Text>
        </Pressable>
      </View>
    )
  }
})

jest.mock("@/features/auth/components/auth-code-step", () => {
  const React = require("react")
  const { Pressable, Text, TextInput, View } = require("react-native")

  return function MockAuthCodeStep({
    code,
    sentEmail,
    isSigningIn,
    onChangeCode,
    onSignIn,
    onUseDifferentEmail,
  }: {
    code: string
    sentEmail: string
    isSigningIn: boolean
    onChangeCode: (value: string) => void
    onSignIn: () => void
    onUseDifferentEmail: () => void
  }) {
    return (
      <View>
        <Text testID="code-step">{isSigningIn ? "signing-in" : "idle"}</Text>
        <Text testID="sent-email">{sentEmail}</Text>
        <TextInput
          accessibilityLabel="code-input"
          onChangeText={onChangeCode}
          value={code}
        />
        <Pressable
          accessibilityLabel="sign-in"
          accessibilityRole="button"
          onPress={onSignIn}
        >
          <Text>sign-in</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="use-different-email"
          accessibilityRole="button"
          onPress={onUseDifferentEmail}
        >
          <Text>use-different-email</Text>
        </Pressable>
      </View>
    )
  }
})

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"

import AuthScreen from "@/features/auth/screens/auth-screen"

describe("AuthScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequestCode.mockResolvedValue(undefined)
    mockSignInWithCode.mockResolvedValue(undefined)
  })

  it("advances to the code step after requesting a magic code", async () => {
    render(<AuthScreen />)

    fireEvent.changeText(
      screen.getByLabelText("email-input"),
      "  user@example.com  ",
    )
    fireEvent.press(screen.getByLabelText("request-code"))

    await waitFor(() => {
      expect(mockRequestCode).toHaveBeenCalledWith({
        email: "user@example.com",
      })
    })

    expect(screen.getByTestId("code-step")).toBeTruthy()
    expect(screen.getByTestId("sent-email").props.children).toBe(
      "user@example.com",
    )
    expect(screen.getByLabelText("code-input").props.value).toBe("")
  })

  it("shows an error and stays on the email step when requesting a code fails", async () => {
    mockRequestCode.mockRejectedValue(new Error("Unable to send code"))

    render(<AuthScreen />)

    fireEvent.changeText(
      screen.getByLabelText("email-input"),
      "user@example.com",
    )
    fireEvent.press(screen.getByLabelText("request-code"))

    await waitFor(() => {
      expect(screen.getByText("Unable to send code")).toBeTruthy()
    })

    expect(screen.getByTestId("email-step")).toBeTruthy()
    expect(screen.queryByTestId("code-step")).toBeNull()
  })

  it("clears the code and keeps the sent email visible when sign-in fails", async () => {
    mockSignInWithCode.mockRejectedValue(new Error("Invalid code"))

    render(<AuthScreen />)

    fireEvent.changeText(
      screen.getByLabelText("email-input"),
      "user@example.com",
    )
    fireEvent.press(screen.getByLabelText("request-code"))

    await waitFor(() => {
      expect(screen.getByTestId("code-step")).toBeTruthy()
    })

    fireEvent.changeText(screen.getByLabelText("code-input"), "123456")
    fireEvent.press(screen.getByLabelText("sign-in"))

    await waitFor(() => {
      expect(mockSignInWithCode).toHaveBeenCalledWith({
        email: "user@example.com",
        code: "123456",
      })
    })

    await waitFor(() => {
      expect(screen.getByText("Invalid code")).toBeTruthy()
    })

    expect(screen.getByTestId("sent-email").props.children).toBe(
      "user@example.com",
    )
    expect(screen.getByLabelText("code-input").props.value).toBe("")
  })

  it("returns to the email step and clears prior error state when using a different email", async () => {
    mockSignInWithCode.mockRejectedValue(new Error("Invalid code"))

    render(<AuthScreen />)

    fireEvent.changeText(
      screen.getByLabelText("email-input"),
      "user@example.com",
    )
    fireEvent.press(screen.getByLabelText("request-code"))

    await waitFor(() => {
      expect(screen.getByTestId("code-step")).toBeTruthy()
    })

    fireEvent.changeText(screen.getByLabelText("code-input"), "123456")
    fireEvent.press(screen.getByLabelText("sign-in"))

    await waitFor(() => {
      expect(screen.getByText("Invalid code")).toBeTruthy()
    })

    fireEvent.press(screen.getByLabelText("use-different-email"))

    await waitFor(() => {
      expect(screen.getByTestId("email-step")).toBeTruthy()
    })

    expect(screen.queryByText("Invalid code")).toBeNull()
    expect(screen.queryByTestId("code-step")).toBeNull()

    fireEvent.changeText(
      screen.getByLabelText("email-input"),
      "next@example.com",
    )
    fireEvent.press(screen.getByLabelText("request-code"))

    await waitFor(() => {
      expect(mockRequestCode).toHaveBeenLastCalledWith({
        email: "next@example.com",
      })
    })

    expect(screen.getByTestId("sent-email").props.children).toBe(
      "next@example.com",
    )
    expect(screen.getByLabelText("code-input").props.value).toBe("")
  })
})
