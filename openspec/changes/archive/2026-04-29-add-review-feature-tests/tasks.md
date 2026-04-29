## 1. Prepare review test seams

- [x] 1.1 Review review hooks, screens, routes, components, and seed-store modules to confirm the smallest set of review-owned behaviors needing direct coverage.
- [x] 1.2 Create the mirrored root `__tests__/features/cards/review/` directory structure for review feature tests.
- [x] 1.3 Extract narrow pure helpers only if due-card selection, card equivalence, session advancement, or delete planning is too awkward to test through existing hooks.

## 2. Add review preparation coverage

- [x] 2.1 Add tests for `src/features/cards/review/hooks/use-review-prep-cards.ts` covering due/all card derivation, due-date ordering, counts, loading/error state, preparation kind updates, and focus-time refresh.
- [x] 2.2 If review prep sorting/filtering helpers are extracted, add direct tests for them with plain card inputs and controlled timestamps.
- [x] 2.3 Keep `useCards` and Expo Router focus lifecycle mocked at the review feature boundary for hook tests.

## 3. Add review session hook and seed-store coverage

- [x] 3.1 Add tests for `src/features/cards/review/hooks/use-review-session.ts` covering seeded and live-card initialization, loading/error state, empty-session close behavior, reveal/show-front transitions, progress labels, and live-card synchronization.
- [x] 3.2 Add tests for review grading covering mutation payloads, advancement, completion, reviewed count, mutation-state guards, and review mutation failures.
- [x] 3.3 Add tests for review deletion covering confirmation, cancellation, successful deletion, related-card removal by card set, index adjustment, completion, mutation-state guards, and delete mutation failures.
- [x] 3.4 Add tests for `src/features/cards/review/lib/review-session-seed-store.ts` covering set and consume-once behavior.

## 4. Add review screen and route coverage

- [x] 4.1 Add targeted tests for `src/features/cards/review/screens/review-prep-screen.tsx` covering loading, error, empty, due review, all review, disabled actions, seed storage, and callback behavior.
- [x] 4.2 Add targeted tests for `src/features/cards/review/screens/review-session-screen.tsx` covering loading, error, should-close, active, completed, reveal, grade, delete, close, and edit-card orchestration with child components mocked as needed.
- [x] 4.3 Add route tests for `src/features/cards/review/routes/review-prep-route.tsx` and `src/features/cards/review/routes/review-session-route.tsx` covering router push, dismiss, and edit-card params.

## 5. Verify review tests

- [x] 5.1 Run the targeted review test files and fix any gaps in mocks, helper extraction, or assertions.
- [x] 5.2 Run `bun format`, `bunx expo lint`, and `bunx tsc --noEmit` after the review test changes are complete.
- [x] 5.3 Run the broader relevant Jest command if targeted review test execution leaves uncertainty about shared screen or hook setup.
