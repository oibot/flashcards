import {
  toCard,
  toCardBackupCardSet,
  toTimestamp,
} from "@/features/cards/data/instant/instant-utils"

function asCardRecord(value: unknown): Parameters<typeof toCard>[0] {
  return value as Parameters<typeof toCard>[0]
}

describe("instant utils", () => {
  it("normalizes numeric and ISO timestamps", () => {
    expect(toTimestamp("42")).toBe(42)
    expect(toTimestamp("2024-01-02T03:04:05.000Z")).toBe(
      Date.parse("2024-01-02T03:04:05.000Z"),
    )
  })

  it("maps reverse cards into visible card data", () => {
    const card = toCard(
      asCardRecord({
        id: "card-1",
        variant: "reverse",
        createdAt: "10",
        updatedAt: "20",
        dueAt: "30",
        lastReviewedAt: "40",
        intervalDays: 5,
        easeFactor: 2.6,
        repetition: 2,
        lapses: 1,
        state: "review",
        cardSet: {
          id: "set-1",
          tags: [{ title: "Travel" }],
          sideAHtml: "<p>Front</p>",
          sideBHtml: "<p>Back</p>",
          sideATtsLocale: "en-US",
          sideBTtsLocale: undefined,
          sideATtsAsset: null,
          sideBTtsAsset: { file: {} },
          createdAt: "5",
          updatedAt: "25",
        },
      }),
    )

    expect(card).toEqual({
      id: "card-1",
      cardSetId: "set-1",
      variant: "reverse",
      tags: ["Travel"],
      frontTtsLocale: undefined,
      backTtsLocale: "en-US",
      frontHtml: "<p>Back</p>",
      backHtml: "<p>Front</p>",
      frontHasSound: true,
      backHasSound: true,
      createdAt: 10,
      updatedAt: 25,
      dueAt: 30,
      lastReviewedAt: 40,
      intervalDays: 5,
      easeFactor: 2.6,
      repetition: 2,
      lapses: 1,
      state: "review",
    })
  })

  it("rejects invalid card states", () => {
    expect(() =>
      toCard(
        asCardRecord({
          id: "card-1",
          variant: "forward",
          createdAt: 1,
          updatedAt: 1,
          dueAt: 1,
          lastReviewedAt: 0,
          intervalDays: 0,
          easeFactor: 2.5,
          repetition: 0,
          lapses: 0,
          state: "unknown",
          cardSet: {
            id: "set-1",
            tags: [],
            sideAHtml: "<p>A</p>",
            sideBHtml: "<p>B</p>",
            sideATtsLocale: undefined,
            sideBTtsLocale: undefined,
            sideATtsAsset: null,
            sideBTtsAsset: null,
            createdAt: 1,
            updatedAt: 1,
          },
        }),
      ),
    ).toThrow("Invalid card state")
  })

  it("rejects invalid variants", () => {
    expect(() =>
      toCard(
        asCardRecord({
          id: "card-1",
          variant: "sideways",
          createdAt: 1,
          updatedAt: 1,
          dueAt: 1,
          lastReviewedAt: 0,
          intervalDays: 0,
          easeFactor: 2.5,
          repetition: 0,
          lapses: 0,
          state: "new",
          cardSet: {
            id: "set-1",
            tags: [],
            sideAHtml: "<p>A</p>",
            sideBHtml: "<p>B</p>",
            sideATtsLocale: undefined,
            sideBTtsLocale: undefined,
            sideATtsAsset: null,
            sideBTtsAsset: null,
            createdAt: 1,
            updatedAt: 1,
          },
        }),
      ),
    ).toThrow("Invalid card variant")
  })

  it("rejects missing card sets", () => {
    expect(() =>
      toCard(
        asCardRecord({
          id: "card-1",
          variant: "forward",
          createdAt: 1,
          updatedAt: 1,
          dueAt: 1,
          lastReviewedAt: 0,
          intervalDays: 0,
          easeFactor: 2.5,
          repetition: 0,
          lapses: 0,
          state: "new",
          cardSet: null,
        }),
      ),
    ).toThrow("Missing card set")
  })

  it("sorts backup cards by created time and id", () => {
    const cardSet = toCardBackupCardSet({
      id: "set-1",
      tags: [{ title: "Travel" }],
      sideAHtml: "<p>A</p>",
      sideBHtml: "<p>B</p>",
      sideATtsLocale: undefined,
      sideBTtsLocale: "de-DE",
      createdAt: 1,
      updatedAt: 2,
      cards: [
        {
          id: "b",
          variant: "forward",
          createdAt: 3,
          updatedAt: 3,
          dueAt: 3,
          lastReviewedAt: 0,
          intervalDays: 0,
          easeFactor: 2.5,
          repetition: 0,
          lapses: 0,
          state: "new",
        },
        {
          id: "c",
          variant: "reverse",
          createdAt: 1,
          updatedAt: 1,
          dueAt: 1,
          lastReviewedAt: 0,
          intervalDays: 0,
          easeFactor: 2.5,
          repetition: 0,
          lapses: 0,
          state: "new",
        },
        {
          id: "a",
          variant: "forward",
          createdAt: 1,
          updatedAt: 1,
          dueAt: 1,
          lastReviewedAt: 0,
          intervalDays: 0,
          easeFactor: 2.5,
          repetition: 0,
          lapses: 0,
          state: "new",
        },
      ],
    } as Parameters<typeof toCardBackupCardSet>[0])

    expect(cardSet.cards.map((card) => card.id)).toEqual(["a", "c", "b"])
  })
})
