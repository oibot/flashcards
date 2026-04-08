# Import / Export Feature

## Goal

Add a very simple backup and restore feature to the settings screen with two buttons:

- `Export Data`
- `Import Data`

The feature should let a user move their flashcards between devices or keep a personal backup without introducing a new screen or a complex workflow.

## Scope

In scope:

- Export all cards for the signed-in user into a single file.
- Import cards from a previously exported file.
- Preserve review scheduling data so imported cards behave exactly like the originals.
- Keep the UI limited to two actions in settings plus lightweight confirmation and error feedback.

Out of scope for the first version:

- Partial exports
- Partial imports
- Merging by anything other than card ID
- Deleting local cards that are not present in the import file
- Cross-app compatibility with Anki or CSV

## Format Decision

Use a versioned JSON file.

Reasons:

- The current card model is already structured and maps directly to JSON.
- JSON preserves tags, HTML fields, timestamps, and scheduling fields without lossy conversion.
- It is easy to validate and evolve with a `formatVersion`.
- It avoids the limitations of CSV for arrays and nested metadata.

Suggested file shape:

```json
{
  "app": "flashcards",
  "formatVersion": 1,
  "exportedAt": "2026-04-08T09:00:00.000Z",
  "cards": [
    {
      "id": "card_123",
      "tags": ["Spanish", "Verbs"],
      "frontHtml": "<p>hablar</p>",
      "backHtml": "<p>to speak</p>",
      "createdAt": 1710000000000,
      "updatedAt": 1710000000000,
      "dueAt": 1710000000000,
      "lastReviewedAt": 1710000000000,
      "intervalDays": 3,
      "easeFactor": 2.5,
      "repetition": 2,
      "lapses": 0,
      "state": "review"
    }
  ]
}
```

## Import Behavior

First version should be non-destructive.

- If an imported card ID already exists, update it.
- If an imported card ID does not exist, create it.
- If a local card is not present in the imported file, leave it untouched.

This makes repeated imports safe and avoids accidental data loss.

## UX Summary

Settings screen keeps its current simplicity and adds:

- `Export Data`: creates a JSON backup file and opens the native share flow
- `Import Data`: opens a file picker, validates the selected JSON file, asks for confirmation, then imports it

User feedback:

- Loading state while exporting or importing
- Clear error message for invalid files or failed operations
- Confirmation before applying an import

## Technical Notes

- Export and import should be implemented in the card store layer, not as ad hoc logic in the screen.
- Import needs custom ID handling and full schedule preservation, so it should not go through the normal `addCard` flow.
- Tags should be rebuilt from imported card data using the existing tag model.
- Native file flows should use Expo packages for file writing, file picking, and sharing.
- Web can be treated as unsupported or limited in the first pass if native support is the priority.

## Sequential Implementation Plan

### Step 1: Define backup types

Add explicit TypeScript types for:

- exported backup envelope
- exported card payload
- runtime validation result

This should live close to the domain or storage layer so the format is defined once and used by both export and import.

### Step 2: Extend the card store contract

Add store methods for:

- exporting all cards for the current user
- importing a parsed backup file

These methods should be part of the shared `CardStore` interface so the UI can stay thin.

### Step 3: Implement export serialization

In the InstantDB-backed store:

- fetch all current user cards
- serialize them into the backup envelope
- include `app`, `formatVersion`, and `exportedAt`

The result of this step should be a JSON string or typed object ready to write to disk.

### Step 4: Implement import validation

Create validation logic that checks:

- `app === "flashcards"`
- `formatVersion === 1`
- `cards` is an array
- each card has the required fields and valid primitive types
- `state` is one of the supported card states

Validation should fail early with user-friendly error messages.

### Step 5: Implement import upsert logic

In the InstantDB-backed store:

- load the current user
- inspect existing cards by imported IDs
- update cards that already exist
- create cards that do not exist
- recreate or link tags for every imported card

This step must preserve imported timestamps and scheduling values exactly.

### Step 6: Add file export flow

In settings:

- trigger export
- write the JSON to a temporary file
- open the native share sheet so the user can save or send the file

Suggested filename pattern:

- `flashcards-export-YYYY-MM-DD.json`

### Step 7: Add file import flow

In settings:

- open the document picker
- copy the file into cache if needed
- read the file contents
- parse JSON
- validate the backup
- show a confirmation with the number of cards
- run the import

### Step 8: Update settings UI

Adjust the settings screen to support:

- `Export Data` button
- `Import Data` button
- independent loading/disabled states
- inline error message

The layout should remain simple and consistent with the current screen.

### Step 9: Add copy and localization

Add settings strings for:

- export button label
- import button label
- import confirmation title and message
- invalid file error
- generic import/export error states
- success messages if needed

### Step 10: Verify behavior

Manually verify:

- export produces a readable JSON file
- importing a fresh export recreates the same cards
- importing the same file twice does not duplicate cards
- malformed JSON is rejected
- wrong `formatVersion` is rejected
- review schedule data is preserved after import

### Step 11: Run project checks

Before finishing:

- `bunx tsc --noEmit`
- `bunx expo lint`
- `bun format`

Fix any errors or warnings before considering the feature complete.

## Open Questions

- Should web be unsupported in v1, or should export fall back to a downloaded file and import to an HTML file input?
- Should import show a success toast or just return silently on success?
- Should we include a future option for destructive restore, where local cards not present in the backup are removed?
