## ADDED Requirements

### Requirement: Card model helpers must have direct automated coverage

The codebase SHALL provide direct unit coverage for card model helpers that validate variants, map canonical and visible card content, or normalize tag input.

#### Scenario: Card variant guards accept only supported directions

- **WHEN** tests exercise the card variant guard with forward, reverse, empty, unknown, and non-string values
- **THEN** the tests MUST verify that only the supported card variants are accepted

#### Scenario: Content mapping preserves forward and reverse directions

- **WHEN** tests convert canonical card content to visible content and visible card content back to canonical content for both forward and reverse cards
- **THEN** the tests MUST verify that side A and side B are preserved in the expected visible or canonical positions

#### Scenario: Tag parsing normalizes user-provided tags

- **WHEN** tests parse array or comma-delimited tag input with mixed case, repeated whitespace, duplicates, and empty values
- **THEN** the tests MUST verify normalized title casing, deduplication, and empty-value filtering

### Requirement: Card state helpers must have direct automated coverage

The codebase SHALL provide direct unit coverage for card state validation and parsing behavior.

#### Scenario: Card state validation recognizes the supported state set

- **WHEN** tests exercise state validation with every supported card state and invalid values
- **THEN** the tests MUST verify that only values from the exported card state set are accepted

#### Scenario: Card state parsing returns deterministic optional results

- **WHEN** tests parse missing, empty, valid, or invalid state strings
- **THEN** the tests MUST verify that valid states are returned and missing or invalid states return `undefined`

### Requirement: Review scheduler model must have direct automated coverage

The codebase SHALL provide direct unit coverage for review scheduling decisions that affect due dates, review history, interval growth, ease factors, lapses, and card states.

#### Scenario: Initial schedules start as due new cards

- **WHEN** tests create an initial schedule at a fixed timestamp
- **THEN** the tests MUST verify that the card is due immediately with no review history, default ease, zero interval, zero repetitions, zero lapses, and the new state

#### Scenario: New cards transition according to the first review grade

- **WHEN** tests schedule a new card with `again`, `hard`, or `good`
- **THEN** the tests MUST verify the expected short retry, learning interval, review interval, repetition count, lapse count, ease factor, and resulting card state

#### Scenario: Reviewed cards grow intervals according to grade

- **WHEN** tests schedule a previously reviewed card with `hard` or `good`
- **THEN** the tests MUST verify interval growth, due date calculation, repetition increment, lapse preservation, state selection, and ease-factor adjustment

#### Scenario: Again reviews reset repetition and track lapses safely

- **WHEN** tests schedule `again` for a reviewed card at or near the minimum ease factor
- **THEN** the tests MUST verify retry timing, repetition reset, lapse increment, relearning state, and minimum ease-factor clamping

### Requirement: Model tests must stay pure and mirrored

Model feature tests SHALL execute against plain model inputs and outputs and SHALL use the project-root mirrored test layout.

#### Scenario: Model tests avoid side-effect infrastructure

- **WHEN** tests are added for modules under `src/features/cards/model/`
- **THEN** the tests MUST avoid rendering React components, creating database clients, invoking native APIs, or depending on auth state

#### Scenario: Model tests mirror their source module paths

- **WHEN** a model test is added for a module under `src/features/cards/model/`
- **THEN** the test file MUST be placed in the corresponding mirrored path under `__tests__/features/cards/model/`
