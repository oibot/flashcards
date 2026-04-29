## 1. Prepare backup test seams

- [ ] 1.1 Review the backup model and backup action hook alongside existing cards-data backup tests to confirm which backup-specific behaviors still need direct coverage.
- [ ] 1.2 Extract or refine only the smallest pure backup helper needed if parsing, count derivation, or export metadata logic is too awkward to test inside the hook.
- [ ] 1.3 Keep Expo file APIs, native sharing internals, and InstantDB internals mocked at the feature edge rather than expanding the test scope into end-to-end behavior.

## 2. Add direct backup model coverage

- [ ] 2.1 Create the mirrored root `__tests__/features/cards/backup` directory structure for the backup modules covered by this change.
- [ ] 2.2 Add tests for `src/features/cards/backup/model/card-backup.ts` covering valid envelopes, invalid contract branches, and total imported card counting.
- [ ] 2.3 If a pure helper is extracted for import preparation or export metadata, add direct tests for that helper with plain inputs and outputs.

## 3. Add backup action hook coverage

- [ ] 3.1 Add targeted tests for `src/features/cards/backup/hooks/use-card-backup-actions.ts` covering successful export, sharing-unavailable handling, and export failure alerts.
- [ ] 3.2 Add targeted tests for `src/features/cards/backup/hooks/use-card-backup-actions.ts` covering file-picker cancellation, malformed JSON, validation failure, declined confirmation, and confirmed import success.
- [ ] 3.3 Refine the hook implementation only as needed to keep import/export assertions deterministic without changing backup product behavior.

## 4. Verify the backup test setup

- [ ] 4.1 Reuse the existing Jest setup and add only the mocks or helpers needed for backup feature tests.
- [ ] 4.2 Run the targeted backup tests and fix any gaps in helper extraction, mocks, or assertions.
- [ ] 4.3 Run `bun format`, `bunx expo lint`, and `bunx tsc --noEmit` after the backup test changes are complete.
