## ADDED Requirements

### Requirement: Auth provider behavior must have direct automated coverage

The codebase SHALL provide automated coverage for auth provider behavior that belongs to the application, including session mapping and auth error normalization.

#### Scenario: Session state is mapped into the app auth contract

- **WHEN** the auth provider receives loading, signed-out, signed-in, or error states from the backend auth client
- **THEN** the tests MUST verify that the returned `AuthSession` matches the app’s expected status, user shape, and normalized error behavior

#### Scenario: Auth actions normalize backend errors

- **WHEN** request-code, sign-in, or sign-out operations fail with backend error payloads
- **THEN** the tests MUST verify that the provider surfaces normalized `Error` objects for the app to consume

### Requirement: Profile bootstrap behavior must be covered at the app-owned guard boundary

The codebase SHALL provide automated coverage for the conditions under which the app attempts to create a user profile after sign-in.

#### Scenario: Profile creation only runs when the app is signed in and missing a profile

- **WHEN** the profile ensure logic evaluates auth state, loading state, query errors, and whether a profile already exists
- **THEN** the tests MUST verify that profile creation is attempted only for the signed-in, profile-missing case

#### Scenario: Duplicate profile creation attempts are suppressed while creation is in flight

- **WHEN** the profile ensure logic is re-evaluated while a profile creation request is already pending
- **THEN** the tests MUST verify that the app does not start a second profile creation attempt for the same in-flight condition

### Requirement: The primary auth screen flow must have application-level coverage

The codebase SHALL provide automated coverage for the user flow managed by the auth screen.

#### Scenario: Request-code success advances to the code step

- **WHEN** a user submits a valid email and the request-code action succeeds
- **THEN** the tests MUST verify that the screen stores the sent email, clears any previous code value, and renders the code-entry step

#### Scenario: Request-code failure shows an error and stays on the email step

- **WHEN** the request-code action fails
- **THEN** the tests MUST verify that the screen clears the sent-email state, exposes the error message, and keeps the user on the email step

#### Scenario: Sign-in failure clears the code and preserves the sent email

- **WHEN** the sign-in action fails after the code step is shown
- **THEN** the tests MUST verify that the screen clears the entered code, preserves the sent email, and surfaces the error message

#### Scenario: Using a different email resets the flow

- **WHEN** the user chooses to use a different email from the code step
- **THEN** the tests MUST verify that the screen clears the sent email, clears the code, clears the error message, and returns to the email step

### Requirement: Auth tests must follow the mirrored root test layout

Auth tests SHALL live under the project-root `__tests__/` directory using mirrored relative paths for the covered source modules under `src/`.

#### Scenario: Auth tests mirror their source module paths

- **WHEN** a test is added for an auth module under `src/features/auth/` or another auth-specific source path
- **THEN** the test file MUST be placed in a corresponding mirrored path under `__tests__/`
