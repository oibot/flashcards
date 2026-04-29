## ADDED Requirements

### Requirement: Review preparation behavior must have direct automated coverage

The codebase SHALL provide direct automated coverage for review preparation behavior that determines which cards can start a due or all-cards review session.

#### Scenario: Review prep derives sorted due and all-card lists

- **WHEN** tests exercise review prep with cards before, at, and after the controlled review timestamp
- **THEN** the tests MUST verify due-card filtering, all-card inclusion, due-date ordering, due count, and all-card count

#### Scenario: Review prep refreshes due cards on focus

- **WHEN** tests exercise review prep focus behavior with controlled timestamps
- **THEN** the tests MUST verify that due-card selection updates when the review prep view regains focus

#### Scenario: Review prep exposes loading and error state

- **WHEN** tests exercise review prep while card loading or card query errors are present
- **THEN** the tests MUST verify that loading and error state are returned without preparing stale cards

### Requirement: Review session hook behavior must have direct automated coverage

The codebase SHALL provide direct automated coverage for review session behavior that initializes cards, reveals answers, grades cards, deletes cards, handles mutation failures, and completes sessions.

#### Scenario: Review session initializes from seed or live cards

- **WHEN** tests exercise the review session hook with an initial seed, live cards, loading state, query errors, or no cards
- **THEN** the tests MUST verify initial card selection, loading/error state, progress label, empty-session close behavior, and seeded-session independence from query errors

#### Scenario: Review session reveals, shows front, and grades cards

- **WHEN** tests reveal a card, show the front side, and grade cards successfully
- **THEN** the tests MUST verify visible side/html transitions, review mutation payloads, reviewed count, card advancement, and completion behavior

#### Scenario: Review session handles grade failures without advancing

- **WHEN** a review mutation fails
- **THEN** the tests MUST verify that the current card remains active, mutation state resets, and the returned mutation error is deterministic

#### Scenario: Review session deletes cards through confirmation

- **WHEN** tests cancel, confirm, or fail delete confirmation flows
- **THEN** the tests MUST verify alert configuration, remove mutation payloads, removal of related card variants, index adjustment, completion behavior, and deterministic error reporting

#### Scenario: Review session syncs updated live cards

- **WHEN** live card data changes for a card already in the session
- **THEN** the tests MUST verify that the session updates changed card content or metadata without replacing equivalent cards unnecessarily

### Requirement: Review screens and routes must have targeted automated coverage

The codebase SHALL provide targeted automated coverage for review screens and routes where they own navigation, seed-store, disabled-action, loading, error, active, and completed-state orchestration.

#### Scenario: Review prep screen creates the correct session seed

- **WHEN** tests press start review, start all reviews, or disabled review actions
- **THEN** the tests MUST verify that the correct seed is stored, the correct callback is invoked, and disabled actions do not navigate or store a seed

#### Scenario: Review session screen renders session states and routes callbacks

- **WHEN** tests render loading, error, empty-close, active, and completed session states
- **THEN** the tests MUST verify the expected branch renders, close behavior, edit-card callback behavior, and grade/reveal/delete callback routing

#### Scenario: Review routes wire router actions to screens

- **WHEN** tests invoke review prep or review session route callbacks through mocked screens
- **THEN** the tests MUST verify that new-card, review-session, edit-card, close, and dismiss navigation actions use the expected router methods and params

### Requirement: Review seed store must have direct automated coverage

The codebase SHALL provide direct automated coverage for pending review-session seed storage.

#### Scenario: Pending review seed is consumed once

- **WHEN** tests set a pending review seed and consume it multiple times
- **THEN** the tests MUST verify that the first consume returns the seed and later consumes return `null`

### Requirement: Review test seams must stay narrowly scoped

Review feature tests SHALL extract only the smallest pure helper seam needed when stateful hooks, alerts, or focus effects block clear assertions.

#### Scenario: Pure helper extraction stays focused on review-owned decisions

- **WHEN** direct tests become awkward because sorting, filtering, card equivalence, session advancement, or delete planning is buried in side effects
- **THEN** the implementation MUST extract narrowly scoped pure helpers for that behavior rather than introduce broad services or rewrite unrelated query/model/store code

### Requirement: Review tests must follow the mirrored root test layout

Review tests SHALL live under the project-root `__tests__/` directory using mirrored relative paths for the covered source modules under `src/`.

#### Scenario: Review tests mirror their source module paths

- **WHEN** a test is added for a module under `src/features/cards/review/`
- **THEN** the test file MUST be placed in the corresponding mirrored path under `__tests__/features/cards/review/`
