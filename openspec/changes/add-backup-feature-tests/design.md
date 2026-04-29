## Context

The backup feature currently lives in two main layers:

- `src/features/cards/backup/model/card-backup.ts` for the runtime backup contract, validation, and card counting
- `src/features/cards/backup/hooks/use-card-backup-actions.ts` for export/import orchestration across Expo file APIs, native sharing, alerts, and the card store

That split is already directionally correct for testing. The pure model helper can be tested directly, while the hook owns the user-facing backup behavior that is most likely to regress when the flow changes. Adjacent cards-data coverage already exists for `planImportCards` and backup export ordering under `__tests__/features/cards/data/instant`, so this change should not duplicate those lower-level tests.

## Goals / Non-Goals

**Goals:**

- Add maintainable automated coverage for backup behavior owned by this app.
- Cover backup validation and imported card counting directly with plain inputs.
- Cover selected export/import hook orchestration with mocked native and store boundaries.
- Extract only a very small pure seam if it materially reduces brittle hook mocking.
- Keep backup tests under the root `__tests__/` tree with mirrored paths from `src/`.

**Non-Goals:**

- End-to-end device tests against real file pickers, share sheets, or InstantDB.
- Re-testing `planImportCards` or backup ordering logic that already has direct coverage elsewhere.
- A broad rewrite of the backup feature into service abstractions before adding tests.
- Adding or changing backup product behavior outside what is needed to support reliable tests.

## Decisions

### 1. Layer backup tests by behavior ownership

The highest-value coverage splits into:

- direct model tests for `card-backup.ts`
- targeted hook tests for `use-card-backup-actions.ts`

This is preferred over writing only hook tests because validation failures and count derivation are pure behavior with lower-maintenance direct tests. It is also preferred over writing only model tests because the user-facing regression risk sits in the import/export orchestration path.

Alternatives considered:

- Only add hook tests. Rejected because it would bury contract validation inside heavier mock setup.
- Only add model tests. Rejected because it would miss the export/import flow the user actually triggers from settings.

### 2. Reuse existing cards-data seams instead of duplicating InstantDB transaction tests

Existing tests already cover `planImportCards` and backup card-set mapping behavior in the cards data layer. The new backup proposal should therefore focus on backup-specific behavior rather than add broad `instant-card-store.ts` tests that mostly re-assert existing pure planning logic through heavier mocks.

Alternatives considered:

- Add direct `instant-card-store` import/export tests first. Rejected because most of the non-trivial behavior is already protected by `planImportCards` and `toCardBackupCardSet` tests, while the backup hook remains uncovered.

### 3. Extract only a narrow pure helper if the hook’s parsing branch becomes too brittle to test inline

The current hook already contains a reasonable imperative shell, so the default implementation path is to test it with mocked boundaries. If the import parsing branch becomes awkward to verify repeatedly, the implementation may extract only a very small pure helper such as:

- parsing JSON text into a validated backup result
- deriving import preview metadata such as card count from a validated backup
- deriving export file metadata such as the dated file name

This change should not introduce a generic backup service layer or broad dependency injection scaffolding.

Alternatives considered:

- Leave all logic inline regardless of test friction. Rejected because repeated mock-heavy assertions around parsing and validation would be brittle.
- Refactor the entire backup flow into pure services first. Rejected because that adds churn disproportionate to the testing goal.

### 4. Mock native and store boundaries at the feature edge

Hook tests should mock:

- `expo-file-system` file selection and file reads/writes
- `expo-sharing` availability and share calls
- `Alert.alert`
- `useDb()` / `cardStore` export and import calls

Tests should assert app-owned decisions and outcomes: loading-state reset, chosen error path, confirmation behavior, import payload, and success feedback.

Alternatives considered:

- Live integration tests against native APIs. Rejected because they would be slower, less deterministic, and outside the intended unit/feature scope.

### 5. Keep the mirrored root `__tests__` convention

Backup tests should live under the project-root `__tests__/` tree using mirrored relative paths from `src/`, such as:

- `src/features/cards/backup/model/card-backup.ts` → `__tests__/features/cards/backup/model/card-backup.test.ts`
- `src/features/cards/backup/hooks/use-card-backup-actions.ts` → `__tests__/features/cards/backup/hooks/use-card-backup-actions.test.ts`

Alternatives considered:

- Colocated tests beside source files. Rejected because it breaks the repository’s current mirrored test layout.

## Risks / Trade-offs

- [Hook tests become overly mock-driven] → Mitigation: keep assertions focused on app outcomes and extract only a tiny pure helper if repeated parsing branches are hard to express cleanly.
- [Refactoring for testability grows beyond the request] → Mitigation: allow helper extraction only where it unlocks multiple meaningful assertions and keep the write scope inside the backup feature.
- [Proposal accidentally duplicates existing cards-data coverage] → Mitigation: treat existing `instant-card-store-update-plan` and `instant-utils` tests as adjacent coverage and target only backup-specific gaps.
- [Documentation drift around backup shape causes ambiguous tests] → Mitigation: base tests on the runtime contract in `card-backup.ts`, not older design notes.

## Migration Plan

No runtime migration is required.

Implementation should proceed in small steps:

1. Add direct tests for `card-backup.ts` validation and count behavior.
2. Extract a tiny pure backup helper only if the hook tests reveal repeated parsing/export-metadata friction.
3. Add targeted hook tests for export and import orchestration with mocked boundaries.
4. Run the targeted backup tests plus formatter, lint, and typecheck before merging.

Rollback is straightforward: revert any helper extraction and associated tests if the change becomes too invasive.

## Open Questions

None.
