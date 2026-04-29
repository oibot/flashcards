## Why

The backup feature crosses pure validation, native file APIs, confirmation UI, and card-store orchestration, but it currently has no focused automated coverage. Existing cards-data tests already cover backup ordering and import planning seams, so the remaining risk is concentrated in backup-specific validation and the user-facing import/export flow.

## What Changes

- Add focused tests for backup model helpers, covering backup envelope validation and imported card counting with plain inputs.
- Add targeted tests for the backup action hook, covering export success/error handling and import cancel/invalid/confirmed-success flows.
- Keep backup tests scoped to app-owned behavior rather than retesting Expo file APIs, native sharing internals, or InstantDB itself.
- Extract or refine only the smallest pure helper needed if import parsing or export metadata logic is too side-effect-heavy to test cleanly inside the hook.
- Store new backup tests under the project-root `__tests__/` tree, mirroring the relevant paths under `src/`.

## Capabilities

### New Capabilities

- `backup-feature-tests`: Adds maintainable automated coverage for backup validation and backup import/export orchestration.

### Modified Capabilities

- None.

## Impact

- Affected code: `src/features/cards/backup/**/*` and mirrored root `__tests__/features/cards/backup/**/*`.
- Affected systems: backup JSON validation, export file naming/sharing flow, import file parsing, confirmation handling, and user-facing success/error alerts.
- Dependencies: existing Jest/Expo test tooling; no new runtime dependency is required.
