import { i } from "@instantdb/react-native"

const schema = i.schema({
  entities: {
    decks: i.entity({
      title: i.string(),
      description: i.string().optional(),
      createdAt: i.date(),
      updatedAt: i.date().indexed(),
    }),
  },
  links: {},
})

export type AppSchema = typeof schema

export default schema
