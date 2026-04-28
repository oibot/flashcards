## Why

The cards data layer contains meaningful logic around record mapping, tag normalization, import/export shaping, and write planning, but it currently has no automated unit coverage. That makes refactors riskier and slows down changes to the cards feature because behavior regressions are caught late, if at all.

## What Changes

- Add unit tests for the cards data feature, starting with the pure transformation and planning logic that can be exercised without InstantDB or React hooks.
- Place the new tests under a root-level `__tests__/` directory whose internal structure mirrors the relevant paths under `src/`.
- Refactor mixed logic in the cards data store where needed so behavior decisions can be tested separately from InstantDB reads, writes, auth, and time/id side effects.
- Define a clear boundary between pure cards data functions and imperative store code so future tests can target stable seams instead of mocking the full data stack.
- Keep the scope focused on data behavior and testability; thin query hooks and unrelated UI flows remain out of scope unless a small change is required to support the new boundaries.

## Capabilities

### New Capabilities

- `cards-data-unit-tests`: Adds maintainable unit coverage for cards data behavior, including pure mapping, normalization, scheduling-related write planning, and import/update logic that can be isolated from side effects.

### Modified Capabilities

- None.

## Impact

- Affected code: `src/features/cards/data/instant/*`, `src/features/cards/model/*`, root `__tests__/` mirrors for covered modules, and supporting Jest configuration.
- Affected systems: cards data read/write logic, local test infrastructure, and future refactors touching card import, editing, and review state updates.
- Dependencies: existing Jest/Expo test tooling; no new runtime dependency is required.
