## 1. Prepare testable auth seams

- [x] 1.1 Review the auth provider, profile hook, and auth screen to identify any small behavior decisions that are difficult to test while embedded in side-effect code.
- [x] 1.2 Extract or refine only the smallest pure helpers needed to test auth error normalization, auth session mapping, profile creation guards, or auth-screen state transitions.
- [x] 1.3 Keep backend calls, hook wiring, and navigation/runtime integration in the existing auth shell modules rather than expanding the refactor scope.

## 2. Add auth feature coverage

- [x] 2.1 Create the mirrored root `__tests__/features/auth` directory structure for the auth modules covered by this change.
- [x] 2.2 Add tests for `src/features/auth/api/instant-auth-client.ts` covering session mapping and auth error normalization for request-code, sign-in, and sign-out actions.
- [x] 2.3 Add tests for `src/features/auth/hooks/use-ensure-profile.ts` covering the signed-in/profile-missing guard path and the in-flight duplicate suppression behavior.
- [x] 2.4 Add tests for `src/features/auth/screens/auth-screen.tsx` covering request-code success/failure, sign-in failure behavior, and resetting back to the email step.

## 3. Verify the auth test setup

- [x] 3.1 Reuse or adjust the existing Jest setup only if an auth-specific support configuration is needed for the new tests.
- [x] 3.2 Run the targeted auth tests and fix any gaps in helper extraction, mocks, or assertions.
- [x] 3.3 Run `bun format`, `bunx expo lint`, and `bunx tsc --noEmit` after the auth test changes are complete.
