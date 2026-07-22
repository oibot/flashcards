import {
  diffTags,
  planAddCard,
  planImportCards,
  planUpdateCard,
} from "@/features/cards/data/instant/instant-card-store-update-plan"

describe("instant card store planners", () => {
  it("computes tag diffs", () => {
    expect(diffTags(["Travel", "German"], ["German", "Verbs"])).toEqual({
      tagsToLink: ["Verbs"],
      tagsToUnlink: ["Travel"],
    })
  })

  it("normalizes tags and avoids tag changes when the stored and desired tags match", () => {
    const plan = planUpdateCard({
      input: {
        id: "card-1",
        cardSetId: "set-1",
        previousTags: ["Travel", "German"],
        variant: "forward",
        tags: [" german ", "travel"],
        frontHtml: "<p>Front</p>",
        backHtml: "<p>Back</p>",
      },
      now: 123,
    })

    expect(plan).toEqual({
      cardSetId: "set-1",
      cardSetUpdate: {
        sideAHtml: "<p>Front</p>",
        sideBHtml: "<p>Back</p>",
        updatedAt: 123,
      },
      tagsToLink: [],
      tagsToUnlink: [],
    })
  })

  it("maps reverse cards back to canonical sides and computes tag deltas from stored data", () => {
    const plan = planUpdateCard({
      input: {
        id: "card-2",
        cardSetId: "set-2",
        previousTags: ["Travel", "German"],
        variant: "reverse",
        tags: ["Travel", " Verbs "],
        frontHtml: "<p>Visible front</p>",
        backHtml: "<p>Visible back</p>",
        tts: {
          front: {
            locale: "de-DE",
            assetId: null,
          },
          back: {
            locale: null,
            assetId: null,
          },
        },
      },
      now: 456,
    })

    expect(plan).toEqual({
      cardSetId: "set-2",
      cardSetUpdate: {
        sideAHtml: "<p>Visible back</p>",
        sideBHtml: "<p>Visible front</p>",
        sideATtsLocale: null,
        sideBTtsLocale: "de-DE",
        updatedAt: 456,
      },
      tagsToLink: ["Verbs"],
      tagsToUnlink: ["German"],
    })
  })

  it("plans add-card writes with canonical fields and initial schedules", () => {
    const plan = planAddCard({
      input: {
        tags: [" german ", "travel", "German"],
        frontHtml: "<p>Front</p>",
        backHtml: "<p>Back</p>",
        variants: ["forward", "reverse"],
        tts: {
          front: {
            locale: "en-US",
            assetId: null,
          },
          back: {
            locale: null,
            assetId: null,
          },
        },
      },
      now: 999,
      cardSetId: "set-3",
      cardIds: ["card-a", "card-b"],
    })

    expect(plan).toEqual({
      cardSetId: "set-3",
      tags: ["German", "Travel"],
      cardSetUpdate: {
        sideAHtml: "<p>Front</p>",
        sideAShowText: true,
        sideBHtml: "<p>Back</p>",
        sideBShowText: true,
        sideATtsLocale: "en-US",
        sideBTtsLocale: null,
        createdAt: 999,
        updatedAt: 999,
      },
      cards: [
        {
          id: "card-a",
          variant: "forward",
          createdAt: 999,
          updatedAt: 999,
          dueAt: 999,
          lastReviewedAt: 0,
          intervalDays: 0,
          easeFactor: 2.5,
          repetition: 0,
          lapses: 0,
          state: "new",
        },
        {
          id: "card-b",
          variant: "reverse",
          createdAt: 999,
          updatedAt: 999,
          dueAt: 999,
          lastReviewedAt: 0,
          intervalDays: 0,
          easeFactor: 2.5,
          repetition: 0,
          lapses: 0,
          state: "new",
        },
      ],
    })
  })

  it("shapes import plans with normalized tags and previous tag state", () => {
    const plan = planImportCards({
      backup: {
        app: "flashcards",
        exportedAt: "2024-01-01T00:00:00.000Z",
        cardSets: [
          {
            id: "set-1",
            tags: [" german ", "verbs", "German"],
            sideAHtml: "<p>A</p>",
            sideBHtml: "<p>B</p>",
            sideATtsLocale: "en-US",
            sideBTtsLocale: undefined,
            createdAt: 10,
            updatedAt: 20,
            cards: [
              {
                id: "card-1",
                variant: "forward",
                createdAt: 10,
                updatedAt: 20,
                dueAt: 30,
                lastReviewedAt: 40,
                intervalDays: 5,
                easeFactor: 2.5,
                repetition: 2,
                lapses: 1,
                state: "review",
              },
            ],
          },
          {
            id: "set-2",
            tags: ["travel"],
            sideAHtml: "<p>C</p>",
            sideBHtml: "<p>D</p>",
            createdAt: 11,
            updatedAt: 21,
            cards: [],
          },
        ],
      },
      existingCardSets: [{ id: "set-1", tags: ["German"] }],
    })

    expect(plan.importedTags).toEqual(["German", "Verbs", "Travel"])
    expect(plan.cardSets).toEqual([
      {
        id: "set-1",
        tags: ["German", "Verbs"],
        previousTags: ["German"],
        sideAHtml: "<p>A</p>",
        sideAShowText: true,
        sideBHtml: "<p>B</p>",
        sideBShowText: true,
        sideATtsLocale: "en-US",
        sideBTtsLocale: undefined,
        createdAt: 10,
        updatedAt: 20,
      },
      {
        id: "set-2",
        tags: ["Travel"],
        previousTags: [],
        sideAHtml: "<p>C</p>",
        sideAShowText: true,
        sideBHtml: "<p>D</p>",
        sideBShowText: true,
        sideATtsLocale: undefined,
        sideBTtsLocale: undefined,
        createdAt: 11,
        updatedAt: 21,
      },
    ])
    expect(plan.cards).toEqual([
      {
        id: "card-1",
        cardSetId: "set-1",
        variant: "forward",
        createdAt: 10,
        updatedAt: 20,
        dueAt: 30,
        lastReviewedAt: 40,
        intervalDays: 5,
        easeFactor: 2.5,
        repetition: 2,
        lapses: 1,
        state: "review",
      },
    ])
  })
})
