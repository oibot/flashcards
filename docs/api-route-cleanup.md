# API Route Cleanup

## Goal

Reduce duplication across authenticated Expo API routes without hiding route
behavior behind a large abstraction.

The immediate target is the TTS route group:

- [src/app/api/tts/resolve+api.ts](/Users/tobi/Code/flashcards/src/app/api/tts/resolve+api.ts)
- [src/app/api/tts/draft+api.ts](/Users/tobi/Code/flashcards/src/app/api/tts/draft+api.ts)
- [src/app/api/tts/locale+api.ts](/Users/tobi/Code/flashcards/src/app/api/tts/locale+api.ts)
- [src/app/api/tts/attach+api.ts](/Users/tobi/Code/flashcards/src/app/api/tts/attach+api.ts)

## Current Problem

These routes all repeat the same structure:

1. read bearer token
2. verify the token with `adminDb.auth.verifyToken`
3. parse JSON
4. validate the request body with a route-local type guard
5. run route-specific logic
6. map `TtsResolveError`
7. map generic errors

This repetition makes it harder to:

- keep auth handling consistent
- keep invalid JSON handling consistent
- keep error logging consistent
- scan the route for the part that is actually specific to that endpoint

## Recommendation

Do not introduce a single generic route builder yet.

Instead, extract three small helpers and keep request-shape validation plus
success handling in each route.

### 1. `requireAuthenticatedUser(...)`

Responsibility:

- read bearer token
- verify token with Instant admin auth
- log unauthorized cases
- return either the authenticated user or a ready `Response`

This removes the repeated auth boilerplate while keeping auth behavior explicit.

### 2. `readJsonBody(...)`

Responsibility:

- parse `request.json()`
- handle malformed JSON
- run a provided type guard
- return either the typed body or a ready `Response`

This keeps route-local validation functions but removes the repeated
parse-and-reject pattern.

### 3. `handleTtsRouteError(...)`

Responsibility:

- map `TtsResolveError` to `jsonError(...)`
- map generic `Error`
- log route-specific failure messages

This removes repeated catch blocks without forcing route logic into a wrapper.

## Desired Route Shape

After the refactor, each route should still read top-to-bottom as a normal API
handler.

Pseudo-shape:

```ts
export async function POST(request: Request) {
  const authenticatedUser = await requireAuthenticatedUser(request, {
    invalidTokenLog: "...",
    missingTokenLog: "...",
  })

  if (authenticatedUser instanceof Response) {
    return authenticatedUser
  }

  const body = await readJsonBody(request, isRequestBody, {
    invalidJsonLog: "...",
    invalidBodyLog: "...",
    invalidBodyMessage: "...",
    userId: authenticatedUser.id,
  })

  if (body instanceof Response) {
    return body
  }

  try {
    return Response.json(
      await doRouteWork({
        userId: authenticatedUser.id,
        body,
      }),
    )
  } catch (error) {
    return handleTtsRouteError(error, {
      expectedMessage: "...",
      unexpectedMessage: "...",
      fallbackMessage: "...",
    })
  }
}
```

## Why Not a Bigger Abstraction

Avoid a `createAuthedJsonRoute(...)` helper for now.

That style would reduce lines of code, but it would also make the route logic
less direct and harder to debug. At the current size of the route set, small
helpers are a better tradeoff than a full route factory.

## Non-Goals

This cleanup should not:

- add a new validation library just for these routes
- move route-specific type guards out of the route files
- hide logging behind a complex framework layer
- refactor unrelated non-TTS routes unless they clearly benefit from the same
  helpers

## Follow-Up Order

When we return to this:

1. add the shared helpers to `src/server/api-utils.ts` or a nearby server-only
   module
2. refactor the four TTS `POST` routes to use them
3. keep each route’s request guard and success path local
4. verify that logs and response messages stay unchanged

## Decision

Defer this refactor for now.

The current route code is repetitive but still readable. The cleanup is worth
doing, but it is not on the critical path for the current audio feature work.
