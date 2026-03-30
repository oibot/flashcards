import { i } from "@instantdb/react-native"

const schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    profiles: i.entity({
      createdAt: i.date().indexed(),
    }),
    cards: i.entity({
      frontHtml: i.string(),
      backHtml: i.string(),
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
    cardsTags: {
      forward: { on: "cards", has: "many", label: "tags" },
      reverse: { on: "tags", has: "many", label: "cards" },
    },
    tagOwner: {
      forward: { on: "tags", has: "one", label: "owner", onDelete: "cascade" },
      reverse: { on: "$users", has: "many", label: "tags" },
    },
  },
})

export type AppSchema = typeof schema

export default schema
