## 1. Prepare shared test seams

- [x] 1.1 Review `src/shared/lib`, `src/shared/server`, and selected `src/shared/ui` modules to confirm which behaviors belong in scope for direct coverage.
- [x] 1.2 Extract or refine only the smallest pure helpers needed if shared utility or `TagInput` behavior is unnecessarily difficult to test in its current shape.
- [x] 1.3 Keep shared bootstrapping, library-wrapper modules, and low-value presentational wrappers out of scope unless a concrete app-owned regression seam appears during implementation.

## 2. Add shared utility and server coverage

- [x] 2.1 Create the mirrored root `__tests__/shared` directory structure for the shared modules covered by this change.
- [x] 2.2 Add tests for `src/shared/lib/html.ts` covering meaningful-content detection, HTML normalization, fragment parsing, and plain-text extraction.
- [x] 2.3 Add tests for `src/shared/lib/expo-font.ts` covering supported font-weight mappings and fallback behavior.
- [x] 2.4 Add tests for `src/shared/server/api-utils.ts` covering bearer-token parsing, authenticated-user handling, and JSON body validation behavior.

## 3. Add selected shared UI coverage

- [x] 3.1 Add tests for `src/shared/ui/tag-input.tsx` covering delimiter-based tag commits, blur/submit commits, backspace removal, explicit tag removal, and max-tag guards.
- [x] 3.2 Adjust shared test helpers or mocks only as needed to support the selected shared UI coverage without widening the scope to unrelated wrappers.

## 4. Verify the shared test setup

- [x] 4.1 Reuse or adjust the existing Jest setup only if the shared tests need additional support configuration.
- [x] 4.2 Run the targeted shared tests and fix any gaps in helper extraction, mocks, or assertions.
- [x] 4.3 Run `bun format`, `bunx expo lint`, and `bunx tsc --noEmit` after the shared test changes are complete.
