## Context

The review feature currently has no mirrored tests, despite owning the study flow across `useReviewPrepCards`, `useReviewSession`, review screens, routes, components, and the pending review-session seed store. Much of the feature combines pure decisions, such as due-card ordering or session advancement, with side effects such as navigation focus, alerts, store mutations, and route transitions.

## Goals / Non-Goals

**Goals:**

- Add direct coverage for review preparation, review session state, seed-store behavior, and route/screen orchestration.
- Keep tests under the mirrored root `__tests__/features/cards/review/` layout.
- Mock external boundaries such as `useCards`, Expo Router, translations, alerts, and audio where review code only coordinates them.
- Extract narrow pure helpers only where doing so makes review prep or review session transitions easier to test and reason about.
- Preserve runtime behavior unless tests expose an existing review bug.

**Non-Goals:**

- Test InstantDB, query hook internals, or spaced-repetition scheduling internals.
- Add end-to-end navigation tests across the whole app.
- Redesign review UI or introduce new review product behavior.
- Introduce new test libraries or third-party dependencies.

## Decisions

- Prefer direct hook tests for `useReviewPrepCards` and `useReviewSession`, with mocked `useCards` and controlled time. These hooks own the highest-value behavior and can be tested without rendering full screens.
- Extract pure review prep helpers if sorting/filtering logic becomes noisy inside focus-effect hook tests. Candidate behavior includes sorting by `dueAt`, deriving due cards at a timestamp, and selecting `due` vs `all` review cards.
- Extract pure session transition helpers if grading or delete tests require too much state setup. Candidate behavior includes choosing the next index, marking completion, resetting visible side, and removing all variants that share a `cardSetId`.
- Keep screen tests targeted. Screens should verify loading/error/active/completed branches, seed creation/consumption, disabled action guards, and callback routing, while child components and native details can be mocked.
- Keep route tests shallow. Routes should verify router actions are wired to screen callbacks, not duplicate screen behavior.

## Risks / Trade-offs

- Hook tests can become brittle if they assert every intermediate state -> focus assertions on public hook outputs and user-visible transitions.
- Screen tests can become expensive if too many child components render real rich/audio UI -> mock child components where the screen only passes callbacks and state.
- Pure helper extraction can spread behavior across too many files -> extract only decision logic that materially simplifies tests or clarifies side-effect boundaries.
