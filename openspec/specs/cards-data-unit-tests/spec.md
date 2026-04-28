## ADDED Requirements

### Requirement: Cards data pure helpers must have direct unit coverage

The codebase SHALL provide direct unit coverage for cards data helper behavior that can be executed without InstantDB, React hooks, or auth state.

#### Scenario: Tag normalization and content mapping are verified as pure behavior

- **WHEN** cards data tests exercise helpers such as tag parsing or canonical/visible card content conversion
- **THEN** the tests MUST run against plain inputs and outputs without creating a database client or rendering hooks

#### Scenario: Record mapping failures are verified as data validation behavior

- **WHEN** cards data tests exercise record-to-domain mapping helpers with invalid card state, invalid variant, or missing related card-set data
- **THEN** the tests MUST verify that the helpers reject invalid inputs with deterministic failures

#### Scenario: Tests mirror the source tree from a root test directory

- **WHEN** a cards data helper test is added for a module under `src/`
- **THEN** the test file MUST live under the project-root `__tests__/` directory using a mirrored relative path for the covered source module

### Requirement: Cards data mutations must expose testable planning seams

Cards data mutation logic SHALL separate behavior decisions from InstantDB side effects whenever the mutation contains non-trivial mapping, normalization, or diffing logic.

#### Scenario: Update planning is validated without InstantDB transactions

- **WHEN** the update-card flow computes canonical side content, TTS locale updates, or tag link/unlink changes
- **THEN** that behavior MUST be testable through a pure planning function that accepts plain inputs and returns deterministic plan data before any `db.transact` call occurs

#### Scenario: Additional mutation seams are extracted only where they unlock meaningful tests

- **WHEN** add-card or import-card logic contains behavior that is not practically testable through existing pure helpers
- **THEN** the implementation MUST extract the smallest additional pure planning seam needed to unit test that behavior without mocking the full InstantDB client

### Requirement: Cards data test runs must stay scoped to application code

The cards data test setup SHALL avoid collecting coverage from non-application support directories that are outside the app runtime.

#### Scenario: Coverage collection ignores agent and OpenSpec support files

- **WHEN** Jest runs with coverage collection enabled for cards data tests
- **THEN** files under `.agents` and `.codex` MUST be excluded from coverage collection so unrelated tooling files do not break the test run
