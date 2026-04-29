## ADDED Requirements

### Requirement: Edit form and tag behavior must have direct automated coverage

The codebase SHALL provide direct automated coverage for edit feature modules that own draft hydration, dirty-state evaluation, draft construction, or tag-selection behavior.

#### Scenario: Edit form behavior hydrates and evaluates draft state correctly

- **WHEN** tests exercise edit form behavior with and without an initial card, pending tag input, changed editor HTML, or opposite-direction selection
- **THEN** the tests MUST verify the expected hydration, unsaved-change detection, and returned draft values

#### Scenario: Edit tag behavior normalizes additions and resets local state

- **WHEN** tests exercise tag-add and tag-reset behavior for the edit feature
- **THEN** the tests MUST verify normalized tags, available-tag filtering, and the expected reset interactions with the tag input handle

### Requirement: Edit screen and route orchestration must have application-level coverage

The codebase SHALL provide automated coverage for edit feature screens and selected routes where the application owns meaningful save, discard, loading, or reset behavior.

#### Scenario: Edit screen routes save actions through the correct mutation flow

- **WHEN** the edit screen saves a valid draft in new-card, edit-card, or add-another flows
- **THEN** the tests MUST verify the expected add or update payload, audio persistence behavior, close or reset behavior, and opposite-direction handling

#### Scenario: Edit screen blocks invalid save attempts and guards closing with unsaved changes

- **WHEN** the edit screen receives empty meaningful content or the user attempts to close with and without unsaved changes
- **THEN** the tests MUST verify that invalid saves are ignored, discard confirmation appears only when needed, and closing proceeds through the correct branch

#### Scenario: Edit route surfaces loading, error, and ready states

- **WHEN** the edit route evaluates loading, query error, missing-card, or loaded-card states
- **THEN** the tests MUST verify that it renders the expected loading view, fallback message, or hydrated edit screen

### Requirement: Edit-side language selection must have application-level coverage

The codebase SHALL provide automated coverage for the edit feature’s language-selection flow where the application owns locale ordering, delete confirmation, and create-audio intent behavior.

#### Scenario: Language selection orders locales and reflects the selected side

- **WHEN** the language-selection screen loads with router params, current draft state, and the current app language
- **THEN** the tests MUST verify the expected side resolution, preferred-locale ordering, and selected-row state

#### Scenario: Language selection handles save, clear, and delete-confirmation flows

- **WHEN** the user saves a non-null locale, clears a side without existing audio, or clears a side with existing audio
- **THEN** the tests MUST verify the expected draft mutation, delete confirmation branch, and dismiss behavior

### Requirement: Edit test seams must stay narrowly scoped to app-owned logic

The edit feature SHALL extract only the smallest pure helper seam needed when editor refs, route params, or alert-driven branching block direct coverage of important behavior.

#### Scenario: Pure seam extraction stays focused on edit preparation behavior

- **WHEN** direct tests are awkward because draft comparison, payload construction, locale ordering, or save-decision behavior is buried in screen or hook side effects
- **THEN** the implementation MUST extract a narrowly scoped pure helper for that behavior rather than introduce a broad service abstraction or rewrite unrelated feature areas

### Requirement: Edit tests must follow the mirrored root test layout

Edit tests SHALL live under the project-root `__tests__/` directory using mirrored relative paths for the covered source modules under `src/`.

#### Scenario: Edit tests mirror their source module paths

- **WHEN** a test is added for a module under `src/features/cards/edit/`
- **THEN** the test file MUST be placed in the corresponding mirrored path under `__tests__/`
