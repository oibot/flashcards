## ADDED Requirements

### Requirement: Card query hooks must have direct automated coverage

The codebase SHALL provide direct automated coverage for cards query hooks that expose card-store query state and actions to UI code.

#### Scenario: Cards list hook forwards query state and actions

- **WHEN** tests exercise the cards list hook with card-store cards, loading state, error state, and action functions
- **THEN** the tests MUST verify that the hook returns the same cards, loading state, error, add action, remove action, and review action

#### Scenario: Single-card hook resolves cards by id

- **WHEN** tests exercise the single-card hook with a matching id, a missing id, null id, and undefined id
- **THEN** the tests MUST verify that the matching card is returned when present and `null` is returned when no card should be selected

#### Scenario: Single-card hook forwards update and query state

- **WHEN** tests exercise the single-card hook with loading state, error state, and an update action from the card store
- **THEN** the tests MUST verify that the hook returns the same loading state, error, and update action

### Requirement: Due-card query timing must stay caller-controlled

The codebase SHALL keep navigation focus lifecycle out of the due-card query hook and SHALL provide deterministic automated coverage for caller-controlled due-card timestamps.

#### Scenario: Due cards use a caller-provided timestamp

- **WHEN** tests exercise the due-card hook with a caller-provided `now` value and then rerender with a different `now` value
- **THEN** the tests MUST verify that the due-card store query is called with the current caller-provided value

#### Scenario: Due-card hook stays routing agnostic

- **WHEN** tests are added for the due-card query hook
- **THEN** the tests MUST NOT need to mock Expo Router focus lifecycle or navigation context

#### Scenario: Due-card hook forwards query state and actions

- **WHEN** tests exercise the due-card hook with due-card query state and card-store actions
- **THEN** the tests MUST verify that the hook returns the same cards, loading state, error, remove action, and review action

### Requirement: Tag query hook must have direct automated coverage

The codebase SHALL provide direct automated coverage for tag query behavior exposed by the query feature.

#### Scenario: Tags hook forwards query state

- **WHEN** tests exercise the tags hook with card-store tags, loading state, and error state
- **THEN** the tests MUST verify that the hook returns the same tags, loading state, and error

### Requirement: Query tests must stay scoped and mirrored

Query feature tests SHALL stay focused on query-hook behavior and SHALL use the project-root mirrored test layout.

#### Scenario: Query tests avoid persistence and screen infrastructure

- **WHEN** tests are added for modules under `src/features/cards/queries/`
- **THEN** the tests MUST avoid creating a real database client, rendering screens, invoking native APIs, mocking routing lifecycle, or depending on auth state

#### Scenario: Query tests mirror their source module paths

- **WHEN** a query test is added for a module under `src/features/cards/queries/`
- **THEN** the test file MUST be placed in the corresponding mirrored path under `__tests__/features/cards/queries/`
