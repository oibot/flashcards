## Why

The auth feature controls whether users can access the app at all, but it currently has no automated test coverage. That leaves session mapping, error handling, profile bootstrapping, and the email/code sign-in flow vulnerable to regressions that are expensive to catch manually.

## What Changes

- Add tests for the auth feature, focusing on the provider/session mapping layer, profile creation guards, and the auth screen flow.
- Keep auth tests scoped to behavior that belongs to this app rather than trying to retest InstantDB itself.
- Refactor auth logic into smaller pure and side-effect boundaries where doing so makes the behavior materially easier to test.
- Store the new auth tests under the project-root `__tests__/` tree, mirroring the relevant paths under `src/` for consistency with the cards test layout.

## Capabilities

### New Capabilities

- `auth-feature-tests`: Adds maintainable automated coverage for auth session mapping, auth error normalization, profile ensuring behavior, and the primary auth screen flow.

### Modified Capabilities

- None.

## Impact

- Affected code: `src/features/auth/**/*`, selected app auth entry points, root `__tests__/` mirrors for auth modules, and Jest configuration if any additional discovery or support setup is required.
- Affected systems: sign-in flow, session state mapping, profile bootstrap behavior, and future auth refactors.
- Dependencies: existing Jest/Expo test tooling; no new runtime dependency is required.
