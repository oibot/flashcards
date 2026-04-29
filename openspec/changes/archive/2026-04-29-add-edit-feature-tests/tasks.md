## 1. Prepare edit test seams

- [x] 1.1 Review the edit hooks, screens, routes, and language-selection flow to confirm which edit-owned behaviors still need direct coverage.
- [x] 1.2 Extract or refine only the smallest pure edit helper needed if draft comparison, payload construction, locale ordering, or save-decision logic is too awkward to test inside hooks and screens.
- [x] 1.3 Keep rich-text editor internals, Expo Router stack behavior, keyboard-controller internals, and adjacent audio/store systems mocked at the feature edge.

## 2. Add direct edit hook and helper coverage

- [x] 2.1 Create the mirrored root `__tests__/features/cards/edit` directory structure for the edit modules covered by this change.
- [x] 2.2 Add direct tests for selected edit hooks such as `src/features/cards/edit/hooks/use-edit-card-form.ts` and `src/features/cards/edit/hooks/use-edit-card-tags.ts` covering hydration, dirty-state behavior, draft creation, tag normalization, and reset behavior.
- [x] 2.3 If a pure helper is extracted for editor-state mapping, payload construction, or language-selection decisions, add direct tests for that helper with plain inputs and outputs.

## 3. Add edit screen and route coverage

- [x] 3.1 Add targeted tests for `src/features/cards/edit/screens/edit-card-screen.tsx` covering new-card save, edit-card save, add-another, invalid-content suppression, and discard-confirmation behavior.
- [x] 3.2 Add targeted tests for `src/features/cards/edit/screens/language-selection-screen.tsx` covering locale ordering, selected side resolution, create-audio intent, clear-without-audio, and delete-confirmation flows.
- [x] 3.3 Add targeted tests for selected edit routes such as `src/features/cards/edit/routes/edit-card-route.tsx` covering loading, error, missing-card, and ready branches.
- [x] 3.4 Refine the implementation only as needed to keep editor, router, and alert assertions deterministic without broad feature refactors.

## 4. Verify the edit test setup

- [x] 4.1 Reuse the existing Jest setup and add only the mocks or helpers needed for edit feature tests.
- [x] 4.2 Run the targeted edit tests and fix any gaps in helper extraction, mocks, or assertions.
- [x] 4.3 Run `bun format`, `bunx expo lint`, and `bunx tsc --noEmit` after the edit test changes are complete.
