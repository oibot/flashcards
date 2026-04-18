import { i } from "@instantdb/react-native"

const schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    profiles: i.entity({
      createdAt: i.date().indexed(),
    }),
    cardSets: i.entity({
      sideAHtml: i.string(),
      sideBHtml: i.string(),
      createdAt: i.date(),
      updatedAt: i.date().indexed(),
    }),
    cards: i.entity({
      variant: i.string(),
      createdAt: i.date(),
      updatedAt: i.date().indexed(),
      dueAt: i.date().indexed(),
      lastReviewedAt: i.date(),
      intervalDays: i.number(),
      easeFactor: i.number(),
      repetition: i.number(),
      lapses: i.number(),
      state: i.string(),
    }),
    tags: i.entity({
      ownerTitle: i.string().unique(),
      title: i.string().indexed(),
    }),
    ttsAssets: i.entity({
      cacheKey: i.string().unique().indexed(),
      sourceText: i.string(),
      normalizedText: i.string(),
      locale: i.string().indexed(),
      provider: i.string(),
      voiceId: i.string(),
      modelId: i.string(),
      outputFormat: i.string(),
      status: i.string().indexed(),
      durationMs: i.number().optional(),
      error: i.string().optional(),
      createdAt: i.date(),
      updatedAt: i.date().indexed(),
    }),
  },
  links: {
    profileUser: {
      forward: {
        on: "profiles",
        has: "one",
        label: "$user",
        onDelete: "cascade",
      },
      reverse: { on: "$users", has: "one", label: "profile" },
    },
    cardOwner: {
      forward: { on: "cards", has: "one", label: "owner", onDelete: "cascade" },
      reverse: { on: "$users", has: "many", label: "cards" },
    },
    cardSetOwner: {
      forward: {
        on: "cardSets",
        has: "one",
        label: "owner",
        onDelete: "cascade",
      },
      reverse: { on: "$users", has: "many", label: "cardSets" },
    },
    cardSetCards: {
      forward: {
        on: "cards",
        has: "one",
        label: "cardSet",
        onDelete: "cascade",
      },
      reverse: { on: "cardSets", has: "many", label: "cards" },
    },
    cardSetTags: {
      forward: { on: "cardSets", has: "many", label: "tags" },
      reverse: { on: "tags", has: "many", label: "cardSets" },
    },
    cardSetSideATtsAsset: {
      forward: {
        on: "cardSets",
        has: "one",
        label: "sideATtsAsset",
      },
      reverse: {
        on: "ttsAssets",
        has: "many",
        label: "sideAOfCardSets",
      },
    },
    cardSetSideBTtsAsset: {
      forward: {
        on: "cardSets",
        has: "one",
        label: "sideBTtsAsset",
      },
      reverse: {
        on: "ttsAssets",
        has: "many",
        label: "sideBOfCardSets",
      },
    },
    tagOwner: {
      forward: { on: "tags", has: "one", label: "owner", onDelete: "cascade" },
      reverse: { on: "$users", has: "many", label: "tags" },
    },
    ttsAssetFile: {
      forward: {
        on: "ttsAssets",
        has: "one",
        label: "file",
      },
      reverse: {
        on: "$files",
        has: "one",
        label: "ttsAsset",
      },
    },
  },
})

export type AppSchema = typeof schema

export default schema
