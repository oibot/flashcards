# TTS Language Selection Feature

## Goal

Make review-card audio use a language and voice that fit the card side being
spoken.

If a card side does not have a configured speech language yet, the first audio
request should ask the user to choose one before any audio is generated.

The first version should not auto-detect the language.

## Scope

In scope:

- store a speech locale per shared card-content side
- ask the user for the locale the first time audio is requested for a side
- pick the voice automatically from that locale on the server
- keep generated audio cached and reusable across users
- keep the existing review play button flow with one extra prompt when needed

Out of scope for the first version:

- automatic language detection
- manual voice selection by the user
- per-user voice preferences
- bulk migration for old cards
- edit-screen language controls
- changing a saved speech language after selection

## Product Decision

The user picks the language.

The system picks the voice.

Reasoning:

- flashcard text is often too short for reliable language detection
- users usually know the intended spoken language, even for short prompts
- asking the user for a voice would add complexity without clear value in v1
- voice choice should stay consistent and curated per language

## Voice Decision

The app should not let arbitrary voice and language combinations through in the
first version.

ElevenLabs multilingual models can synthesize multiple languages with the same
voice, but pronunciation quality depends on how well that voice fits the target
language and region. A voice that sounds natural in English may still speak
Chinese, but it can keep a non-native accent or produce less natural results.

That means:

- the user is not wrong to worry about an English voice for Chinese
- it may work technically
- it is still better for the app to choose a language-appropriate default voice

For v1, voice resolution should be server-side and deterministic:

- locale is stored on the card side
- the server maps that locale to a configured voice profile
- the effective voice profile becomes part of the TTS cache key

## Data Model

Add side-specific speech locale fields to `cardSets`:

```ts
type CardSetTtsLocaleSelection = {
  sideATtsLocale?: string
  sideBTtsLocale?: string
}
```

These fields belong on `cardSets` because:

- the spoken language is a property of the shared content side
- both forward and reverse cards should reuse the same speech setting
- the same content should not require repeated language selection per review row

Keep the existing `sideATtsAsset` and `sideBTtsAsset` references.

No side-specific voice field is needed in v1. Voice should be derived from the
selected locale through server configuration.

No data migration is required for this version because the app is not live yet.
Existing cards can simply have empty locale fields until the user requests
audio for a side.

## Voice Configuration

Introduce a server-side voice catalog:

```ts
type TtsVoiceProfile = {
  locale: string
  voiceId: string
}
```

Suggested behavior:

- exact locale match first, for example `de-DE`
- language-level fallback second, for example `de`
- fail clearly if no voice profile exists for the selected locale

This keeps the decision explicit and reviewable.

The voice catalog can be backed by:

- a static map in code for supported locales
- environment variables for the actual `voiceId` values

Model and output format should remain global server settings, not per-locale
settings.

Example shape:

```ts
const TTS_VOICE_PROFILES = {
  "en-US": {
    locale: "en-US",
    voiceId: process.env.ELEVENLABS_VOICE_ID_EN_US!,
  },
  "de-DE": {
    locale: "de-DE",
    voiceId: process.env.ELEVENLABS_VOICE_ID_DE_DE!,
  },
}
```

Suggested config split:

```ts
type TtsBaseConfig = {
  provider: "elevenlabs"
  modelId: "eleven_flash_v2_5"
  outputFormat: "mp3"
}
```

```ts
type ResolvedTtsConfig = TtsBaseConfig & {
  locale: string
  voiceId: string
}
```

The server resolves `voiceId` from the selected locale, then combines it with
the global model and output settings.

## Supported Languages

The first version should support a focused set of `8` languages, with one
canonical app locale and one configured voice per language.

Supported locales:

- `en-US` English
- `de-DE` German
- `es-ES` Spanish
- `fr-FR` French
- `pt-BR` Portuguese
- `ja-JP` Japanese
- `zh-CN` Chinese
- `ru-RU` Russian

These locales should define:

- which languages appear in the picker
- which `voiceId` values must be configured on the server
- which locale values are accepted by the locale persistence route

If a locale does not have a configured voice, it should not appear in the
picker.

## UX Flow

### Review playback when locale exists

1. User taps play.
2. Client calls `POST /api/tts/resolve`.
3. Server loads the card and resolves the current content side.
4. Server reads the saved side locale.
5. Server resolves the voice profile for that locale.
6. Server returns cached audio or generates new audio as needed.

### Review playback when locale is missing

1. User taps play.
2. Client calls `POST /api/tts/resolve`.
3. Server sees that the content side has no saved locale.
4. Server returns a non-ready response indicating that locale selection is
   required.
5. Client opens a dedicated language picker sheet.
6. User chooses a language.
7. Client persists the language for that content side.
8. Client retries audio resolution automatically.

If the user cancels the sheet:

- no audio is generated
- no locale is stored
- review continues unchanged

## Language Picker UI

The first version should use a dedicated modal sheet, not an alert and not a
compact menu.

Reasons:

- there are too many languages for a small action menu
- the user is completing a missing setup step for audio, not making a quick
  one-off choice
- the sheet gives enough room to explain what is being chosen

The sheet should contain:

- title: `Choose Audio Language`
- short explanation: `Pick the language used to pronounce this side.`
- a short preview of the text that will be spoken
- a plain list of the supported languages
- a `Cancel` action

Language rows should:

- show the language name clearly
- prefer the native language name, with a localized app-language label if
  helpful
- be tappable rows that save immediately when selected

The list should:

- not include search in v1
- not include flags
- not include voice details
- not include an advanced settings path

Behavior:

- tapping a language immediately saves the locale for that content side
- after save, the sheet closes and audio resolution retries automatically
- tapping `Cancel` dismisses the sheet without saving

There is no language-editing escape hatch in v1. Changing the saved speech
language is a future feature.

## API Shape

Keep `POST /api/tts/resolve`, but allow it to return a locale-required state.

Suggested response union:

```ts
type TtsResolveResponse =
  | {
      status: "ready"
      assetId: string
      fileUrl: string
      contentSide: "sideA" | "sideB"
      cacheHit: boolean
    }
  | {
      status: "needs-locale"
      contentSide: "sideA" | "sideB"
      supportedLocales: string[]
    }
```

Add a route to persist the locale selection:

```txt
POST /api/tts/locale
```

Suggested request shape:

```ts
type SetTtsLocaleRequest = {
  cardId: string
  contentSide: "sideA" | "sideB"
  locale: string
}
```

The route should:

1. authenticate the user
2. load the card and related `cardSet`
3. verify the requested locale is supported
4. write the side-specific locale onto the `cardSet`

After that, the client retries `POST /api/tts/resolve`.

## Cache Behavior

The existing cache strategy still works.

The cache key must continue to include:

- normalized text
- locale
- voice ID
- model ID
- output format
- cache version

Because locale and voice remain in the key:

- changing a side's locale naturally points to a different cached asset
- changing the server voice mapping also produces a different cache key
- old assets remain valid shared cache entries

## Failure Handling

If a locale is selected but there is no configured voice profile:

- do not silently fall back to an unrelated voice
- return a clear server error
- log the missing mapping so configuration can be fixed

If a voice profile exists but ElevenLabs rejects generation:

- keep current error handling
- do not clear the saved locale

## Implementation Notes

Likely files to update when implementing:

- `src/db/instant/instant.schema.ts`
- `src/domain/card-audio.ts`
- `src/db/instant/instant-card-store.ts`
- `src/db/instant/instant-utils.ts`
- `src/server/tts/resolve-tts.ts`
- `src/server/tts/instant-tts-assets.ts`
- `src/server/tts/elevenlabs.ts`
- `src/hooks/use-review-card-audio.ts`
- `src/components/review/review-card.tsx`
- `src/app/api/tts/resolve+api.ts`
- `src/app/api/tts/locale+api.ts`

## Implementation Plan

### Step 1: Extend the schema and domain types

- add `sideATtsLocale` and `sideBTtsLocale` to `cardSets`
- extend shared card-set/domain helpers to read and write these fields
- extend TTS response types with `needs-locale`
- add shared types/constants for supported locales

Exit criteria:

- the schema can represent locale selection per content side
- the app has one shared source of truth for the 8 supported locales

### Step 2: Add server-side voice resolution

- introduce locale-based voice resolution on the server
- keep `modelId` and `outputFormat` as global server config
- validate that every supported locale has a configured `voiceId`
- make the resolved locale and `voiceId` part of the effective TTS config

Exit criteria:

- the server can build a complete TTS config from a locale
- unsupported or unconfigured locales fail clearly

### Step 3: Extend TTS resolve flow for missing locales

- load side locale from the `cardSet` during resolve
- if locale exists, continue the current resolve-or-generate flow
- if locale is missing, return `status: "needs-locale"` with the supported
  locale list
- keep the current cache behavior for `ready` responses

Exit criteria:

- first-time audio requests can stop before generation when locale is missing
- existing behavior remains unchanged once a locale is stored

### Step 4: Add locale persistence API

- add `POST /api/tts/locale`
- authenticate the user
- load the card and resolve the current content side
- verify the requested locale is supported
- persist the locale onto the correct `cardSet` side

Exit criteria:

- the client can save a locale for `sideA` or `sideB`
- invalid locale submissions are rejected cleanly

### Step 5: Add the review language picker sheet

- update the review audio hook to handle `needs-locale`
- open a dedicated sheet instead of showing an alert
- show title, explanatory copy, text preview, supported language list, and
  cancel action
- save immediately when a language is tapped
- automatically retry audio after successful save

Exit criteria:

- tapping play on a side without a locale opens the picker sheet
- selecting a language leads directly to playback without another tap

### Step 6: Add copy and localization

- add strings for the sheet title, description, cancel action, and any error
  states
- localize the UI in `en` and `de`
- define the display labels for supported locales

Exit criteria:

- all new user-facing copy comes from localization files
- the sheet is usable in both existing app languages

### Step 7: Verify the end-to-end flow

- verify first play on a side without a locale opens the sheet
- verify cancelling the sheet does not save or generate audio
- verify selecting a language saves the locale and plays audio
- verify second play on the same side does not ask again
- verify front and back sides can have different locales
- verify generated assets are cached per text plus resolved TTS config

Exit criteria:

- the missing-locale flow works end to end
- cached playback still works after locale selection

## Sequencing Notes

Recommended implementation order:

1. schema and shared types
2. additive voice resolution helper
3. `resolve` response changes and switch-over to locale-based config
4. locale persistence route
5. review sheet UI
6. copy/localization
7. manual verification

Compile-safe sequencing note:

- Step 1 should compile on its own.
- Step 2 should be additive. Introduce the locale map and a new
  `resolveTtsConfig(locale)` helper without deleting the current global
  `getTtsConfig()` path yet.
- During this additive step, it is acceptable to keep a temporary legacy
  compatibility path that translates the old global environment variables
  (`ELEVENLABS_VOICE_ID` and `ELEVENLABS_TTS_LOCALE`) into the new
  locale-based voice-profile shape. This shim exists only to keep the
  intermediate implementation compiling and non-breaking while the resolve flow
  still uses the old entry point.
- Step 3 can then switch `resolve-tts` to the new locale-based config and
  return `needs-locale`.
- After the switch-over is complete, remove the temporary legacy shim and rely
  only on the locale-based voice mapping.
- Step 4 should compile on its own after Step 1.
- Step 5 depends on Steps 3 and 4 being present.
- Steps 6 and 7 do not introduce new type coupling.

Because the app is not live yet:

- no migration step is needed
- no backward-compatibility path is needed beyond treating missing locales as
  “ask on first audio request”

## Future Follow-Up

After this ships, language auto-detection can be added as a convenience layer:

- try detection only when no locale is stored
- use it to preselect a suggested language
- keep the picker as the fallback when confidence is low
