## Context

The edit feature spans several layers:

- local form and tag hooks in `use-edit-card-form.ts` and `use-edit-card-tags.ts`
- editor state orchestration in `use-edit-card-editors.ts`
- store wiring in `use-edit-card.ts`
- screen-level save, discard, add-another, and language-picker navigation behavior in `edit-card-screen.tsx`
- locale selection and delete-confirmation behavior in `language-selection-screen.tsx`
- thin route wrappers such as `edit-card-route.tsx`

This is one of the more behavior-heavy UI features in the app. It coordinates rich-text refs, tag commit behavior, card-store mutations, audio draft persistence, router dismissal, and alert-driven confirmation flows. Despite that, there is currently no mirrored `__tests__/features/cards/edit` coverage.

## Goals / Non-Goals

**Goals:**

- Add maintainable automated coverage for edit feature behavior owned by this app.
- Cover form hydration, dirty-state checks, and tag behavior directly where practical.
- Cover selected edit screen and route orchestration behavior with mocked boundaries.
- Cover language-selection behavior that belongs to the edit feature rather than the server-side TTS flows.
- Extract only the smallest pure helper seam needed if editor or screen logic is too awkward to test inline.
- Keep edit tests under the root `__tests__/` tree with mirrored paths from `src/`.

**Non-Goals:**

- End-to-end tests against real rich-text editor internals, router navigation stacks, or keyboard-controller behavior.
- Snapshot coverage for every edit component regardless of behavioral value.
- Re-testing audio generation, review playback, or server-side TTS flows that already belong to other feature areas.
- A broad refactor of the edit feature into reducer or service abstractions before adding tests.

## Decisions

### 1. Layer edit tests by behavior ownership

The highest-value edit coverage should split into:

- direct coverage for edit hooks or extracted pure helpers that own form, tag, or editor-state behavior
- targeted screen and route coverage for `EditCardScreen`, `LanguageSelectionScreen`, and selected route wrappers

This is preferred over relying only on rendered screen tests because form hydration, draft construction, and dirty-state logic become easier to verify directly with lower maintenance cost. It is also preferred over hook-only coverage because the user-facing risk is concentrated in save/discard/add-another flows and language-selection orchestration.

Alternatives considered:

- Only add screen tests. Rejected because too much form logic would remain buried behind mock-heavy UI setup.
- Only add hook tests. Rejected because the feature’s highest-risk regressions involve screen orchestration and modal confirmation behavior.

### 2. Extract only narrow pure seams where refs or branching block clean tests

If tests become awkward because logic is buried in editor refs, route params, or alert callbacks, the implementation may extract only the smallest behavior seams needed, such as:

- draft-comparison or save-payload helpers used by `use-edit-card-form.ts` or `edit-card-screen.tsx`
- language-option ordering or save-decision helpers used by `language-selection-screen.tsx`
- toolbar-state mapping helpers from `use-edit-card-editors.ts`

This change should not introduce a broad edit service layer or rewrite the feature around dependency injection.

Alternatives considered:

- Leave all logic inline regardless of test friction. Rejected because rich-text and alert flows would make some important branches brittle to test repeatedly.
- Refactor the entire feature into pure services first. Rejected because that adds churn disproportionate to the test-coverage goal.

### 3. Mock editor, router, audio, and store boundaries at the feature edge

Edit tests should mock:

- `react-native-enriched` editor refs and state events
- Expo Router navigation and dismiss/push behavior
- alert dialogs and modal confirmation callbacks
- `useEditCardAudio`, `useEditCard`, and related store-bound hooks
- keyboard-controller or platform wrappers only as needed

Tests should assert app-owned decisions and outcomes such as chosen save branch, add/update payload shape, reset behavior, draft selection transitions, and route-level loading/error rendering.

Alternatives considered:

- Live integration tests against the real editor or full navigation stack. Rejected because they would be slower, less deterministic, and outside the intended unit/feature scope.

### 4. Keep language-selection coverage in the edit feature proposal

`LanguageSelectionScreen` is routed from edit-card behavior and owns selection, delete-confirmation, and create-audio intent transitions. It is more coherent to cover that flow as part of edit feature tests than to treat it as a separate audio-server concern.

Alternatives considered:

- Treat language selection as exclusively an audio feature concern. Rejected because the screen’s behavior is edit-owned UI orchestration, not TTS generation logic.

### 5. Keep the mirrored root `__tests__` convention

Edit tests should live under the project-root `__tests__/` tree using mirrored relative paths from `src/`, such as:

- `src/features/cards/edit/hooks/use-edit-card-form.ts` → `__tests__/features/cards/edit/hooks/use-edit-card-form.test.ts`
- `src/features/cards/edit/screens/edit-card-screen.tsx` → `__tests__/features/cards/edit/screens/edit-card-screen.test.tsx`

Alternatives considered:

- Colocated tests beside source files. Rejected because it breaks the repository’s current mirrored test layout.

## Risks / Trade-offs

- [Edit screen tests become overly mocked] → Mitigation: keep assertions focused on app outcomes and extract only narrow helpers where repeated branching is awkward.
- [Rich-text editor refs make hook tests brittle] → Mitigation: prefer direct tests for extracted helper seams or mocked refs instead of broad full-editor integration.
- [Coverage scope spreads into unrelated audio or shared UI concerns] → Mitigation: limit tests to behavior the edit feature owns and stub adjacent subsystems at the boundary.
- [Refactoring for testability grows beyond the request] → Mitigation: allow only small helper extraction that directly unlocks meaningful edit tests.

## Migration Plan

No runtime migration is required.

Implementation should proceed in small steps:

1. Add direct tests for selected edit hooks and any minimal extracted pure helpers.
2. Add targeted screen and route tests for `EditCardScreen`, `LanguageSelectionScreen`, and selected route wrappers.
3. Refine the smallest implementation seams needed to keep editor, alert, and router branches deterministic under test.
4. Run targeted edit tests plus formatter, lint, and typecheck before merging.

Rollback is straightforward: revert any helper extraction and corresponding tests if the change becomes too invasive.

## Open Questions

None.
