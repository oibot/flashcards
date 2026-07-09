# UI/Data Layer Separation Findings

## Summary

The review grading cleanup established a preferred boundary for local-first app actions:

- UI layers should accept user intent and update local/session state immediately when the action can be modeled as a local-first write.
- Data/store layers should translate domain actions into Instant transactions.
- Data/store layers should catch and log background persistence failures for now.
- UI layers should not wait for remote sync unless the action is inherently remote, destructive, or requires a server result to continue.

This document lists other places where UI and data-layer responsibilities are currently mixed.

## Probably Acceptable For Now

### 1. Backup import/export awaits store actions

File:

- `src/features/cards/backup/hooks/use-card-backup-actions.ts`

Current behavior:

```ts
await cardStore.exportCards()
await cardStore.importCards(backup)
```

This is acceptable because import/export are explicit long-running user actions. The user expects loading state, success alerts, and failure alerts.

Priority: low.

### 2. Auth screen awaits auth actions

File:

- `src/features/auth/screens/auth-screen.tsx`

Current behavior:

```ts
await requestCode({ email: trimmedEmail })
await signInWithCode({ email: sentEmail, code: trimmedCode })
```

This is acceptable because authentication is inherently remote and user-facing errors are important.

Priority: low.

### 3. Review delete awaits remove action

File:

- `src/features/cards/review/hooks/use-review-session.ts`

Current behavior:

```ts
await removeCard(currentCard.id)
```

This is more defensible than review grading because delete is destructive and changes the session card list. It could be made optimistic later, but it needs more rollback/error design than grading.

Priority: low to medium.

