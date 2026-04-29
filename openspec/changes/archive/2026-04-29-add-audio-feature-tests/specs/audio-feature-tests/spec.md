## ADDED Requirements

### Requirement: Audio model and draft state behavior must have direct automated coverage

The codebase SHALL provide automated coverage for audio feature modules that own pure mapping, normalization, or state-transition behavior.

#### Scenario: Audio model helpers map text, locales, and card sides correctly

- **WHEN** audio model helpers resolve content sides, normalize TTS source text, validate locales, or map visible TTS selections back to canonical card-set patches
- **THEN** the tests MUST verify the expected outputs for representative card variants, locales, and visible-side inputs

#### Scenario: Audio draft state transitions handle hydration, invalidation, and readiness

- **WHEN** the audio draft store hydrates existing audio, receives HTML changes, enters creating/error states, clears a side, or marks a side ready
- **THEN** the tests MUST verify the expected side state, invalidation behavior, and draft reset semantics

### Requirement: Audio server resolution behavior must have direct automated coverage

The codebase SHALL provide automated coverage for audio server modules that resolve locale configuration, cache behavior, generated asset handling, and route-level error mapping.

#### Scenario: TTS configuration and provider helpers handle locale and environment behavior

- **WHEN** the audio server resolves configured locales, voice profiles, or TTS config for supported and unsupported environment setups
- **THEN** the tests MUST verify the expected configuration results and thrown feature errors

#### Scenario: Draft TTS resolution handles cache hit, generation, and persistence race behavior

- **WHEN** the draft TTS resolver evaluates speakable text, shared cache results, generation results, and raced persistence outcomes
- **THEN** the tests MUST verify the returned ready response or feature error and the expected cache-hit semantics

#### Scenario: Review-card TTS resolution handles locale selection and asset reuse

- **WHEN** the review-card TTS resolver evaluates card ownership, variant/content validity, selected locale state, selected asset reuse, shared cache reuse, or generated asset fallback
- **THEN** the tests MUST verify the returned ready or needs-locale response and the expected card-set reference updates

#### Scenario: Route-level TTS errors are mapped to API error responses

- **WHEN** the route-level audio error helper receives expected TTS errors, unexpected `Error` instances, or unknown thrown values
- **THEN** the tests MUST verify the returned JSON error response and the expected logging branch

### Requirement: Selected audio hook behavior must have application-level coverage

The codebase SHALL provide automated coverage for audio hooks where the application owns meaningful orchestration behavior beyond third-party playback internals.

#### Scenario: Review audio hook handles unavailable auth and successful resolution

- **WHEN** the review audio hook is asked to play audio without auth, with a previously resolved file URL, or after a successful resolve request
- **THEN** the tests MUST verify the returned playback result, cached URL behavior, and loading/reset semantics

#### Scenario: Edit audio hook handles draft creation and stale preview behavior

- **WHEN** the edit audio hook observes a creating draft side, a stale side with a selected locale, or a resolved draft response
- **THEN** the tests MUST verify the expected draft state transitions and preview orchestration outcomes that belong to the app

### Requirement: Audio tests must follow the mirrored root test layout

Audio tests SHALL live under the project-root `__tests__/` directory using mirrored relative paths for the covered source modules under `src/`.

#### Scenario: Audio tests mirror their source module paths

- **WHEN** a test is added for an audio module under `src/features/cards/audio/` or another covered audio-specific source path
- **THEN** the test file MUST be placed in the corresponding mirrored path under `__tests__/`
