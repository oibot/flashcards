## ADDED Requirements

### Requirement: Shared utility modules must have direct automated coverage

The codebase SHALL provide automated coverage for shared utility modules that contain app-owned parsing, normalization, or mapping behavior.

#### Scenario: Shared HTML helpers are covered directly

- **WHEN** shared HTML helpers normalize content, parse fragments, extract plain text, or decode supported entities
- **THEN** the tests MUST verify the expected normalized values and parsed structures for representative HTML inputs

#### Scenario: Shared font-weight mapping is covered directly

- **WHEN** the shared font-weight helper receives supported React Native font-weight values and fallback values
- **THEN** the tests MUST verify that it returns the expected Expo font-weight mapping

### Requirement: Shared server request helpers must have direct automated coverage

The codebase SHALL provide automated coverage for shared server helpers that validate authorization headers, authenticated users, and JSON request bodies.

#### Scenario: Bearer token parsing handles valid and invalid authorization headers

- **WHEN** the shared bearer-token helper receives missing, malformed, or valid authorization headers
- **THEN** the tests MUST verify that it returns `null` for invalid inputs and the trimmed token for valid bearer inputs

#### Scenario: Authenticated user resolution handles unauthorized and valid requests

- **WHEN** the shared authenticated-user helper evaluates a request with a missing token, invalid token, authentication failure, or valid token
- **THEN** the tests MUST verify the returned unauthorized response or authenticated user and the expected warning logging behavior

#### Scenario: JSON body validation handles parse and shape failures

- **WHEN** the shared JSON body helper receives invalid JSON, invalid body shapes, or valid bodies
- **THEN** the tests MUST verify the returned error response or parsed body and the expected warning logging behavior

### Requirement: Selected shared UI behavior must have application-level coverage

The codebase SHALL provide automated coverage for shared UI components that own meaningful app behavior beyond presentation.

#### Scenario: Tag input commits tags from delimiters and submit flows

- **WHEN** the shared tag input receives comma-delimited, newline-delimited, blur, or submit interactions
- **THEN** the tests MUST verify that it commits normalized tags through `onChange` and clears or preserves pending input as expected

#### Scenario: Tag input enforces removal and max-tag guards

- **WHEN** the shared tag input receives backspace removal, explicit tag removal, or input attempts after reaching the max tag count
- **THEN** the tests MUST verify that it removes the expected tag and suppresses additional input or focus behavior when the max tag limit has been reached

### Requirement: Shared tests must follow the mirrored root test layout

Shared tests SHALL live under the project-root `__tests__/` directory using mirrored relative paths for the covered source modules under `src/shared/`.

#### Scenario: Shared tests mirror their source module paths

- **WHEN** a test is added for a shared module under `src/shared/`
- **THEN** the test file MUST be placed in the corresponding mirrored path under `__tests__/shared/`
