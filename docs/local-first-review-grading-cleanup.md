# Local-First Review Grading Cleanup

## Goal

Make review-session grading behave like a local-first write:

- The review UI records the user action and advances immediately.
- The database layer persists/queues the Instant transaction.
- The UI does not wait for remote sync and does not own sync error handling.
- For now, persistence failures are logged with `console.error` in the database layer.

This keeps the review flow fast and aligns the app with Instant's offline-first model.

## Background

Instant applies transactions optimistically and can queue writes locally for later sync. The review UI should therefore not treat card grading like a traditional network request.

The previous implementation awaited `reviewCard` before switching to the next card. With poor connectivity, that made card switching feel delayed even though the user action could be accepted locally.

A temporary optimistic change moved the await into the UI hook as background work. This fixed perceived latency, but left persistence concerns inside `useReviewSession`.

## Desired Boundary

### UI / review session layer

Responsible for:

- Current session card index
- Front/back visibility
- Reviewed count
- Complete/empty state
- Delete confirmation flow

Not responsible for:

- Awaiting review persistence
- Tracking pending review transactions
- Handling sync failures
- Knowing whether Instant is online or offline

### Card store / database layer

Responsible for:

- Translating domain actions into Instant transactions
- Fire-and-forget review persistence where appropriate
- Logging persistence failures for now
- Future central sync/error reporting if needed

## Proposed API Shape

Preferred cleanup: make `reviewCard` a local-first action from the caller's perspective.

Current type:

```ts
reviewCard: (
  card: Card,
  grade: ReviewGrade,
  reviewedAt?: number,
) => Promise<void>
```

Proposed type:

```ts
reviewCard: (
  card: Card,
  grade: ReviewGrade,
  reviewedAt?: number,
) => void
```

The store implementation still uses Instant asynchronously, but catches errors internally.

```ts
const reviewCard = (card: Card, grade: ReviewGrade, reviewedAt = Date.now()) => {
  const persistReview = async () => {
    try {
      await db.transact(
        db.tx.cards[card.id].update({
          ...scheduleCardReview(card, grade, reviewedAt),
          updatedAt: reviewedAt,
        }),
      )
    } catch (error) {
      console.error("Failed to persist card review.", error)
    }
  }

  void persistReview()
}
```

## Review Hook After Cleanup

`useReviewSession` should become simple again:

```ts
const grade = (reviewGrade: ReviewGrade) => {
  if (!currentCard || isMutatingCard) return

  reviewCard(currentCard, reviewGrade)
  setMutationError(null)
  setReviewedCount((count) => count + 1)

  if (isLastCard) {
    setIsSessionComplete(true)
    setIsBackVisible(false)
    return
  }

  setCurrentIndex((index) => index + 1)
  setIsBackVisible(false)
}
```

The hook should no longer need:

- `isSubmittingReview`
- `pendingReviewCardIds`
- `isMounted`
- background persistence functions
- review persistence `catch` blocks

`isMutatingCard` should continue to represent blocking delete work only.

## Error Handling For Now

For this cleanup, review persistence failures should only be logged in the DB layer:

```ts
console.error("Failed to persist card review.", error)
```

No user-facing sync error UI is required yet.

Future improvement: centralize background sync failures into a small app-level sync status/error store or toast/banner.

## Acceptance Criteria

- Pressing a grade advances to the next card immediately.
- The review session does not await `reviewCard`.
- `useReviewSession` contains no review-specific persistence error handling.
- Instant transaction errors from review persistence are caught and logged in the card store.
- Existing review-session behavior stays the same for reveal, completion, and delete.
- Tests cover immediate advancement while persistence is pending.

## Files To Update

- `src/features/cards/data/card-store.ts`
  - Change `reviewCard` return type to `void`.

- `src/features/cards/data/instant/instant-card-store.ts`
  - Catch/log errors inside `reviewCard`.

- `src/features/cards/review/hooks/use-review-session.ts`
  - Remove persistence bookkeeping from the hook.
  - Call `reviewCard` and advance immediately.

- `__tests__/features/cards/review/hooks/use-review-session.test.ts`
  - Keep/update test that verifies immediate advancement while review persistence is pending.
  - Adjust failure tests to expect logging at the store layer instead of UI mutation errors.

## Validation

Run:

```sh
bunx tsc --noEmit
bun jest __tests__/features/cards/review/hooks/use-review-session.test.ts
```

Before commit, also run the project checks from `AGENTS.md`:

```sh
bun format
bunx expo lint
bun jest
```
