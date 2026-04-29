## ADDED Requirements

### Requirement: Backup model helpers must have direct automated coverage

The codebase SHALL provide direct unit coverage for backup model helpers that validate the backup envelope and derive imported card counts from plain inputs.

#### Scenario: Backup validation accepts the current runtime contract

- **WHEN** tests provide a backup object with the current `app`, `exportedAt`, and `cardSets` fields plus valid card-set and card records
- **THEN** the validation helper MUST return a valid backup result without rendering hooks or creating a database client

#### Scenario: Backup validation rejects malformed backup content

- **WHEN** tests provide invalid root objects, wrong `app` values, invalid `exportedAt` values, missing `cardSets`, or invalid card-set/card records
- **THEN** the validation helper MUST return deterministic validation failures for the corresponding invalid input

#### Scenario: Backup card counting derives the import confirmation count

- **WHEN** tests provide a backup envelope with multiple card sets and cards
- **THEN** the card-count helper MUST return the total number of cards across all card sets

### Requirement: Backup action orchestration must have application-level coverage

The codebase SHALL provide automated coverage for the backup action hook behavior that coordinates native file APIs, confirmation UI, and card-store import/export calls.

#### Scenario: Export flow shares a dated JSON backup when available

- **WHEN** the backup action hook exports cards successfully and native sharing is available
- **THEN** the tests MUST verify that the hook requests the backup from the card store, writes a JSON file with the exported date in the file name, and invokes the share flow

#### Scenario: Export flow reports app-owned failures without leaving stale loading state

- **WHEN** the export path encounters unsupported sharing or a thrown export error
- **THEN** the tests MUST verify that the hook surfaces the expected error alert and resets its exporting state

#### Scenario: Import flow ignores cancellation and rejects invalid backup content

- **WHEN** the import path is cancelled by the picker, receives malformed JSON, or receives parsed data that fails backup validation
- **THEN** the tests MUST verify that cancellation exits quietly, invalid content surfaces the expected error, and no import write is attempted

#### Scenario: Import flow can be declined after validation

- **WHEN** the import path receives a valid backup and the user cancels or dismisses the confirmation alert
- **THEN** the tests MUST verify that no import write occurs and the hook resets importing state without a success alert

#### Scenario: Import flow confirms and imports valid backup data

- **WHEN** the import path receives a valid backup, the user confirms the import, and the card store accepts the data
- **THEN** the tests MUST verify the confirmation count, imported backup payload, success alert, and loading-state reset

### Requirement: Backup test seams must stay narrowly scoped to app-owned logic

The backup feature SHALL extract only the smallest pure helper seam needed when inline side-effect code blocks direct coverage of parsing or export metadata behavior.

#### Scenario: Pure seam extraction stays focused on backup preparation behavior

- **WHEN** hook-level tests become awkward because JSON parsing, backup validation, count derivation, or export metadata logic is buried in native side effects
- **THEN** the implementation MUST extract a narrowly scoped pure helper for that behavior rather than introduce a broad service abstraction or rewrite unrelated card-store code

### Requirement: Backup tests must follow the mirrored root test layout

Backup tests SHALL live under the project-root `__tests__/` directory using mirrored relative paths for the covered source modules under `src/`.

#### Scenario: Backup tests mirror their source module paths

- **WHEN** a test is added for a backup module under `src/features/cards/backup/`
- **THEN** the test file MUST be placed in the corresponding mirrored path under `__tests__/`
