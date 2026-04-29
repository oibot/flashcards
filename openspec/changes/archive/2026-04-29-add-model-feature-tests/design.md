## Context

The card model already exposes mostly pure functions for card variants, content direction, tag parsing, card state parsing, and review scheduling. Existing tests cover some `card.ts` and `review-scheduler.ts` behavior, but `card-state.ts` has no direct tests and several scheduler and mapping branches remain uncovered.

## Goals / Non-Goals

**Goals:**

- Add focused unit coverage for pure card model behavior without rendering React components or creating data clients.
- Keep tests in the mirrored root `__tests__/features/cards/model/` layout.
- Preserve runtime behavior unless a test exposes an existing model defect.
- Extract pure helpers only if a meaningful model decision is not directly testable in its current shape.

**Non-Goals:**

- Redesign the spaced-repetition algorithm.
- Add review-session UI, persistence, or data-store coverage.
- Introduce new test libraries or third-party dependencies.
- Test type-only declarations in `review-session.ts` unless behavior is added during implementation.

## Decisions

- Prefer direct pure-function tests over refactoring. The current model functions already accept plain inputs and return plain outputs, so broad service extraction would add indirection without improving testability.
- Use explicit timestamps and schedule fixtures in scheduler tests. This keeps interval, due-date, ease-factor, repetition, lapse, and state expectations readable and deterministic.
- Add a dedicated `card-state` test file rather than folding state coverage into unrelated card tests. State parsing is a separate model contract and should fail locally when that contract changes.
- Keep any helper extraction narrow. If implementation finds behavior hidden behind side effects, extract only the decision logic needed for deterministic tests and leave storage, hooks, and screens out of scope.

## Risks / Trade-offs

- Scheduler tests can become brittle if they duplicate constants too aggressively -> assert observable outputs with small local time constants and avoid testing private helper names.
- Existing behavior might be revealed as inconsistent with the intended model contract -> update implementation and tests together rather than codifying accidental behavior.
- Adding more branch coverage can encourage testing implementation details -> keep assertions focused on public helper inputs and outputs.
