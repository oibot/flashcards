jest.mock("react-native-unistyles", () => ({
  StyleSheet: {
    create: (styles: unknown) =>
      typeof styles === "function"
        ? styles(
            {
              typography: {
                getScaledSize: (size: number) => size,
                getScaledStyle: (style: string) => ({
                  fontSize: style === "largeTitle" ? 34 : 28,
                }),
              },
              colors: {
                accent: "#00aa88",
                chromeMuted: "#cccccc",
                primary: "#111111",
                secondary: "#666666",
                secondaryBackground: "#eeeeee",
              },
            },
            { contentSizeCategory: "medium" },
          )
        : styles,
  },
}))

import { render, screen } from "@testing-library/react-native"

import ReviewCardContent from "@/features/cards/review/components/review-card-content"

describe("ReviewCardContent", () => {
  it("renders authored paragraph alignment", () => {
    render(
      <ReviewCardContent html={'<p style="text-align: right">Aligned</p>'} />,
    )

    expect(screen.getByText("Aligned")).toHaveStyle({ textAlign: "right" })
  })

  it("renders MVP text sizes through heading styles", () => {
    render(<ReviewCardContent html="<h1>Title</h1><h3>Large</h3>" />)

    expect(screen.getByText("Title")).toHaveStyle({
      fontSize: 34,
      fontWeight: "700",
    })
    expect(screen.getByText("Large")).toHaveStyle({
      fontSize: 32,
      fontWeight: "400",
    })
  })
})
