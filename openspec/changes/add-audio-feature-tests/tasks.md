## 1. Prepare audio test seams

- [x] 1.1 Review audio model, draft, server, and selected hook modules to confirm which behaviors belong in scope for direct coverage.
- [x] 1.2 Extract or refine only the smallest pure helpers needed where audio hooks or server flows are too side-effect-heavy to test cleanly.
- [x] 1.3 Keep third-party playback, live provider calls, and broad end-to-end behavior out of scope unless a concrete app-owned seam requires it.

## 2. Add direct audio model and draft coverage

- [x] 2.1 Create the mirrored root `__tests__/features/cards/audio` directory structure for the audio modules covered by this change.
- [x] 2.2 Add tests for `src/features/cards/audio/model/card-audio.ts` covering content-side mapping, locale/config guards, text extraction normalization, and canonical selection patch mapping.
- [x] 2.3 Add tests for `src/features/cards/audio/lib/audio-selection-draft.ts` covering hydration, HTML invalidation, creating/ready/error transitions, and reset behavior.

## 3. Add audio server coverage

- [x] 3.1 Add tests for `src/features/cards/audio/server/elevenlabs.ts` covering locale/voice profile resolution, configured locale discovery, and TTS config behavior.
- [x] 3.2 Add tests for `src/features/cards/audio/server/resolve-draft-tts.ts` covering no-speakable-text, shared-cache hit, generation, and persistence race branches.
- [x] 3.3 Add tests for `src/features/cards/audio/server/resolve-tts.ts` covering invalid card state handling, needs-locale responses, selected asset reuse, shared-cache reuse, and generated asset fallback.
- [x] 3.4 Add tests for `src/features/cards/audio/server/route-utils.ts` covering expected, unexpected, and unknown route error mapping behavior.

## 4. Add selected audio hook coverage

- [x] 4.1 Add targeted tests for `src/features/cards/audio/hooks/use-review-card-audio.ts` covering unavailable auth, resolved URL reuse, and successful resolve orchestration.
- [x] 4.2 Add targeted tests for `src/features/cards/audio/hooks/use-edit-card-audio.ts` only for app-owned orchestration branches that can be exercised cleanly without retesting Expo Audio internals.

## 5. Verify the audio test setup

- [x] 5.1 Reuse or adjust the existing Jest setup only if the new audio tests need additional support configuration.
- [x] 5.2 Run the targeted audio tests and fix any gaps in helper extraction, mocks, or assertions.
- [x] 5.3 Run `bun format`, `bunx expo lint`, and `bunx tsc --noEmit` after the audio test changes are complete.
