# Flipped Card Feature

## Goal

Model one vocabulary item as a `cardSet` that can produce one or more review
`cards`.

This keeps shared content in one place and keeps review scheduling on the
individual cards that the scheduler actually works with.

## Database Schema

### Core idea

- `cardSets` stores the shared vocabulary content.
- `cards` stores the review scheduling state for one direction.
- Sibling cards are derived from membership in the same `cardSet`.
- Tags belong to the `cardSet`, not to individual `cards`.
- Ownership is canonical on `cardSets` and duplicated on `cards` for
  permissions and top-level card queries.

### Entities

#### `cardSets`

Fields:

- `sideAHtml: string`
- `sideBHtml: string`
- `createdAt: date`
- `updatedAt: date`

New entity:

- `cardSets` does not exist in the current schema and is added by this feature.

Notes:

- Use neutral names like `sideAHtml` and `sideBHtml`.
- Do not use `frontHtml` and `backHtml` on the set, because once reversed cards
  exist, front and back are properties of a specific review card, not of the
  shared vocabulary item.

#### `cards`

Fields:

- `variant: string`
- `createdAt: date`
- `updatedAt: date`
- `dueAt: date`
- `lastReviewedAt: date`
- `intervalDays: number`
- `easeFactor: number`
- `repetition: number`
- `lapses: number`
- `state: string`

Removed from `cards`:

- `frontHtml`
- `backHtml`

Notes:

- `variant` identifies which direction this review card represents.
- Initial variants are:
  - `forward`
  - `reverse`
- Scheduling stays on the card itself. Paired cards do not share due dates,
  ease, repetitions, or lapses.

#### `tags`

No new tag fields are required for this feature.

Tags should be linked to `cardSets`, not to `cards`, because tags describe the
underlying vocabulary item rather than one review direction.

### Links

Recommended links:

- `cardSetOwner`: `cardSet -> owner`
- `cardOwner`: `card -> owner`
- `cardSetCards`: `card -> cardSet`
- `cardSetTags`: `cardSet <-> tags`

Removed links from the current schema:

- `cardsTags`

Retained links from the current schema:

- `cardOwner`
- `tagOwner`

Sibling relation:

- There is no explicit `siblingId` field.
- There is no explicit `siblings` link.
- Siblings are all cards linked to the same `cardSet`.

### Indexing

Required or recommended indexes:

- `cardSets.updatedAt`
- `cards.updatedAt`
- `cards.dueAt`
- `cards.variant` if cards will later be filtered by variant

### Schema sketch

```ts
const schema = i.schema({
  entities: {
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
  },
  links: {
    cardSetOwner: {
      forward: { on: "cardSets", has: "one", label: "owner", onDelete: "cascade" },
      reverse: { on: "$users", has: "many", label: "cardSets" },
    },
    cardOwner: {
      forward: { on: "cards", has: "one", label: "owner", onDelete: "cascade" },
      reverse: { on: "$users", has: "many", label: "cards" },
    },
    cardSetCards: {
      forward: { on: "cards", has: "one", label: "cardSet", onDelete: "cascade" },
      reverse: { on: "cardSets", has: "many", label: "cards" },
    },
    cardSetTags: {
      forward: { on: "cardSets", has: "many", label: "tags" },
      reverse: { on: "tags", has: "many", label: "cardSets" },
    },
    tagOwner: {
      forward: { on: "tags", has: "one", label: "owner", onDelete: "cascade" },
      reverse: { on: "$users", has: "many", label: "tags" },
    },
  },
})
```

## Domain Model

### Core entities

```ts
type CardSetId = string
type CardId = string

type CardVariant = "forward" | "reverse"

type CardSet = {
  id: CardSetId
  sideAHtml: string
  sideBHtml: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

type Card = {
  id: CardId
  cardSetId: CardSetId
  variant: CardVariant
  createdAt: number
  updatedAt: number
  dueAt: number
  lastReviewedAt: number
  intervalDays: number
  easeFactor: number
  repetition: number
  lapses: number
  state: CardState
}
```

### Write model

The write model should describe which card variants the set should contain.

```ts
type CreateCardSetInput = {
  sideAHtml: string
  sideBHtml: string
  tags: string[]
  variants: CardVariant[]
}
```

Examples:

- one direction only: `["forward"]`
- both directions: `["forward", "reverse"]`

The UI can still expose this as a simple boolean toggle, but the domain model
should describe the result directly: which cards exist in the set.

### Read model for review

Review still works with individual cards, but it needs resolved front and back
content.

That is best modeled as a derived read model rather than stored duplicated data.

```ts
type ReviewCard = Card & {
  frontHtml: string
  backHtml: string
  tags: string[]
}
```

Resolution rules:

- `forward` uses `sideAHtml -> frontHtml` and `sideBHtml -> backHtml`
- `reverse` uses `sideBHtml -> frontHtml` and `sideAHtml -> backHtml`

## Decisions

- Add a first-class `cardSet` entity now.
- Store shared vocabulary content on the set.
- Store per-direction scheduling on child cards.
- Use `variant` instead of a direct sibling pointer.
- Derive siblings from the shared `cardSet`.
- Keep tags on the set.
- Use neutral side names on the set and resolve front/back at read time.

## UI

### User mental model

- The user continues to think in cards.
- `cardSet` is an internal persistence abstraction.
- The UI should not expose `cardSet`, `variant`, or sibling terminology.

### New card screen

The existing `Front`, `Back`, and `Tags` fields stay.

Add one create-time control:

- `Practice opposite direction too`

Behavior:

- Off: create one visible card only
- On: create the visible card and its opposite-direction card

The control should live in the new card screen and default to off.

### Edit card screen

Behavior:

- The screen edits the selected visible card as the user sees it.
- If the user opened a reverse card, the editor still shows:
  - `Front = visible front`
  - `Back = visible back`
- The screen does not explain or reveal whether the card is `forward` or
  `reverse`.
- The edit screen does not include the `Practice opposite direction too`
  control.
- Variant creation remains a new-card-only decision in the first
  implementation.

### Delete behavior

- Deleting from review deletes the entire `cardSet`
- This removes the selected visible card and all opposite-direction variants in
  the same set
- Deleting a card therefore always deletes the underlying vocabulary item

The delete confirmation should reflect this behavior clearly.

The alert copy should communicate that:

- the user is deleting this card
- any other direction variants of the same card will also be deleted
- the review history for those variants will be lost

This keeps the initial behavior straightforward and avoids partial-delete edge
cases in the first implementation.

### Settings

Temporary migration support should be added to the settings screen:

- `Export Legacy Cards`
- `Delete All Cards`

Notes:

- These are temporary migration/testing actions, not permanent product features.
- `Delete All Cards` should remove all study data for the signed-in user:
  `cards`, `cardSets`, and tags.

## Wiring

### Form state

The edit/new form can stay in UI terms:

```ts
type EditableCardDraft = {
  frontHtml: string
  backHtml: string
  tags: string[]
}
```

The edit form does not need to know about `sideA`, `sideB`, or `variant`.

For the new-card screen only, the UI also needs:

```ts
type NewCardDraft = EditableCardDraft & {
  hasOppositeDirection: boolean
}
```

### Save mapping

The store layer is responsible for mapping visible front/back content to the
normalized `cardSet` fields.

For a `forward` card:

- `sideAHtml = frontHtml`
- `sideBHtml = backHtml`

For a `reverse` card:

- `sideAHtml = backHtml`
- `sideBHtml = frontHtml`

This allows the user to edit the card exactly as it appears in the UI while the
database remains normalized.

### Store operations

Recommended store/domain operations:

- `createCardSet(input)`
- `updateCardContent(cardId, input)`
- `removeCard(cardId)`
- `deleteAllStudyData()`

Responsibilities:

- `createCardSet(input)` creates one `cardSet` and one or more child `cards`
- `updateCardContent(cardId, input)` resolves the card, maps UI front/back to
  `sideAHtml` and `sideBHtml`, and updates tags on the set
- `removeCard(cardId)` resolves the selected card, deletes the entire
  `cardSet`, and therefore deletes all cards in that set
- `deleteAllStudyData()` removes all user study data for migration/testing

### Read models

The UI should be fed by derived read models, not raw normalized entities.

Recommended read models:

- `EditableCard`
- `ReviewCard`

Example:

```ts
type EditableCard = {
  id: CardId
  frontHtml: string
  backHtml: string
  tags: string[]
}
```

This keeps the screens simple and avoids leaking persistence concerns into the
UI layer.

## Temporary Legacy Export

Before changing the schema, add a temporary export path for the current flat
card model.

This must happen first so existing test cards can be saved before the migration.

The temporary exporter should not write the old flat format.

Instead, it should read from the current flat card storage and write the future
normalized export format that the new app will import later.

### Required order

1. Implement temporary legacy export in settings
2. Export existing test cards from the current app
3. Implement the normalized `cardSet` / `card` feature

### Legacy export shape

Use the future normalized export shape without introducing a backup format
versioning system.

This means:

- legacy export input: current flat `cards`
- future export input: normalized `cardSets` + `cards`
- export output for both: the same normalized backup shape

The import side should only need to support one format: the normalized one.

Recommended shape:

```ts
type CardExport = {
  app: "flashcards"
  exportedAt: string
  cardSets: Array<{
    id: CardSetId
    sideAHtml: string
    sideBHtml: string
    tags: string[]
    createdAt: number
    updatedAt: number
    cards: Array<{
      id: CardId
      variant: CardVariant
      createdAt: number
      updatedAt: number
      dueAt: number
      lastReviewedAt: number
      intervalDays: number
      easeFactor: number
      repetition: number
      lapses: number
      state: CardState
    }>
  }>
}
```

### Legacy export mapping

When exporting from the current flat model into the future normalized format:

- each legacy card becomes one `cardSet`
- that `cardSet` contains one child `forward` card
- `frontHtml` maps to `sideAHtml`
- `backHtml` maps to `sideBHtml`
- tags move onto the `cardSet`
- review scheduling fields move onto the child `card`

Do not try to auto-detect or merge manually duplicated reverse cards from the
legacy data.

If the user previously created both directions manually, export them as two
separate single-card sets.

This is a temporary migration utility for local test data, not a long-term
public backup contract.
