# UI/Data Layer Separation Findings

## Summary

The review grading cleanup established a preferred boundary for local-first app actions:

- UI layers should accept user intent and update local/session state immediately when the action can be modeled as a local-first write.
- Data/store layers should translate domain actions into Instant transactions.
- Data/store layers should catch and log background persistence failures for now.
- UI layers should not wait for remote sync unless the action is inherently remote, destructive, or requires a server result to continue.

This document lists other places where UI and data-layer responsibilities are currently mixed.

## Separation Leaks

### 1. Auth profile ensure hook directly imports Instant DB

File:

- `src/features/auth/hooks/use-ensure-profile.ts`

Current behavior:

```ts
import { db } from "@/features/cards/data/instant/db"
```

The auth hook directly uses:

```ts
db.useQuery(...)
await db.transact(...)
```

This hook is in the auth feature but knows Instant query shape and transaction details. It already handles persistence failure in the preferred background style:

```ts
console.error("Failed to ensure profile", profileError)
```

Potential cleanup:

- Introduce a profile/auth data layer, for example:

```ts
profileStore.useProfileQuery(user.id)
profileStore.ensureProfile(user.id)
```

- Keep the hook responsible only for deciding when a profile should be ensured.
- Keep Instant query/transaction details inside the store.

Priority: medium.

### 2. Audio hooks contain API/client logic

Files:

- `src/features/cards/audio/hooks/use-edit-card-audio.ts`
- `src/features/cards/audio/hooks/use-review-card-audio.ts`

Current behavior:

- Hooks call `fetch` directly.
- Hooks parse API responses.
- Hooks format HTTP errors.
- Hooks manage playback/UI state.

This is not exactly the same as Instant local-first persistence, but it mixes UI state with API/client responsibilities.

Potential cleanup:

Create a small TTS client layer, for example:

```ts
ttsClient.resolveReviewAudio(...)
ttsClient.resolveDraftAudio(...)
ttsClient.attachAudio(...)
```

Then hooks can focus on:

- loading state
- selected audio state
- playback state
- user-facing error state

Priority: medium.

## Probably Acceptable For Now

### 3. Backup import/export awaits store actions

File:

- `src/features/cards/backup/hooks/use-card-backup-actions.ts`

Current behavior:

```ts
await cardStore.exportCards()
await cardStore.importCards(backup)
```

This is acceptable because import/export are explicit long-running user actions. The user expects loading state, success alerts, and failure alerts.

Priority: low.

### 4. Auth screen awaits auth actions

File:

- `src/features/auth/screens/auth-screen.tsx`

Current behavior:

```ts
await requestCode({ email: trimmedEmail })
await signInWithCode({ email: sentEmail, code: trimmedCode })
```

This is acceptable because authentication is inherently remote and user-facing errors are important.

Priority: low.

### 5. Review delete awaits remove action

File:

- `src/features/cards/review/hooks/use-review-session.ts`

Current behavior:

```ts
await removeCard(currentCard.id)
```

This is more defensible than review grading because delete is destructive and changes the session card list. It could be made optimistic later, but it needs more rollback/error design than grading.

Priority: low to medium.

## Recommendation

Next cleanup target: auth profile data-layer extraction or TTS client extraction.
