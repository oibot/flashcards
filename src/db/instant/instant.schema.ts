import { i } from "@instantdb/react-native"

const schema = i.schema({
  entities: {
    cards: i.entity({
      tag: i.string().indexed(),
      frontHtml: i.string(),
      backHtml: i.string(),
      createdAt: i.date(),
      updatedAt: i.date().indexed(),
    }),
  },
  links: {},
})

export type AppSchema = typeof schema

export default schema
