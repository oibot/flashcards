## Why

The card model owns core behavior for content direction, tag normalization, card state parsing, and review scheduling, but current unit coverage exercises only a subset of those branches. Adding focused model tests now will lock down pure domain behavior before more screens, data flows, or review UX changes depend on it.

## What Changes

- Add direct tests for card model helpers, including card variant guards, forward and reverse content mapping, and tag normalization edge cases.
- Add direct tests for card state validation and parsing.
- Expand review scheduler tests to cover new-card `again`, reviewed-card interval growth, lapse/relearning behavior, and ease-factor clamp boundaries.
- Keep tests under the mirrored root `__tests__/features/cards/model/` layout.
- Extract narrowly scoped pure helpers only if meaningful model behavior is blocked behind side effects; avoid broad service abstractions or unrelated rewrites.

## Capabilities

### New Capabilities

- `model-feature-tests`: Automated coverage for pure card model behavior and review scheduling decisions.

### Modified Capabilities

- None.

## Impact

- Affected source: `src/features/cards/model/`.
- Affected tests: `__tests__/features/cards/model/`.
- APIs and runtime behavior should remain unchanged unless a test exposes an existing model bug.
- No new third-party dependencies are expected.
