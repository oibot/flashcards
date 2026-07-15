# Text To Speech Feature

## Goal

Add a play button to the review card that speaks the currently visible side of
the card.

The first version should:

- use ElevenLabs for audio generation
- cache generated audio in InstantDB storage
- reuse the same generated audio across users
- keep all ElevenLabs credentials off the client

## Scope

In scope:

- review-card play button on the front and back sides
- Expo API route for resolving or generating audio
- shared `ttsAssets` cache in InstantDB
- Instant storage for MP3 files
- simple loading and retry states in review

## Decisions

- The review UI gets a single play button.
- The play button works on both sides of the review card.
- Audio is generated independently for the front and back sides.
- TTS assets are shared and immutable.
- `cardSets` store the selected TTS asset for each side.
- The client does not call ElevenLabs directly.
- Expo API routes provide the server boundary for ElevenLabs credentials and
  Instant admin writes.
- The first version uses synchronous resolve-or-generate requests.

## Current Architecture Fit

This repo currently:

- stores shared card content on `cardSets`
- stores scheduling state on `cards`
- derives `frontHtml` and `backHtml` at read time
- uses the Instant client SDK directly from the app

That means TTS should not be stored on `cards`. The source input for speech is
derived from the currently visible review content.

## Data

### Core idea

Treat generated audio as a shared immutable cache keyed by normalized speech
input and voice settings.

The cache identity must not depend on card IDs or user IDs.

Front and back content should produce separate cache entries when their speech
input differs.

`cardSets` should keep an explicit reference to the currently selected asset for
each side so future edits can switch references without mutating shared assets.

### `cardSets`

Add side-specific TTS references to the shared card content model:

```ts
type CardSetTtsSelection = {
  sideATtsAssetId?: string
  sideBTtsAssetId?: string
}
```

These references represent the currently selected sound for each side.

They should be updated when:

- audio is generated for a side for the first time
- a newer preferred sound is chosen for that side later

They should not be stored on `cards`, because the sound belongs to the shared
content side, not to one review scheduling record.

### `ttsAssets`

Add a new Instant entity:

```ts
type TtsAsset = {
  id: string
  cacheKey: string
  sourceText: string
  normalizedText: string
  locale: string
  provider: "elevenlabs"
  voiceId: string
  modelId: string
  outputFormat: "mp3"
  status: "ready" | "failed"
  fileId: string
  durationMs?: number
  error?: string
  createdAt: number
  updatedAt: number
}
```

`ttsAssets` should be treated as immutable audio renderings. If a different
voice, locale, or pronunciation is needed later, create or reuse a different
asset and update the `cardSet` side reference.

Recommended schema characteristics:

- `cacheKey` should be unique
- `status` should be indexed if filtered on
- `locale` may be indexed for debugging or admin queries

### Cache key

`cacheKey` should hash:

- normalized plain text
- locale
- voice ID
- model ID
- output format
- any voice settings that affect output
- a cache version string

Example logical input:

```ts
{
  text: "apple",
  locale: "en-US",
  voiceId: "voice_abc",
  modelId: "eleven_flash_v2_5",
  outputFormat: "mp3",
  cacheVersion: 1,
}
```

### File storage

The MP3 should be uploaded to Instant storage and linked from `ttsAssets`.

Suggested path shape:

```txt
tts/<cacheKey>.mp3
```

This keeps storage aligned with the shared cache model.

### Permissions

Because `ttsAssets` are shared and `cardSets` own the active references:

- clients should not write `ttsAssets` directly
- clients should not upload TTS files directly
- API routes should use the Instant admin SDK for writes
- API routes may update the side reference on `cardSets`
- reads can stay route-mediated in v1

For the first version, the app does not need direct `db.useQuery(...)` access to
`ttsAssets`. The review flow can rely entirely on the API route response.

## Domain

### Core idea

Keep TTS resolution logic out of UI components. The UI asks for audio for a
card side; the server resolves the text, ensures the `cardSet` points at the
correct asset for that side, and returns a playable file URL.

### Source of truth

The request should contain:

```ts
type ResolveTtsRequest = {
  cardId: string
  visibleSide: "front" | "back"
}
```

The server route should:

1. authenticate the current user
2. load the card and related `cardSet`
3. resolve the current visible HTML from the card variant
4. strip HTML to normalized plain text for that side
5. compute the `cacheKey`
6. check whether the `cardSet` already references a `ttsAsset` with that
   `cacheKey`
7. if so, return the referenced file
8. otherwise look for an existing shared `ttsAsset` with that `cacheKey`
9. if found, update the `cardSet` side reference and return the existing file
10. otherwise call ElevenLabs, upload the MP3 to Instant storage, create the
    asset, update the `cardSet` side reference, and return the new file

This flow should work the same way for:

- front-side audio
- back-side audio

### Why server-side resolution

The route should derive speech input from `cardId` instead of trusting client
text because that:

- avoids duplicated normalization logic on the client
- keeps cache identity consistent
- keeps `cardSet` side references aligned with current content
- prevents the client from generating arbitrary audio unrelated to owned cards

### Shared helper module

Add a new domain module, for example:

- `src/domain/card-audio.ts`

This module should contain pure helpers for:

- converting review-side HTML into plain text
- normalizing text for cache keys
- computing `cacheKey`
- building the effective TTS configuration

It should not contain network or storage logic.

### TTS configuration

For v1, keep configuration fixed on the server:

```ts
type TtsConfig = {
  provider: "elevenlabs"
  locale: string
  voiceId: string
  modelId: string
  outputFormat: "mp3"
}
```

### API route shape

Add one route first:

```txt
POST /api/tts/resolve
```

Suggested file:

```txt
app/api/tts/resolve+api.ts
```

Response:

```ts
type ResolveTtsResponse = {
  assetId: string
  fileUrl: string
  cacheHit: boolean
}
```

The route should be synchronous in v1:

- cache hit: return immediately
- cache miss: generate and return once the asset is ready

This keeps the client simple and avoids polling or background jobs in the first
version.

### Concurrency

Two users may request the same missing audio at the same time.

The implementation should treat `cacheKey` as the dedupe boundary:

- if an asset already exists, reuse it
- if create races happen, the unique `cacheKey` must collapse them
- if a duplicate create occurs, re-read the asset and return the winner
- after resolving the winning asset, update the requesting `cardSet` side
  reference to that asset

### Failure handling

If generation fails:

- do not leave a broken file linked as ready
- return an error response from the route
- optionally persist a failed asset row for diagnostics

The review UI only needs a simple retry action in v1.

### Cleanup model

Shared assets should be deleted by reachability, not by ownership.

An asset is considered active if any `cardSet` references it from:

- `sideATtsAssetId`
- `sideBTtsAssetId`

An asset with no incoming side references is stale and can be cleaned up later,
along with its stored MP3 file.

## Editing After Audio Exists

The selected locale remains the source of truth for a card side.

The attached `ttsAsset` is only a cached rendering of:

- normalized current text
- selected locale
- current model and voice configuration

That means text edits must not silently keep treating the old asset as valid.

### App-side behavior

When a user edits a side after audio already exists:

- keep the selected locale
- clear the side's current asset association in draft state
- clear the side's preview file URL in draft state
- require a fresh generation before preview becomes playable again

The UI should make that state visible. In particular, the preview control should
communicate the difference between:

- no audio configured
- locale selected but no current audio
- audio currently generating
- audio ready to play

The app should unlink stale side associations later on save, but it should not
delete the underlying shared `ttsAsset`. Shared assets remain cache entries and
may still be reusable by other cards or by the same text later.

### Server-side behavior

The resolver must not trust an attached asset just because a file URL exists.

Instead, review playback should:

1. load the current saved text
2. normalize the current text
3. resolve the current locale and voice configuration
4. compute the current cache key
5. only use the attached asset if its `cacheKey` matches the current key
6. otherwise look up a shared asset with the current key
7. relink if a matching shared asset exists
8. generate a new asset if no matching shared asset exists

This makes the attached asset relation a cache hint rather than the source of
truth.

### Why both layers matter

The app-side invalidation gives the user correct edit behavior and clear UI
feedback.

The server-side verification protects review playback from stale associations
that can still exist because of:

- partial save flows where card text save succeeds but asset attach/unlink does
  not
- older saved data created before invalidation existed
- future bugs or manual/admin inconsistencies

The feature should rely on both layers.

## UI

### Review card

Add a play button to the review card UI.

Recommended placement:

- in the card header area near the tag label, or
- as a small icon button within the review card chrome

The button should:

- speak the currently visible side
- disable while the request or playback is active
- show a loading state while generating or downloading
- allow retry after a failure

### Client flow

When the user taps play:

1. call `POST /api/tts/resolve` with `cardId` and `visibleSide`
2. receive a `fileUrl`
3. play the audio from that URL

If the request fails:

- show a lightweight error state
- keep the play button visible
- let the user tap again

### Playback abstraction

Introduce a small client hook or service for review playback, for example:

- `src/hooks/use-review-card-audio.ts`

Responsibilities:

- call the resolve route
- manage loading and error state
- hand the returned URL to the playback library

The review components should stay mostly presentational.

## Infra And Configuration

### Expo API routes

This feature uses Expo API routes as the server boundary.

Required changes:

- add API route files under `app/**`
- configure server output in `app.json`

Suggested `app.json` change:

```json
{
  "expo": {
    "web": {
      "bundler": "metro",
      "favicon": "./assets/favicon.png",
      "output": "server"
    }
  }
}
```

### Environment variables

Expected server environment:

- `INSTANT_APP_ID`
- `INSTANT_APP_ADMIN_TOKEN`
- `ELEVENLABS_API_KEY`

Locale-to-voice and locale-to-model mapping should live in a server-only typed
config module rather than environment variables. Thai uses `eleven_v3`; the
existing locales use `eleven_flash_v2_5`.

Only `EXPO_PUBLIC_*` values may be used on the client. The ElevenLabs key and
Instant admin token must stay server-only.

### Hosting

API routes require a server deployment target. This feature therefore assumes
the app will be deployed with server support rather than as a purely static
client bundle.

## Implementation Plan

1. Add `ttsAssets` to the Instant schema.
2. Add side-specific TTS asset references to `cardSets`.
3. Add storage and namespace permissions for server-managed TTS files.
4. Add a pure domain helper module for text normalization and cache keys.
5. Add Instant admin initialization for API routes.
6. Add `POST /api/tts/resolve`.
7. Make the resolve route update `cardSet` side references when it finds or
   creates the correct asset.
8. Add a client playback hook for review.
9. Add the play button to the review card.
10. Add loading and retry states in review.
11. Add localization copy for playback errors and loading.
12. Verify repeated playback reuses the cached file across sessions and keeps
    side references aligned.

## Next Steps

### Step 1: App-side stale-audio invalidation

- when side text changes, keep the selected locale but clear the draft asset
  and draft file URL for that side
- make the preview control state more explicit so the user can see whether
  audio is ready or needs regeneration
- persist the cleared association when the card is saved

Exit criteria:

- editing text after audio creation disables preview until fresh audio exists
- the selected locale remains visible after text edits
- save unlinks stale side associations without deleting shared assets

### Step 2: Server-side stale-association verification

- update `POST /api/tts/resolve` so it computes the current cache key before
  trusting an attached asset
- only return an attached asset when its `cacheKey` still matches current text
- otherwise relink to a matching shared asset or generate a new one

Exit criteria:

- review playback cannot use stale audio just because an old asset is attached
- attached side assets are treated as cache hints, not as the source of truth

## Open Questions

- Which exact playback library should be used on iOS, Android, and web?
- Should `failed` assets be persisted or should failures remain route-only in
  v1?
- Should the first version use one global locale and voice, or should locale be
  inferred from deck-level configuration later?

## References

- Expo API Routes: https://docs.expo.dev/router/web/api-routes/
- Instant Backend SDK: https://www.instantdb.com/docs/backend
- Instant Permissions: https://www.instantdb.com/docs/permissions
- Instant Storage: https://www.instantdb.com/product/storage
- ElevenLabs Authentication: https://elevenlabs.io/docs/api-reference/authentication
- ElevenLabs Single Use Tokens: https://elevenlabs.io/docs/api-reference/tokens/create
