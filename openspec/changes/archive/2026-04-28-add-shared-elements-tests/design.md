## Context

The `src/shared` area mixes pure utilities, server helpers, configuration modules, and small reusable UI components. The behavior-heavy modules in that area are reused across multiple features, but they currently have no direct automated coverage. That makes changes to shared HTML parsing, shared request validation/auth handling, shared font mapping, and shared tag entry behavior more likely to regress multiple user flows at once.

At the same time, `src/shared` is not a good target for blanket coverage. Several modules are mostly wrappers around libraries, app bootstrapping, or presentation concerns where direct tests would be noisy and brittle. This change therefore needs a narrow design that adds tests only where the application owns meaningful behavior.

## Goals / Non-Goals

**Goals:**

- Add maintainable automated coverage for app-owned shared logic with meaningful behavior.
- Cover shared HTML parsing and normalization helpers directly.
- Cover shared server request/auth/body helpers directly.
- Cover shared font-weight mapping directly.
- Cover selected `TagInput` component behaviors that belong to the app rather than to upstream libraries.
- Keep shared tests under the root `__tests__/` tree with mirrored relative paths from `src/shared/`.

**Non-Goals:**

- Blanket coverage for every module under `src/shared`.
- Snapshot-heavy testing of small shared presentational wrappers.
- Deep tests for third-party library behavior in Unistyles, Expo UI wrappers, or i18n initialization.
- A broad refactor of shared modules beyond small helper extraction needed to make specific behavior easier to test.

## Decisions

### 1. Focus coverage on behavior-heavy shared modules

This change should cover the shared modules that contain app-owned logic rather than just composition:

- `src/shared/lib/html.ts`
- `src/shared/server/api-utils.ts`
- `src/shared/lib/expo-font.ts`
- `src/shared/ui/tag-input.tsx`

These modules have parsing, normalization, validation, state transitions, or guard behavior that can regress independently of the calling feature.

Alternatives considered:

- Test the entire `src/shared` directory uniformly. Rejected because much of the directory is thin wrappers or configuration with low signal-to-noise ratio.
- Skip shared tests entirely and rely on feature tests. Rejected because shared regressions can affect multiple features without a clear feature-local failure.

### 2. Prefer direct tests for pure shared helpers and narrow interaction tests for shared UI

Pure helpers should be tested directly with table-driven cases. `TagInput` should be tested at the component boundary for behaviors such as delimiter-based tag commits, backspace removal, and max-tag guards. Those interactions are meaningful app behavior and not just cosmetic rendering.

If `TagInput` proves awkward to test due to inline stateful logic, the implementation may extract only the smallest pure helper needed to isolate behavior. It should not restructure the component into a new architecture preemptively.

Alternatives considered:

- Only test pure helpers and skip shared UI entirely. Rejected because `TagInput` owns real behavior beyond rendering.
- Add deep tests for every shared UI wrapper. Rejected because most wrappers provide little value relative to maintenance cost.

### 3. Exclude shared bootstrapping and library-wrapper modules unless a concrete regression seam emerges

Modules such as `src/shared/i18n/i18n.ts`, `src/shared/styles/unistyles.ts`, and thin UI wrappers like the tags menus or loading screen should remain out of scope for this change unless implementation exposes app-owned behavior that is both non-trivial and regression-prone.

This keeps the test suite concentrated on business-relevant shared behavior rather than framework wiring.

Alternatives considered:

- Cover i18n and theme bootstrapping immediately for completeness. Rejected because those tests would mostly assert configuration rather than meaningful application logic.

### 4. Reuse the mirrored root `__tests__` convention

Shared tests should live under the project-root `__tests__/` tree using mirrored paths from `src/shared/`, such as:

- `src/shared/lib/html.ts` → `__tests__/shared/lib/html.test.ts`
- `src/shared/server/api-utils.ts` → `__tests__/shared/server/api-utils.test.ts`

This keeps the shared tests consistent with the cards and auth test layout already established in the repository.

Alternatives considered:

- Colocate tests with shared source files. Rejected because it breaks the repo’s current mirrored test convention.
- Put all shared tests under one flat folder. Rejected because it makes source ownership harder to scan.

## Risks / Trade-offs

- [Over-scoping shared coverage] → Mitigation: keep the capability limited to behavior-heavy helpers and selected shared UI behavior.
- [Shared UI tests become brittle] → Mitigation: assert behavior and state transitions rather than layout details or snapshots.
- [Refactoring for testability expands too far] → Mitigation: allow only small helper extraction where it directly reduces test friction.
- [Feature-level tests and shared tests overlap] → Mitigation: let shared tests own reusable utility behavior and keep feature tests focused on feature-specific flows.

## Migration Plan

No runtime migration is required.

Implementation should proceed in small steps:

1. Add tests for pure shared utility modules first.
2. Add tests for shared server helpers with mocked boundary behavior.
3. Add focused `TagInput` tests and extract a small helper only if the current component shape causes unnecessary test friction.
4. Run targeted shared tests plus formatter, lint, and typecheck before merging.

Rollback is straightforward: revert any extracted helper seams and the corresponding tests if the shared coverage proves too noisy or invasive.

## Open Questions

None.
