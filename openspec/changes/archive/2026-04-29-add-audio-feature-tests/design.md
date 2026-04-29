## Context

The audio feature spans several layers: pure model helpers in `card-audio.ts`, draft state management in `audio-selection-draft.ts`, network/player orchestration in hooks like `use-edit-card-audio.ts` and `use-review-card-audio.ts`, and server-side TTS resolution in `resolve-draft-tts.ts`, `resolve-tts.ts`, `elevenlabs.ts`, `instant-tts-assets.ts`, and `route-utils.ts`. That makes it one of the more behavior-heavy areas in the codebase, but it currently has no focused automated coverage.

Unlike the shared utilities work, audio is more cross-cutting. The feature coordinates HTML text extraction, locale configuration, external APIs, shared cache lookup, generated asset persistence, and client preview behavior. It therefore benefits from a layered testing approach and, where necessary, a small functional-core / imperative-shell split in the most side-effect-heavy paths.

## Goals / Non-Goals

**Goals:**

- Add maintainable automated coverage for audio feature behavior owned by this app.
- Cover pure audio model helpers directly.
- Cover draft state transitions directly.
- Cover TTS resolution and cache behavior in the server layer with mocked boundaries.
- Cover selected hook behavior where the app owns the orchestration outcome.
- Keep audio tests under the root `__tests__/` tree with mirrored paths from `src/`.

**Non-Goals:**

- End-to-end tests against the real ElevenLabs API or Instant backend.
- Blanket tests for every audio module regardless of signal value.
- Retesting Expo Audio internals or third-party playback semantics.
- A broad architecture rewrite of the audio feature before adding coverage.

## Decisions

### 1. Layer audio tests by behavior ownership

The highest-value audio coverage falls into three layers:

- pure model/helpers: `card-audio.ts`
- feature-local state: `audio-selection-draft.ts`
- orchestration flows: `resolve-draft-tts.ts`, `resolve-tts.ts`, `elevenlabs.ts`, `route-utils.ts`, and selected hooks

This is preferred over relying only on hook or route tests because several important behaviors are pure or nearly pure and can be verified directly with lower maintenance cost.

Alternatives considered:

- Only add top-level hook tests. Rejected because cache and text-mapping regressions would be harder to isolate.
- Only test pure helpers and skip orchestrators. Rejected because the audio feature’s risk is concentrated in cache, locale, and side-effect coordination paths.

### 2. Extract only small pure helpers when side effects block clean tests

If hook or server tests become awkward because logic is buried in fetch/player/storage calls, the implementation may extract only the smallest behavior seams needed, such as:

- response-shape guards or payload interpreters
- draft-side state transitions
- resolver decision helpers for cache-hit / generate / needs-locale branches
- derived preview-state helpers for edit-side audio state

This change should not force a full reducer/service rewrite for the audio feature.

Alternatives considered:

- Leave all logic inline and use heavier integration-style tests. Rejected because some branches would become brittle or expensive to exercise.
- Refactor the entire audio feature into pure services first. Rejected because that adds churn disproportionate to the current goal.

### 3. Keep third-party boundaries mocked at the feature edge

Tests should mock:

- ElevenLabs request execution
- Instant storage/query/transact boundaries
- fetch-based route calls in client hooks
- file playback boundaries where needed

They should assert the app-facing decisions and outputs rather than third-party implementation details.

Alternatives considered:

- Live integration tests against the real providers. Rejected because they would be slower, less deterministic, and outside the intended unit/feature scope.

### 4. Prefer direct coverage for draft state and config handling

`audio-selection-draft.ts` and `elevenlabs.ts` are both good candidates for direct tests because they own meaningful state and configuration behavior with clear inputs and outputs. Those modules provide high value without requiring broad environment setup.

Alternatives considered:

- Cover them only indirectly through hooks or resolvers. Rejected because it would hide the most reusable branches behind larger orchestration tests.

### 5. Reuse the mirrored root `__tests__` convention

Audio tests should live under the project-root `__tests__/` tree using mirrored relative paths for the covered source modules under `src/`, such as:

- `src/features/cards/audio/model/card-audio.ts` → `__tests__/features/cards/audio/model/card-audio.test.ts`
- `src/features/cards/audio/server/resolve-tts.ts` → `__tests__/features/cards/audio/server/resolve-tts.test.ts`

Alternatives considered:

- Colocated tests beside source files. Rejected because it breaks the repository’s current mirrored test layout.

## Risks / Trade-offs

- [Over-mocking server flows] → Mitigation: mock only at third-party boundaries and assert feature-owned decisions, not implementation trivia.
- [Audio hook tests become brittle] → Mitigation: keep hook coverage targeted to user-visible orchestration outcomes and extract only minimal helpers if necessary.
- [Refactoring for testability expands too far] → Mitigation: allow only small pure seams where they directly reduce test friction.
- [Coverage scope becomes too broad] → Mitigation: prioritize model, draft, and server resolution flows first; add hook tests only where they materially protect app behavior.

## Migration Plan

No runtime migration is required.

Implementation should proceed in small steps:

1. Add direct tests for audio model helpers and draft state.
2. Add direct tests for TTS config and route error handling helpers.
3. Add server resolver tests with mocked persistence/generation boundaries.
4. Add selected hook tests if the behavior materially belongs to the app and can be tested cleanly.
5. Run targeted audio tests plus formatter, lint, and typecheck before merging.

Rollback is straightforward: revert any extracted helper seams and corresponding tests if the change becomes too invasive.

## Open Questions

None.
