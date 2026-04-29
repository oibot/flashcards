## 1. Prepare query test setup

- [x] 1.1 Review the query hooks and existing hook-test patterns to confirm the card-store mocks needed for deterministic tests.
- [x] 1.2 Create the mirrored root `__tests__/features/cards/queries/` directory structure for query feature tests.
- [x] 1.3 Extract a narrow pure helper only if direct hook tests make card selection or due-time behavior unnecessarily awkward.

## 2. Add cards query hook coverage

- [x] 2.1 Add tests for `src/features/cards/queries/use-cards.ts` covering returned cards, loading state, error state, and forwarded add, remove, and review actions.
- [x] 2.2 Add tests for `src/features/cards/queries/use-card.ts` covering matching id, missing id, null id, undefined id, loading state, error state, and forwarded update action.
- [x] 2.3 Keep card-store behavior mocked at the `useDb` boundary rather than creating a real database client.

## 3. Add due-card and tags query coverage

- [x] 3.1 Add tests for `src/features/cards/queries/use-due-cards.ts` covering caller-provided `now`, rerendered timestamp changes, loading/error state, and forwarded remove/review actions.
- [x] 3.2 Add tests for `src/features/cards/queries/use-tags.ts` covering returned tags, loading state, and error state.
- [x] 3.3 Keep Expo Router focus behavior out of the query hook and query tests rather than relying on real navigation.

## 4. Verify query tests

- [x] 4.1 Run the targeted query test files and fix any gaps in mocks, helper extraction, or assertions.
- [x] 4.2 Run `bun format`, `bunx expo lint`, and `bunx tsc --noEmit` after the query test changes are complete.
- [x] 4.3 Run the broader relevant Jest command if targeted query test execution leaves uncertainty about shared hook setup.
