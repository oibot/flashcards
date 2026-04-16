import type { InstantRules } from "@instantdb/react-native"

const rules = {
  $users: {
    allow: {
      view: "auth.id == data.id",
      create: "true",
      delete: "false",
      update: "false",
    },
  },
  profiles: {
    bind: [
      "isOwner",
      "data.id in auth.ref('$user.profile.id')",
      "isCreatingAsOwner",
      "auth.id in data.ref('$user.id')",
    ],
    allow: {
      view: "isOwner",
      create: "isCreatingAsOwner",
      update: "isOwner",
      delete: "isOwner",
    },
  },
  cardSets: {
    bind: [
      "isOwner",
      "data.id in auth.ref('$user.cardSets.id')",
      "isCreatingAsOwner",
      "auth.id in data.ref('owner.id')",
    ],
    allow: {
      view: "isOwner",
      create: "isCreatingAsOwner",
      update: "isOwner",
      delete: "isOwner",
    },
  },
  cards: {
    bind: [
      "isOwner",
      "data.id in auth.ref('$user.cards.id')",
      "isCreatingAsOwner",
      "auth.id in data.ref('owner.id')",
    ],
    allow: {
      view: "isOwner",
      create: "isCreatingAsOwner",
      update: "isOwner",
      delete: "isOwner",
    },
  },
  tags: {
    bind: [
      "isOwner",
      "data.id in auth.ref('$user.tags.id')",
      "isCreatingAsOwner",
      "auth.id in data.ref('owner.id')",
      "hasValidCompositeKey",
      "data.ownerTitle == (auth.id + ':' + data.title)",
    ],
    allow: {
      view: "isOwner",
      create: "isCreatingAsOwner && hasValidCompositeKey",
      update:
        "isOwner && newData.ownerTitle == (auth.id + ':' + newData.title)",
      delete: "isOwner",
    },
  },
} satisfies InstantRules

export default rules
