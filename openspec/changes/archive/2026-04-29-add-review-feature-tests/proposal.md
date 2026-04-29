## Why

The review feature owns the main study flow: preparing due cards, starting sessions, revealing answers, grading cards, deleting cards, and completing sessions. It currently has no direct review-feature tests, so regressions in review state transitions or route/screen orchestration can slip through despite model and query coverage.

## What Changes

- Add direct tests for review preparation behavior, including due/all card selection, due-date sorting, focus-time refresh, loading/error state, and review-session seed creation.
- Add direct tests for review session behavior, including initialization, reveal/show-front actions, grade success and failure, completion, delete confirmation, delete failure, live-card synchronization, and empty-session close behavior.
- Add targeted screen/route tests for review prep and review session orchestration where they own navigation, seed-store, loading/error, and completed/active state rendering.
- Add direct tests for the review-session seed store.
- Extract narrowly scoped pure helpers for review prep selection or review session state transitions if direct hook tests become too stateful or side-effect-heavy.

## Capabilities

### New Capabilities

- `review-feature-tests`: Automated coverage for review preparation, review session state, review routes/screens, and review-owned helper behavior.

### Modified Capabilities

- None.

## Impact

- Affected source: `src/features/cards/review/` and, only if justified, adjacent pure model/helper modules.
- Affected tests: `__tests__/features/cards/review/`.
- Test setup may mock `useCards`, Expo Router navigation/focus lifecycle, translations, alerts, audio, and seed-store boundaries.
- APIs and runtime behavior should remain unchanged unless tests expose an existing review bug.
- No new third-party dependencies are expected.
