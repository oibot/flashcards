## Why

The cards query hooks are the application-facing read layer between UI code and the card store, but they currently have no direct automated coverage. Adding focused tests will lock down the query contracts for card lookup, list forwarding, due-card timing, and tag query state before additional screens rely on them.

## What Changes

- Add direct tests for `useCard`, `useCards`, `useDueCards`, and `useTags`.
- Verify that query hooks forward loading, error, data, and mutation/action functions from the card store.
- Cover `useCard` lookup behavior for valid, missing, null, and undefined card ids.
- Cover `useDueCards` caller-controlled due timestamp behavior without depending on real time.
- Keep navigation focus refresh behavior outside the query layer.
- Extract narrowly scoped pure helpers only if hook side effects make meaningful behavior awkward to test; avoid broad query-service abstractions.

## Capabilities

### New Capabilities

- `queries-feature-tests`: Automated coverage for cards query hooks and any narrowly extracted query helper behavior.

### Modified Capabilities

- None.

## Impact

- Affected source: `src/features/cards/queries/`.
- Affected tests: `__tests__/features/cards/queries/`.
- Test setup may mock `useDb` and current time at caller-owned boundaries when needed.
- APIs and runtime behavior should remain unchanged unless tests expose an existing query bug.
- No new third-party dependencies are expected.
