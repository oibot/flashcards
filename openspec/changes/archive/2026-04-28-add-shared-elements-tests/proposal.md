## Why

Shared code is reused across multiple features, so regressions there have a wider blast radius than feature-local bugs. The current `src/shared` area has several app-owned utilities and UI behaviors with no direct automated coverage, which makes refactors to HTML parsing, API request handling, font mapping, and shared tag input behavior riskier than they need to be.

## What Changes

- Add focused tests for behavior-heavy shared modules rather than treating all of `src/shared` as one blanket test target.
- Cover shared HTML parsing and normalization helpers, shared server request helpers, shared font-weight mapping, and selected `TagInput` behaviors.
- Keep low-value shared wrappers and configuration modules out of scope unless implementation reveals a specific regression-prone seam that belongs to the app.
- Store shared tests under the project-root `__tests__/` tree, mirroring the relevant paths under `src/`.

## Capabilities

### New Capabilities

- `shared-elements-tests`: Adds maintainable automated coverage for app-owned shared utilities and shared UI behavior with meaningful logic.

### Modified Capabilities

- None.

## Impact

- Affected code: `src/shared/lib/**/*`, `src/shared/server/**/*`, selected modules under `src/shared/ui/**/*`, and mirrored root `__tests__/shared/**/*`.
- Affected systems: HTML parsing and comparison behavior, server request validation/auth helpers, typography mapping, and shared tag entry behavior used by card editing flows.
- Dependencies: existing Jest/Expo test tooling; no new runtime dependency is required.
