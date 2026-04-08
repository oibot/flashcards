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
- Native alerts for invalid files or failed operations
- Success alert after a completed import
- Confirmation before applying an import

## Technical Notes

- Export and import should be implemented in the card store layer, not as ad hoc logic in the screen.
- Import needs custom ID handling and full schedule preservation, so it should not go through the normal `addCard` flow.
- Tags should be rebuilt from imported card data using the existing tag model.
- Native file flows should use Expo packages for file writing, file picking, and sharing.
- Web can be treated as unsupported or limited in the first pass if native support is the priority.

## Implementation Status

Completed:

- Step 1: Define backup types
- Step 2: Extend the card store contract
- Step 3: Implement export serialization
- Step 4: Implement import validation
- Step 5: Implement import upsert logic
- Step 6: Add file export flow
- Step 7: Add file import flow
- Step 8: Update settings UI
- Step 9: Add copy and localization
- Step 11: Run project checks during implementation

Implemented details:

- The backup format is a versioned JSON envelope around the existing `Card` domain model.
- The `CardStore` supports both `exportCards()` and `importCards(...)`.
- Export serializes the signed-in user's cards into a stable JSON backup shape.
- Import validates the selected backup before any write happens.
- Import is non-destructive and idempotent by card ID.
- Tags are recreated or linked during import using the existing InstantDB tag model.
- The settings route remains thin; screen-side orchestration lives in a dedicated hook.
- Settings now exposes `Export Data`, `Import Data`, and `Log out`.
- Export writes a JSON file into the Expo cache and opens the native share sheet.
- Import uses the native file picker, parses JSON, validates the backup, confirms with the user, and then imports it.
- Invalid backup files show a friendly error alert.
- Successful imports show a success alert with the imported card count.

## Remaining Verification

Still pending:

- Step 10: manual device or simulator verification

Recommended verification checklist:

- Export produces a readable JSON file.
- Importing a fresh export recreates the same cards.
- Importing the same file twice does not duplicate cards.
- Malformed JSON is rejected with a friendly error.
- Wrong `formatVersion` is rejected.
- Review schedule data is preserved after import.
