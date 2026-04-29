## Context

The query feature currently contains thin React hooks over the card-store boundary: `useCard`, `useCards`, `useDueCards`, and `useTags`. They select data from store query hooks, expose loading/error state, and forward relevant mutation actions. Due-card freshness is a caller-owned concern because focus lifecycle belongs to routes or UI hooks, not the query layer.

## Goals / Non-Goals

**Goals:**

- Add direct hook tests for the cards query feature without creating a real database client.
- Verify the public hook contracts for returned data, loading/error state, and forwarded store actions.
- Make `useDueCards` timing behavior deterministic by requiring a caller-provided timestamp.
- Keep Expo Router focus lifecycle out of query hooks and query tests.
- Keep tests in the mirrored root `__tests__/features/cards/queries/` layout.
- Extract a pure helper only if it reduces awkward side-effect testing for card selection or due-time selection.

**Non-Goals:**

- Test InstantDB query implementation details.
- Add end-to-end data loading tests across screens and persistence.
- Redesign the card-store interface.
- Introduce new test libraries or third-party dependencies.

## Decisions

- Mock `useDb` at the query-feature boundary. The hooks are responsible for selecting and forwarding card-store outputs, not validating the store internals.
- Use `renderHook` for direct hook coverage. This matches existing hook tests and keeps assertions close to the query contracts.
- Keep focus refresh in callers instead of `useDueCards`. Tests for `useDueCards` should only assert that the caller-provided timestamp is forwarded to `useDueCardsQuery`.
- Prefer no refactor initially. The hooks are already small; extracting helpers should be limited to plain behavior such as selecting a card by id if direct hook tests become noisy.

## Risks / Trade-offs

- Moving focus refresh to callers means future consumers must pass a fresh timestamp explicitly -> type the `now` parameter as required so missing timestamp ownership is caught during implementation.
- Store-boundary mocks can miss integration defects in InstantDB queries -> keep this change scoped to query-hook contracts and rely on cards-data tests for store behavior.
- Over-extracting pure helpers could make simple hooks harder to read -> extract only if it materially simplifies deterministic tests.
