## Context

The auth feature is relatively small, but it controls the application entry path and sign-in flow. The main behavior currently lives in `src/features/auth/api/instant-auth-client.ts`, `src/features/auth/hooks/use-ensure-profile.ts`, `src/features/auth/screens/auth-screen.tsx`, and the auth gate in `src/app/_layout.tsx`. There are no auth tests today, so regressions in session mapping, auth error normalization, profile bootstrapping, or the email/code flow would be caught only through manual testing.

Unlike the cards data layer, auth does not justify a broad architectural rewrite. Some auth logic is already pure (`normalizeAuthError`, `toAuthUser`), while other logic mixes small but meaningful app behavior with side effects. The design for this change is therefore intentionally narrow: add tests where the app owns the behavior, and only extract small pure helpers when they remove real friction from those tests.

## Goals / Non-Goals

**Goals:**

- Add maintainable automated coverage for auth behavior that belongs to this app.
- Cover session mapping and auth error normalization in the provider layer.
- Cover profile bootstrap guard behavior so the app only attempts profile creation when appropriate.
- Cover the primary auth screen flow for requesting a code, handling failures, signing in, and resetting back to the email step.
- Keep auth tests under the root `__tests__/` directory with paths mirroring `src/`.

**Non-Goals:**

- Retesting InstantDB’s authentication implementation.
- Full end-to-end auth integration tests against the real backend.
- Snapshot-heavy tests for small auth presentational components.
- A broad refactor of the auth feature beyond seams needed to support the tests.

## Decisions

### 1. Test the provider layer directly and keep backend behavior mocked at the boundary

`instant-auth-client.ts` contains behavior that belongs to the app: mapping the Instant auth shape into `AuthSession`, normalizing backend errors into `Error` objects, and exposing the supported auth actions. Those behaviors should be tested directly with mocked `db.useAuth()` and `db.auth.*` calls.

This is preferred over treating the provider as too small to test because the provider is the only place that defines the app’s auth contract. Regressions there would propagate through the whole auth feature.

Alternatives considered:

- Skip provider tests and rely on screen tests. Rejected because UI tests would not isolate session mapping or error normalization failures cleanly.
- Add live integration tests against InstantDB. Rejected because that would be slower, more brittle, and outside the intended scope.

### 2. Extract only the smallest pure helpers needed for profile-ensure and screen-flow tests

If `useEnsureProfile` or `AuthScreen` prove awkward to test because guards are embedded in effects or handlers, the implementation may extract small pure helpers for:

- deciding whether profile creation should run
- deriving the next auth-screen state after success or failure events

This change should not move all auth logic into a new architecture. The goal is only to separate small behavior decisions from side effects where that makes tests materially easier to write and maintain.

Alternatives considered:

- Leave all auth logic inline and test only through rendered components. Rejected because some guard logic would become harder to exercise precisely.
- Refactor the entire auth flow into a reducer or service layer up front. Rejected because it adds churn disproportionate to the feature size.

### 3. Focus UI-level tests on flow transitions, not visual structure

The highest-value UI coverage is in `AuthScreen`, where the app manages transitions between the email step and code step, loading flags, and error/reset behavior. Tests should assert those state transitions and action calls rather than snapshotting presentational output from `AuthEmailStep` or `AuthCodeStep`.

Alternatives considered:

- Test each small auth component separately in depth. Rejected because those components are mostly presentational and would provide limited value relative to the screen-level flow.
- Only test hook/provider logic and skip the auth screen. Rejected because the screen owns the visible user flow and error/reset behavior.

### 4. Reuse the root mirrored `__tests__` convention

Auth tests should live under the project-root `__tests__/` tree using mirrored relative paths for modules under `src/`. This keeps the auth tests consistent with the cards data test layout and makes ownership easy to navigate.

Alternatives considered:

- Colocate auth tests beside source modules. Rejected because it breaks the established mirrored root test layout.
- Put all auth tests under a single flat folder. Rejected because it loses the source-tree mirroring convention.

## Risks / Trade-offs

- [Over-refactoring auth for testability] → Mitigation: only extract helpers when they directly simplify tests for provider, profile, or screen behavior.
- [UI tests become brittle] → Mitigation: assert state transitions, handler calls, and visible error/reset behavior rather than exact layout details.
- [Mocks drift from backend shapes] → Mitigation: keep provider tests focused on the app-facing contract and use representative mocked Instant auth payloads.
- [Coverage gaps remain around navigation gating] → Mitigation: prioritize provider, profile, and auth-screen flow first; only add layout gate tests if a clear regression risk remains.

## Migration Plan

No runtime migration is required.

Implementation should proceed in small steps:

1. Add or refine any small pure helpers needed for auth testability.
2. Create mirrored root `__tests__/features/auth` coverage for the provider, profile logic, and auth screen.
3. Reuse existing Jest config unless an auth-specific support setup is actually needed.
4. Run targeted auth tests plus formatter, lint, and typecheck before merging.

Rollback is straightforward: revert any extracted auth helpers and the corresponding tests if the change proves too invasive.

## Open Questions

None.
