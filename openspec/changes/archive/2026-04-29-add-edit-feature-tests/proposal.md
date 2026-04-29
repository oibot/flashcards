## Why

The edit feature coordinates rich-text editors, tag state, audio draft selection, and save/discard flows across several hooks and screens, but it currently has no focused automated coverage. That makes regressions in card creation, card updates, and language-selection behavior more likely to be caught only through manual modal testing.

## What Changes

- Add focused tests for edit feature hooks and screens, covering form hydration, dirty-state detection, draft creation, tag normalization, and selected route/screen orchestration behavior.
- Add targeted tests for the language-selection flow that controls edit-side audio locale selection, deletion confirmation, and create-audio intent.
- Keep edit tests scoped to app-owned behavior rather than retesting `react-native-enriched`, Expo Router, keyboard-controller internals, or the audio subsystem itself.
- Extract or refine only the smallest pure helpers needed where editor refs, router params, or save-flow branching are too side-effect-heavy to test cleanly inline.
- Store new edit tests under the project-root `__tests__/` tree, mirroring the relevant paths under `src/`.

## Capabilities

### New Capabilities

- `edit-feature-tests`: Adds maintainable automated coverage for edit feature form state, save/discard orchestration, and language-selection behavior.

### Modified Capabilities

- None.

## Impact

- Affected code: `src/features/cards/edit/**/*`, and selected adjacent edit-owned flows such as `src/features/cards/audio/lib/audio-selection-draft.ts` integration points only when exercised through edit behavior.
- Affected systems: new-card and edit-card save flows, draft hydration and dirty-state logic, tag selection behavior, route-level loading/error handling, and edit-side TTS language selection.
- Dependencies: existing Jest/Expo test tooling; no new runtime dependency is required.
