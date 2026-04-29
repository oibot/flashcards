## Why

The audio feature has enough behavior-heavy logic that regressions are likely to be expensive to catch manually. TTS text normalization, audio draft state transitions, cache resolution, locale/config handling, and hook-level orchestration currently have no focused automated coverage, which makes future refactors riskier than they need to be.

## What Changes

- Add focused tests for the audio feature, covering app-owned model logic, draft state behavior, TTS server resolution flows, and selected hook orchestration behavior.
- Keep audio tests scoped to behavior owned by this codebase rather than retesting Expo Audio, Instant storage, or ElevenLabs themselves.
- Extract or refine only the smallest pure helpers needed where audio hooks or server flows are too side-effect-heavy to test cleanly.
- Store new audio tests under the project-root `__tests__/` tree, mirroring the relevant paths under `src/`.

## Capabilities

### New Capabilities

- `audio-feature-tests`: Adds maintainable automated coverage for app-owned audio selection, TTS resolution, and audio hook behavior.

### Modified Capabilities

- None.

## Impact

- Affected code: `src/features/cards/audio/**/*`, selected `src/app/api/tts/**/*` route-adjacent helpers if covered through feature behavior, and mirrored root `__tests__/features/cards/audio/**/*`.
- Affected systems: TTS text extraction and normalization, selection draft state, locale/config resolution, shared TTS cache resolution, generated asset persistence flows, and user-facing audio preview/playback orchestration.
- Dependencies: existing Jest/Expo test tooling; no new runtime dependency is required.
