## 1. Confirm model test scope

- [x] 1.1 Review `src/features/cards/model/` and existing mirrored tests to confirm the remaining pure model branches that need coverage.
- [x] 1.2 Keep `review-session.ts` out of runtime tests unless implementation adds behavior beyond exported types.
- [x] 1.3 Identify whether any meaningful model decision is blocked behind side effects; skip refactoring if direct pure-function tests are sufficient.

## 2. Add card helper and state coverage

- [x] 2.1 Update `__tests__/features/cards/model/card.test.ts` to cover `isCardVariant`, forward and reverse content mapping, and tag normalization boundaries.
- [x] 2.2 Add `__tests__/features/cards/model/card-state.test.ts` covering `CARD_STATES`, `isCardState`, and `parseCardState` for valid, invalid, empty, and missing inputs.
- [x] 2.3 Refine model helpers only if tests expose a behavior bug or an avoidable testability issue.

## 3. Expand scheduler coverage

- [x] 3.1 Update `__tests__/features/cards/model/review-scheduler.test.ts` to cover first-review `again`, `hard`, and `good` scheduling from an initial card.
- [x] 3.2 Add reviewed-card scheduler cases for `hard` and `good` interval growth, due-date calculation, repetition increment, state selection, and ease-factor behavior.
- [x] 3.3 Strengthen `again` coverage for reviewed cards, including retry timing, lapse increment, relearning state, repetition reset, and minimum ease-factor clamping.

## 4. Verify model tests

- [x] 4.1 Run the targeted model test files and fix any assertion or coverage gaps.
- [x] 4.2 Run `bun format`, `bunx expo lint`, and `bunx tsc --noEmit` after the model test changes are complete.
- [x] 4.3 Run the full relevant Jest command if targeted test execution leaves uncertainty about shared setup or adjacent model behavior.
