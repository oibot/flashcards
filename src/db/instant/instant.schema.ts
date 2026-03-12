import { i } from "@instantdb/react-native"

const schema = i.schema({
  entities: {
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
      title: i.string().unique().indexed(),
    }),
  },
  links: {
    cardsTags: {
      forward: { on: "cards", has: "many", label: "tags" },
      reverse: { on: "tags", has: "many", label: "cards" },
    },
  },
})

export type AppSchema = typeof schema

export default schema
