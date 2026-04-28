## Context

The cards data feature currently concentrates most non-UI behavior in `src/features/cards/data/instant/instant-card-store.ts`, with supporting pure helpers in `src/features/cards/data/instant/instant-utils.ts`, `src/features/cards/model/card.ts`, and `src/features/cards/model/review-scheduler.ts`. Some behavior is already easy to test directly, but other paths still mix decisions with side effects such as `db.getAuth()`, `db.queryOnce()`, `db.transact()`, `Date.now()`, and `id()`.

The goal of this change is to add unit coverage without turning tests into deep mocks of InstantDB, React hooks, or auth. The design therefore treats the data store as an imperative shell and moves behavior-heavy decisions into pure functions only where that boundary is currently missing.

## Goals / Non-Goals

**Goals:**

- Add maintainable unit coverage for cards data behavior that is independent of InstantDB and React runtime concerns.
- Cover the highest-value pure behaviors first: record normalization, tag parsing/deduplication, content-side mapping, review scheduling, and write planning for cards data mutations.
- Refactor store methods incrementally so tests can assert plain-data plans instead of InstantDB transaction objects.
- Keep test file placement consistent by storing cards data tests under a root-level `__tests__/` tree that mirrors the structure below `src/`.
- Keep Jest coverage collection scoped to application code so cards tests do not fail on tooling or skill files outside the app runtime.

**Non-Goals:**

- Full integration coverage for the InstantDB client, query hooks, or auth hooks.
- Rewriting the entire cards store into a new architecture in one pass.
- UI tests for edit, review, or backup screens.
- Adding new runtime dependencies for testing.

## Decisions

### 1. Prefer a functional-core / imperative-shell split for cards data behavior

`instant-card-store.ts` will remain responsible for reading auth state, loading current records, generating ids/timestamps, and calling `db.transact`. Behavior-heavy decisions will be expressed as pure functions that accept plain inputs and return deterministic plan objects or normalized domain data.

This is preferred over mocking `db.tx` chains directly because transaction-shape assertions are brittle and tightly coupled to InstantDB implementation details. Testing plain plan objects keeps the tests stable while still verifying the behavior that matters.

Alternatives considered:

- Test the store methods directly with a large mocked InstantDB surface. Rejected because the setup cost is high and the assertions would mostly mirror implementation details.
- Skip refactoring and only test existing pure helpers. Rejected because high-risk mutation paths such as add/import/update would remain effectively untested.

### 2. Add coverage in layers, starting with existing pure helpers and then extracting planners only where needed

The first layer of tests should target modules that are already pure or nearly pure:

- `card.ts` for tag normalization and canonical/visible content mapping
- `review-scheduler.ts` for scheduling transitions and edge conditions
- `instant-utils.ts` for timestamp conversion, record-to-domain mapping, validation failures, and backup export ordering

The second layer should target store mutation behavior by extracting planner functions where mixed logic still exists. `planUpdateCard` already demonstrates the desired seam. Similar seams should be introduced for add/import flows only when doing so removes meaningful side-effect coupling and unlocks straightforward tests. For this change, partial extraction around behaviors such as tag diffs, card ordering, and canonical field mapping is sufficient; full end-to-end planning extraction for every store mutation is explicitly out of scope.

Alternatives considered:

- Extract planners for every store method up front. Rejected because it increases churn before test needs are proven.
- Only test `planUpdateCard` and stop there. Rejected because import/export and add-card logic also contain important behavior worth protecting.

### 3. Keep test infrastructure focused on app code

Jest coverage collection should exclude `.agents` and `.codex` content because those directories may contain scripts or metadata that are not part of the app runtime and can break coverage instrumentation. This keeps cards data tests focused on the actual application code and avoids unrelated failures.

Alternatives considered:

- Run cards tests with coverage disabled by convention. Rejected because it relies on per-command discipline and does not solve default coverage runs.
- Broaden Babel/Jest transforms to accommodate all tool files. Rejected because it adds configuration complexity for non-product code.

### 4. Store tests in a root `__tests__` tree that mirrors `src`

Cards data tests should live under the project-root `__tests__/` directory, with subpaths that mirror the covered module paths beneath `src/`. For example, tests for `src/features/cards/model/card.ts` should be placed in a corresponding mirrored path under `__tests__/`.

This keeps production code and tests physically separated while preserving easy path discovery for related files. It is preferred over colocating tests next to source files because the requested convention is explicit and keeps the new test suite visually grouped in one tree.

Alternatives considered:

- Colocate `*.test.ts` files beside each source module. Rejected because it conflicts with the requested repo-level `__tests__/` layout.
- Place all cards data tests flat under a single `__tests__/cards/` folder. Rejected because it loses the source-tree mirroring that makes coverage ownership easier to navigate.

## Risks / Trade-offs

- [Over-extracting planners] → Mitigation: only extract pure planning helpers where they remove real side-effect coupling and directly enable tests.
- [Tests coupling to internal shapes] → Mitigation: assert domain-level plan objects and normalized outputs rather than raw `db.tx` chains.
- [Coverage remains uneven across the store] → Mitigation: prioritize the highest-risk mutation and mapping paths first, then expand coverage in later changes if needed.
- [Mirrored test paths drift from source paths] → Mitigation: create tests using a direct `__tests__/` mirror of `src` paths rather than ad hoc folder names.
- [Proposal drifts into architecture cleanup] → Mitigation: keep the refactor bounded to seams necessary for cards data tests and leave broader store redesign out of scope.

## Migration Plan

No runtime migration is required.

Implementation should proceed in small steps:

1. Add or refine pure helper boundaries in the cards data layer.
2. Add unit tests for the extracted helpers and existing pure modules under the mirrored root `__tests__/` tree.
3. Update Jest coverage configuration so normal coverage runs ignore non-app directories.
4. Run formatter, lint, typecheck, and targeted Jest tests before merging.

Rollback is straightforward: revert the extracted helper modules and associated tests if the approach proves too invasive.

## Open Questions

None.
