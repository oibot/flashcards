## 1. Prepare testable seams

- [x] 1.1 Review `src/features/cards/data/instant/instant-card-store.ts` and identify mutation paths whose behavior is still mixed with InstantDB side effects.
- [x] 1.2 Extract or refine the smallest pure planning helpers needed to test add-card, update-card, or import-card behavior without mocking `db.transact`.
- [x] 1.3 Keep the cards data store as the imperative shell that owns auth access, record loading, id/time generation, and InstantDB transaction execution.

## 2. Add cards data unit coverage

- [x] 2.1 Create the mirrored root `__tests__/` directory structure for the cards data modules covered by this change.
- [x] 2.2 Add unit tests for existing pure cards helpers in `src/features/cards/model/card.ts` covering tag normalization, deduplication, and canonical/visible content mapping.
- [x] 2.3 Add unit tests for `src/features/cards/model/review-scheduler.ts` covering initial scheduling, again/hard/good review transitions, and minimum ease-factor behavior.
- [x] 2.4 Add unit tests for `src/features/cards/data/instant/instant-utils.ts` covering timestamp normalization, card mapping, validation failures, and backup card ordering.
- [x] 2.5 Add unit tests for extracted planner helpers covering deterministic write-planning behavior such as tag diffs, reverse-card content mapping, TTS locale mapping, and import/update plan shaping.

## 3. Stabilize test execution

- [x] 3.1 Update Jest coverage collection so `.agents` and `.codex` files are excluded from cards data coverage runs.
- [x] 3.2 Run the targeted cards data tests and fix any gaps in the extracted seams or assertions.
- [x] 3.3 Run `bun format`, `bunx expo lint`, and `bunx tsc --noEmit` after the test changes are complete.
