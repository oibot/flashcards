# Edit Card Save Behavior Split

## Goal

Split the edit-card save flow into two explicitly different kinds of work:

1. **Card metadata save**
   - Local-first.
   - Covers card text, tags, variants, scheduling records, and the card/cardSet identity.
   - The UI should be able to accept the draft and move on without waiting for remote sync.

2. **Audio attachment**
   - Remote/API-backed.
   - Covers attaching already-created TTS assets to the saved card set.
   - The UI may still await this step for now, but it should be modeled as a separate remote side effect rather than as part of the local-first metadata write.

This preserves correctness for audio while moving the card metadata path toward the same boundary established by the local-first review grading cleanup.

## Background

The UI/data-layer separation findings identified the edit card save flow as the highest-priority cleanup target.

Current save behavior in `src/features/cards/edit/screens/edit-card-screen.tsx`:

```ts
const result = await updateCard(createUpdateCardInput(draft))
await showAudioResult(audio.persistCardAudio(result.cardSetId))
onClose()
```

and for new cards:

```ts
const result = await addCard(createNewCardInput(draft))
await showAudioResult(audio.persistCardAudio(result.cardSetId))
onClose()
```

The screen currently owns too many responsibilities:

- form validation
- form state
- navigation/closing
- DB write timing
- DB failure behavior
- audio persistence sequencing

The metadata portion resembles the old review-session grading problem: the UI awaits persistence before moving on, even though Instant can model the write locally first.

## Key Finding

Card metadata and audio attachment should not be treated as one undifferentiated save operation.

Card metadata is a good local-first candidate because the store can generate IDs, build Instant transactions, and let Instant handle optimistic/local writes and later sync.

Audio attachment is different because it calls a remote API:

```ts
fetch("/api/tts/attach", ...)
```

That API likely mutates server/storage state by attaching generated TTS assets to a card set. Unlike an Instant transaction, this is not currently a local-first operation from the client’s perspective.

## The Open Issue

The open issue is not whether card metadata should become local-first. It should.

The issue is how to handle selected audio when metadata has been accepted locally but the remote audio attach step has not completed yet.

Problems to account for:

1. **Audio attach needs a cardSet ID**
   - New cards need a locally generated `cardSetId` before `/api/tts/attach` can run.
   - The store should produce that ID before or while scheduling the metadata transaction.

2. **Audio attach can fail independently**
   - Metadata may save successfully while audio attachment fails.
   - The app needs a clear policy for reporting this partial failure.

3. **Audio attach is user-visible**
   - If a user selected audio and attachment fails, the card may exist without the expected audio.
   - Closing immediately without any global error UX could hide the failure.

4. **Current boundaries are fuzzy**
   - The card input includes TTS selection:

   ```ts
   tts: audio.getPersistedSelection()
   ```

   - The screen also separately calls:

   ```ts
   audio.persistCardAudio(result.cardSetId)
   ```

   This means audio state is partly represented in card metadata and partly persisted through the audio hook/API.

## Desired Boundary

### Edit screen / UI layer

Responsible for:

- Form state.
- Validation of required front/back content.
- User intent: save, add another, close/discard.
- Deciding whether to show user-facing audio attach errors while audio remains awaited.

Not responsible for:

- Constructing Instant transactions.
- Awaiting metadata sync as a remote operation.
- Handling Instant persistence failures.
- Knowing Instant transaction details.

### Card store / data layer

Responsible for:

- Generating card/cardSet IDs.
- Translating card metadata changes into Instant transactions.
- Returning the local `cardSetId` needed by follow-up work.
- Catching/logging background Instant persistence failures where the action is local-first.

### Audio client/data layer

Responsible for:

- Calling TTS APIs.
- Attaching TTS assets to a card set.
- Formatting API/HTTP failures.
- Eventually supporting retry/background behavior if desired.

The existing `useEditCardAudio` hook may continue to orchestrate this initially, but the feature direction should be toward a smaller TTS client layer so the hook focuses on UI/playback state.

## Proposed Behavior

### Save existing card

1. Validate the draft.
2. Accept metadata locally through the card store.
3. Receive/know the `cardSetId` immediately.
4. Attach audio as a separate remote operation if there are dirty audio selections.
5. For now, continue showing an alert if audio attach fails.
6. Close after the chosen audio policy completes.

### Add new card

1. Validate the draft.
2. Generate card/cardSet IDs in the store.
3. Schedule/persist metadata as a local-first Instant write.
4. Return `cardSetId` immediately/near-immediately.
5. Attach audio separately using that `cardSetId`.
6. For “Add another”, reset the form only after the intended metadata/audio policy has completed.

## Initial Implementation Policy

For this change, use a conservative split:

- Make metadata save local-first from the caller’s perspective.
- Keep audio attachment as a separate awaited remote step for now.
- Keep user-facing audio attach errors in the edit flow for now.
- Move Instant metadata persistence errors into the store and log them there.

This means the UI may still wait before closing when audio needs to be attached, but it will wait specifically for the remote audio step, not for card metadata sync.

Conceptually:

```ts
const result = saveCardMetadataLocally(draft)

if (hasAudioPersistence(draft)) {
  await result.metadataPersisted
  const audioResult = await attachAudioIfNeeded(result.cardSetId)
  showAudioErrorIfNeeded(audioResult)
}

onClose()
```

The `metadataPersisted` promise is still a data-layer concern. It lets the audio attach step avoid racing a remote `/api/tts/attach` call against creation/update of the card set while preserving an immediate local `cardSetId` result for the UI.

not:

```ts
await saveEntireCardIncludingMetadataAndAudio(draft)
onClose()
```

## Non-Goals

- Do not make `/api/tts/attach` fire-and-forget yet.
- Do not add a global background sync/error system yet.
- Do not silently ignore audio attach failures.
- Do not redesign TTS generation or playback.
- Do not change backup/import/export behavior.

## Acceptance Criteria

- Card metadata save is explicitly separated from audio attachment in the edit flow.
- The card store owns local ID generation and metadata persistence details.
- The edit UI no longer treats Instant metadata persistence as the blocking remote save.
- Audio attachment remains a separate remote operation with its own result/error handling.
- New-card save can obtain a `cardSetId` without waiting for remote sync.
- Existing UX remains understandable when audio attach fails.
- Tests cover the separated behavior for add, update, and audio failure where practical.

## Candidate Files To Update

- `src/features/cards/edit/screens/edit-card-screen.tsx`
  - Separate metadata acceptance from audio attachment in `handleSave` and `handleAddAnother`.

- `src/features/cards/edit/hooks/use-edit-card.ts`
  - Keep as a thin bridge to the store or expose clearer metadata-save actions.

- `src/features/cards/data/card-store.ts`
  - Adjust save API shape if needed so local IDs/results are available immediately.

- `src/features/cards/data/instant/instant-card-store.ts`
  - Generate IDs before transactions.
  - Catch/log local-first metadata persistence failures in the store where appropriate.

- `src/features/cards/audio/hooks/use-edit-card-audio.ts`
  - Keep audio attach separate from metadata save.
  - Later candidate: move API calls into a dedicated TTS client layer.

## Validation

Targeted checks during implementation:

```sh
bunx tsc --noEmit
bun jest __tests__/features/cards/edit
```

Before commit, run the project checks from `AGENTS.md`:

```sh
bunx tsc --noEmit
bun format
bunx expo lint
bun jest
```
