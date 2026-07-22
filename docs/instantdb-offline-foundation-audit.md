# InstantDB Offline Foundation Audit and Verification Matrix

Issue: FLA-36  
Parent architecture issue: FLA-34  
Baseline audited: 2026-07-22

## Purpose

This document inventories the app's current local-first behavior and defines the
repeatable physical-device verification work for FLA-37. Results in the matrix
are hypotheses until FLA-37 records observed behavior. This audit deliberately
separates Instant database transactions from Instant Storage uploads.

## Baseline

### Installed Instant packages

| Package | Installed | Latest observed during audit |
| --- | ---: | ---: |
| `@instantdb/react-native` | `0.22.145` | `1.0.51` |
| `@instantdb/react-native-mmkv` | `0.22.145` | `1.0.51` |
| React Native SDK's nested `@instantdb/core` | `0.22.145` | `1.0.51` |
| `@instantdb/admin` | `1.0.11` | not used by client sync |

The React Native client and Admin SDK therefore use different core versions.
FLA-37 must verify the installed React Native version first. An SDK upgrade must
repeat the complete matrix because persistence and auth-change behavior may
change.

### Initialization and persistence

The singleton database is initialized in
`src/features/cards/data/instant/db.ts` with:

- the checked schema;
- the public Instant app ID;
- `@instantdb/react-native-mmkv` as `Store`;
- no explicit `queryCacheLimit`;
- no connection-status or mutation-status observer;
- no app-owned database outbox.

The MMKV adapter creates three app-scoped, multi-process stores:

- `instant-<appId>-kv` for the current user and pending mutations;
- `instant-<appId>-querySubs` for query results;
- `instant-<appId>-syncSubs` for sync-table state.

Inspection of the installed `0.22.145` SDK shows:

- the auth user and refresh token are persisted under `currentUser`;
- optimistic transactions are persisted under `pendingMutations`;
- an offline transaction resolves its returned promise as `enqueued`, while its
  mutation remains queued;
- pending mutations are reapplied over cached query results and resent after an
  authenticated reconnect;
- persistence is throttled by 100 ms and may additionally use an idle callback;
- React Native has no browser `beforeunload` flush guarantee;
- query results have storage GC bounds of one year, 1,000 entries, and one
  million triples, and the ten newest entries are preloaded;
- `queryCacheLimit` defaults to `10` in configuration but is not referenced
  elsewhere by the installed core implementation;
- `queryOnce` rejects immediately when the SDK considers the device offline;
- changing auth clears cached query results in this installed version;
- unlike the inspected newer top-level core, the installed nested core does not
  explicitly clear pending mutations on auth change.

These are implementation observations, not accepted product guarantees. The
100 ms persistence window, query retention, queued-write restart behavior, and
pending-write auth change are mandatory device tests.

Instant's current documentation says `queryCacheLimit` defaults to ten cached
query subscriptions. That statement does not map cleanly to the installed
implementation, so the architecture must not rely on either interpretation
without FLA-37 evidence.

### Authentication

`db.useAuth()` drives the root route guard. On cold start it reads the persisted
Instant user before deciding whether to show authenticated routes. The stored
refresh token is sent when the websocket reconnects.

Expected behavior to verify:

- a previously signed-in user remains in the signed-in UI during an offline cold
  start;
- cached owner-scoped queries are available without re-authenticating online;
- invalid or revoked auth is handled after reconnect without exposing stale
  private data;
- signing out does not allow queued writes from one identity to be sent under a
  later identity.

Creating the per-user `profile` is itself an Instant transaction. Its errors are
logged and swallowed. A first sign-in followed immediately by going offline may
therefore have a signed-in user with a queued or missing profile.

## Query inventory

All current live queries use `db.useQuery`, which is the only Instant query API
in the app intended to serve cached offline data.

| ID | Consumer and purpose | Query shape | Current offline dependency |
| --- | --- | --- | --- |
| Q1 | Root profile guard | One `$users` row by auth ID with `profile` | Must be cached so profile creation is not repeatedly inferred on cold start. |
| Q2 | Review prep, review session, new card, edit card, and single-card lookup | One `$users` row by auth ID with all `cards`; each card includes its `cardSet`, tags, TTS asset links, and file links | This is the canonical full-library cache and is required for all current card UI. |
| Q3 | Tag suggestions in the editor | One `$users` row by auth ID with all `tags`, ordered by title | Must be cached independently from Q2. |
| Q4 | Due-card store API | Top-level `cards` filtered and ordered by `dueAt`, with card set relations | Currently unused by production UI. Its timestamp parameter creates a different query hash as time changes. |
| Q5 | Export | `queryOnce` for the user's card sets, tags, and cards | Online-only by SDK design. Not part of the offline study promise. |
| Q6 | Import preflight | `queryOnce` for imported card-set IDs, tags, and cards | Online-only; import cannot currently run offline. |

### Product-area coverage

| Product area | Current query coverage | Gap or decision for later work |
| --- | --- | --- |
| Offline create | Q2 is mounted even for a new card; Q3 supplies tags. | Card creation itself does not require a fresh `queryOnce`, which is correct. |
| Library and browse | No dedicated library screen exists. Q2 already contains the complete current library. | The first library slice should reuse one stable owner-scoped query instead of introducing per-screen cache keys. |
| Search | No search UI or search query exists. | For MVP-sized libraries, search should initially filter normalized Q2 data locally so the complete result set remains available offline. Server search would require deliberately cached stable query shapes. |
| Editing | Q2 is fetched and then searched by ID in memory; Q3 supplies tag suggestions. | Opening an edit route directly offline depends on Q2 having been cached, not on a per-card query. |
| Dashboard | The current review-prep screen derives all-card and due-card counts locally from Q2. | Future statistics should be derivable from the same cache where practical. |
| Review | Review prep and the active session use Q2. Due filtering and sorting are local. | Q4 is dead code and should not become a dynamic cache-key source without a design change. |
| Backup/restore | Q5 and Q6. | Explicitly online-only today; user-facing copy does not currently explain this prerequisite. |

The current app therefore needs only three stable live query shapes for an
offline cold start: Q1, Q2, and Q3. FLA-37 must prove all three survive a process
restart and query-cache churn.

## Write-path inventory

| Write | Instant operation | Local UI behavior | Error/status behavior |
| --- | --- | --- | --- |
| Ensure profile | Upsert and link one `profiles` row | No visible state | Errors are logged to Sentry and swallowed. |
| Create card | One atomic transaction for tags, card set, owner links, and one or two cards | IDs are returned immediately; optimistic query data should appear; editor closes | `metadataPersisted` resolves for both `enqueued` and `synced`. Errors are caught, logged, and converted to a resolved promise. |
| Edit content/tags | One atomic card-set/tag transaction | Optimistic Q2 update; editor closes | Same swallowed-error and queued-vs-synced ambiguity as create. |
| Grade card | Absolute schedule fields are updated on one card | Session advances immediately | Fire-and-forget. Errors are logged and swallowed. No pending, synced, retry, or failed state reaches UI. |
| Delete card set | Delete the card set; linked cards rely on cascade | Both directions are removed optimistically from the session | Fire-and-forget. Errors are logged and swallowed. |
| Import | Preflight `queryOnce`, then one atomic batch | Loading state until call resolves | Cannot enqueue offline because preflight fails. Server errors reach an alert. Large imports may hit the five-second transaction limit. |
| TTS selection | Card metadata transaction followed by a trusted HTTP API call | Card may close after metadata is accepted | The API is online-only and separate from Instant's optimistic database queue. Feature is disabled in all EAS profiles. |

### Important consequences

1. The app cannot currently tell the user whether a database write is only
   accepted locally, acknowledged by the server, or later rejected.
2. A reconnect-time permission or validation failure can occur after the
   original `db.transact` promise resolved as `enqueued`; the feature-layer
   `catch` is no longer listening.
3. Create and edit intentionally return local IDs immediately, but
   `metadataPersisted` is not a remote-persistence guarantee despite its name.
4. Review and delete have optimistic UX but no recoverable error state.
5. A force quit inside the SDK persistence throttle window could lose a mutation
   unless MMKV has already been written. This must be measured rather than
   assumed.
6. Review scheduling writes all scheduling attributes from the device's current
   card snapshot. Concurrent grades can overwrite each other rather than compose.
7. The active review-session seed, position, reveal state, and reviewed count are
   only module/React memory. A process restart can recover card data but not the
   in-progress session.

## Schema and permission baseline

Current ownership is canonical on `cardSets` and duplicated on `cards` for
owner-scoped top-level queries. Tags and profiles are also linked to `$users`.
Card-set deletion cascades to cards; user deletion cascades through owner links
to profiles, card sets, cards, and tags.

FLA-37 subsequently proved that the deployed schema has required boolean
`cardSets.sideAShowText` and `sideBShowText` attributes that are absent from the
checked schema and all current card-set write plans. All sampled existing server
rows set both values to `true`. This schema drift causes an offline create to be
accepted locally and rejected only when replayed after reconnect.

Current rules restrict those entities to their linked owner, but the audit found
hardening work to verify or design:

- `attrs` is not denied, so a modified client can currently attempt dynamic
  schema creation;
- update rules establish current ownership but do not explicitly require the
  owner link to remain unchanged;
- card creation does not explicitly assert that the linked card set has the same
  owner as the new card;
- `$files` and `ttsAssets` are fully denied to clients, which is suitable for
  server-managed TTS but cannot support user media;
- no user-media entity, ownership link, owner-scoped file path, quota field, or
  cleanup workflow exists yet;
- deleting a `$user` cannot cascade to unlinked Storage objects.

Cross-user reads and writes must be probed before changing these rules. FLA-39
will define the final hardened rules for user media and existing entities.

## Database sync versus media transfer

### Covered by Instant database persistence

Subject to FLA-37 verification, MMKV-backed `useQuery` and `transact` are the
mechanisms for:

- card/card-set text;
- tags and links;
- scheduling updates;
- attachment metadata and links once those entities exist;
- optimistic local state and reconnect replay.

### Not covered by Instant database persistence

`db.storage.uploadFile` is an HTTP file transfer. It does not use the database
pending-mutation queue and the current app has no durable local media outbox.
Generated TTS also uses trusted HTTP routes and remote URLs; its draft state is
in memory and its files are not an offline user-media implementation.

A future attachment must therefore be copied from a picker/camera/recorder URI
into app-owned durable storage before a card points to it. Database metadata can
sync offline, but upload progress, retries, local file retention, download
caching, replacement, and deletion need an explicit app-owned state machine.

## FLA-37 test environment

### Temporary instrumented test build (removed)

FLA-37 used a temporary diagnostics harness in development, simulator, and
preview builds while production remained disabled. The harness was removed from
the app after testing at the product owner's request; recreate purpose-built
instrumentation from this evidence if a deferred case is resumed. It provided:

- start a uniquely identified run and use that run ID in test-card content;
- inspect Instant connection state and the installed SDK versions;
- inspect the best-effort pending and in-flight mutation counts exposed by the
  installed SDK internals;
- verify Q1, Q2, and Q3 availability and capture a durable query snapshot;
- capture generated card-set/card IDs and each transaction's `enqueued` or
  `synced` result;
- retain transaction and reconnect-time mutation errors in a separate MMKV log
  across force quits;
- share the structured JSON evidence log after reconnecting;
- run a disposable Instant Storage upload probe, which is deliberately not
  retried by the app.

The pending-mutation count and reconnect-time error observer used private,
version-specific Instant 0.22.145 internals and were never product APIs. The
companion UUID/file-path verifier was also removed after authoritative evidence
had been recorded in this document and Linear.

### Required clients

- **Device A:** paired physical iPhone `Tobfon`, using a development or preview
  build configured with the same Instant app as Device B.
- **Device B:** iOS simulator, used for concurrent edits and independent cache
  state.
- Both clients signed into the same disposable test account for sync/conflict
  scenarios.
- A second disposable account for cross-user permission probes.
- Access to magic codes for both accounts during setup.
- Instant dashboard or CLI admin access to capture authoritative server state.

Do not run destructive or auth-transition cases against a valuable personal
account. Delete test entities and uploaded probe files after verification.

### Representative seed data

Use unique `FLA37-<run-id>` prefixes so server state and logs can be correlated.
Seed online and wait until both devices show identical values.

1. `BASE-FWD`: one forward card, no tags, due now.
2. `BASE-PAIR`: forward and reverse cards sharing one card set, tags
   `FLA37 Alpha` and `FLA37 Shared`, due now.
3. `EDIT`: recognizable side A/B HTML and tag `FLA37 Before`.
4. `DELETE`: paired card used only for cascade deletion.
5. `GRADE-GOOD`, `GRADE-AGAIN`, and `GRADE-CONFLICT`: known initial schedules.
6. `CONFLICT-SAME`: both clients edit side A.
7. `CONFLICT-DIFFERENT`: Device A edits side A while Device B edits side B.
8. `CACHE`: enough uniquely tagged cards to identify complete versus partial
   query hydration.

Record card-set IDs, card IDs, initial schedule values, and the test user's ID
before disconnecting.

### Evidence to capture for every scenario

- run ID, build profile, app version/commit, device, iOS version;
- installed Instant package versions;
- wall-clock timestamps and action order;
- screen recording or before/after screenshots;
- app/Sentry/Metro logs with Instant verbose logging enabled in the test build;
- connection-status transitions;
- local visible card count and exact affected values;
- authoritative post-reconnect CLI/admin query output;
- whether the transaction call returned `enqueued` or `synced`, when observable;
- duplicates, missing entities, orphan links, permission errors, or rollback;
- cleanup confirmation.

Use a fresh run ID for retries. Do not infer exactly-once behavior from UI alone;
compare IDs and final server values.

## Verification matrix

`Expected` columns below are hypotheses from the current design. FLA-37 must add
an `Observed` result and evidence link for each row.

| ID | Setup | Action | Expected local state | Expected after reconnect | Evidence focus |
| --- | --- | --- | --- | --- | --- |
| V01 | Device A online with all seed data visible | Force quit, relaunch online | Auth and Q1/Q2/Q3 hydrate; cards remain complete | Server refresh does not flicker to empty or duplicate data | Cold-start timeline and counts |
| V02 | V01 completed, then enable airplane mode before launch | Force quit and cold-start offline | Persisted auth opens the app; all cached cards and tags are browsable; edit routes resolve from Q2 | Values converge without disappearing | Auth state, Q1/Q2/Q3 availability |
| V03 | Signed in and cached | Remain offline past app background/foreground and relaunch | Session remains signed in without requesting a code | Existing refresh token authenticates or produces an explicit signed-out state | Auth and route transitions |
| V04 | Offline with Q2 cached | Create one forward card without tags | Card appears immediately and survives navigation | Exactly one card set and one card exist with owner links | Local ID versus server ID |
| V05 | Offline with Q2/Q3 cached | Create a paired card with one existing and one new tag | Both variants and tags appear immediately and survive navigation | One shared card set, two cards, normalized unique tags, no duplicates | Atomicity and lookup replay |
| V06 | Offline with `EDIT` cached | Change both HTML fields; add/remove tags; save | Both variants display canonical updated content and tags | One atomic final card-set/tag state | Canonical forward/reverse mapping |
| V07 | Offline with known schedule | Grade `GRADE-GOOD`, background, then reopen prep | Schedule and due count update optimistically | Server has one expected absolute schedule update | Full schedule fields and count |
| V08 | Offline with paired `DELETE` card | Delete from an active review session | Both variants disappear from session and prep | Card set and both cards are absent; no dangling links | Cascade and optimistic removal |
| V09 | Offline and cached | Create/edit/grade, then force quit immediately at delays of 0 ms, 50 ms, 150 ms, and 500 ms | Each action either survives cold start or exposes a clear persistence boundary | Every surviving local mutation syncs once | MMKV throttle loss window |
| V10 | Offline queue containing V04-V08 operations | Relaunch offline, inspect, then disable airplane mode | Pending optimistic state is reconstructed before reconnect | All operations arrive once and in original order; no rollback after refresh | Queue replay/order and final server query |
| V11 | Online test build able to mount more than ten stable query hashes | Populate Q1/Q2/Q3, churn at least twelve other queries, force quit, then cold-start offline | Required Q1/Q2/Q3 still load despite cache churn | No effect beyond normal refresh | Documented limit versus installed implementation |
| V12 | Signed-in cached device | Revoke/sign out the session remotely, cold-start offline, then reconnect | Private cached data remains device-local while offline | App signs out or reports auth failure and does not expose data to another account | Token invalidation and cache clearing |
| V13 | Disposable account A has pending offline writes | Sign out if UI permits offline; sign in as account B after reconnect | Account A optimistic data must not appear as B's data | A writes are either safely sent as A before logout or explicitly discarded; never sent as B | Installed SDK auth-change risk |
| V14 | A and B online on `CONFLICT-SAME` | Disconnect A; A saves side A value `A`; B saves side A value `B`; reconnect A | A keeps its optimistic value until reconciliation | Record the actual deterministic winner and whether either client receives conflict metadata | Same-attribute conflict semantics |
| V15 | A and B start from `CONFLICT-DIFFERENT` | Disconnect A; A edits side A; B edits side B; reconnect A | A locally shows its side A plus cached old side B | Determine whether attribute-level updates preserve both changes | Non-overlapping attribute merge |
| V16 | Both devices show `GRADE-CONFLICT` initial schedule | A and B grade differently as close together as possible, including one offline | Each device advances immediately using its snapshot | Record winner and final schedule; confirm no accidental composed/double grade | Scheduling conflict UX requirement |
| V17 | Account A owns test entities; account B knows their UUIDs | As B, query/update/delete A's card set, card, tag, and profile using CLI user context | No A data is returned or modified | A's data remains unchanged | Permission diagnostics per operation |
| V18 | Test build with a disposable local file and temporary owner path | Offline, call `db.storage.uploadFile`; restart; reconnect without app retry | Upload fails and no durable pending upload appears | No automatic upload and no orphan `$files` row | Prove Storage is outside DB queue |
| V19 | Cached cards and valid backup file; offline | Attempt export and import | Both fail cleanly because Q5/Q6 use `queryOnce`; existing cards remain unchanged | No delayed import/export side effects | Online-only boundary and copy need |
| V20 | Active review session after at least one grade; offline | Force quit and relaunch app | Card schedule persists if V07 succeeds, but session position/count are lost | Schedule syncs; no promise of session resumption | Separate data durability from UI session durability |
| V21 | New disposable user signs in online and immediately loses network | Force quit before/after profile transaction, cold-start offline | Signed-in route loads; profile query does not loop or block cards | Exactly one owned profile exists after reconnect | First-session profile race |
| V22 | Offline with a queued transaction, then network returns briefly and drops | Flap connectivity several times during upload/replay | Optimistic state remains stable | One server result, no duplicates, queue eventually drains or exposes failure | Idempotency under reconnect flapping |

## FLA-37 observed results

Run `PHYSICAL-1` uses the installed standalone Flashcards 1.0.0 (build 2) on
physical device `Tobfon`. Its evidence is the tester's contemporaneous report.
Runs `INSTRUMENTED-1` through `INSTRUMENTED-7` use Flashcards 1.0.0 (build
1), Instant React Native and MMKV `0.22.145`, and iOS 16.7.16 on physical device
`TestFon`. Their run IDs are `FLA37-20260723T070022.390Z`,
`FLA37-20260723T073816.687Z`, `FLA37-20260723T075218.228Z`,
`FLA37-20260723T080035.791Z`, `FLA37-20260723T080633.371Z`,
`FLA37-20260723T081212.654Z`, and `FLA37-20260723T082212.292Z`; evidence is the
durable diagnostics logs plus authoritative admin queries by generated UUID or
Storage path. `INSTRUMENTED-2` and later include the FLA-41 compatibility fix;
`INSTRUMENTED-7` distinguishes unconfirmed writes from confirmed cleanup records.
The two-device `CONFLICT-1` run uses TestFon run
`FLA37-20260727T121206.971Z` and Tobfon run `FLA37-20260727T121215.902Z`.
`CONFLICT-2` uses TestFon run `FLA37-20260727T123833.130Z` and Tobfon run
`FLA37-20260727T123809.730Z`. `CONFLICT-3` uses TestFon run
`FLA37-20260727T125233.644Z` and Tobfon run `FLA37-20260727T124441.626Z`.
Combined restart/session run `COMBINED-1` uses TestFon run
`FLA37-20260727T130722.329Z`. Restart/flapping run `COMBINED-2` uses TestFon
run `FLA37-20260727T132149.790Z`.

| Matrix ID | Observed result | Status | Remaining evidence |
| --- | --- | --- | --- |
| V01 | In `COMBINED-1`, an online force quit from a stable 12-card/six-tag state relaunched signed in, transitioned from connecting to authenticated in about 1.2 seconds, and restored Q1/Q2/Q3 without empty or duplicate counts. | Pass | Repeat as routine cold-start regression coverage. |
| V02 | `PHYSICAL-1` retained the signed-in route and due count. In `INSTRUMENTED-1`, an offline cold start reconstructed the signed-in user, Q1 profile, 11 Q2 cards including the optimistic card, five Q3 tags, and one pending mutation. | Pass on two physical devices for persisted auth and required Q1/Q2/Q3 data | Card-content browsing should still be checked once a library UI exists. |
| V03 | Both physical runs retained the signed-in route offline without requesting a magic code. | Partial pass | Background/foreground duration and successful reconnect authentication were observed separately; the product owner stopped the remaining long-duration edge case. |
| V04 | In `INSTRUMENTED-1`, an offline forward-only create moved Q2 from 10 to 11 cards, returned `enqueued`, survived restart, and then rolled back to 10 when production rejected missing required compatibility attributes. After FLA-41, `INSTRUMENTED-2` repeated the flow: the create returned `enqueued` after 39 ms, Q2 remained at 11 after restart and reconnect, no mutation error occurred, and the exact generated card-set/card UUIDs each existed once on the server with both compatibility booleans set to `true`. | Pass after FLA-41 | Repeat as part of any Instant SDK upgrade qualification. |
| V05 | In `INSTRUMENTED-3` (`FLA37-20260723T075218.228Z`), an offline paired-card create with one existing and one new tag returned `enqueued` after 66 ms and moved Q2 from 11 to 13 cards. Q3 incorrectly remained at five tags while offline, then moved to six only after reconnect. No mutation error occurred. Exact admin queries found one card set, exactly two cards with forward/reverse variants, and exactly the intended existing/new tag links. The mutation-map count moved from two to one after confirmation, distinguishing the retained older confirmed entry from this completed write. | Partial fail: atomic paired-card/tag server sync passes; newly created tag is absent from offline Q3 suggestions | Track an implementation requirement for an optimistic/local tag overlay and rerun offline tag availability across restart. |
| V06 | In `INSTRUMENTED-5`, editing a cached card offline changed both text sides and replaced its tag selection with the existing `V05` tag. The transaction returned `enqueued` after 64 ms while Q2/Q3 remained stable at 13/6. Reconnect produced no mutation error; exact admin queries showed the expected HTML on both sides, exactly the intended tag link, the same card/card-set IDs, and unchanged scheduling fields. | Pass | Repeat with a force quit after edit when testing tighter persistence boundaries. |
| V07 | In `INSTRUMENTED-7`, grading a cached review card `good` offline returned `enqueued` after 70 ms and produced one unconfirmed mutation. The exact previous and expected next schedules were logged. The unconfirmed mutation and Q2 count survived force quit/offline cold start; after reconnect it moved to confirmed with zero unconfirmed and zero in-flight writes. Exact admin state matched every expected next field: due/review timestamps, five-day interval, 1.45 ease, repetition four, three lapses, and `review` state. | Pass | Repeat for the other grades as scheduler regression coverage, not as an offline-queue prerequisite. |
| V08 | In `INSTRUMENTED-6`, deleting the previously verified card offline returned `enqueued` after 70 ms and moved Q2 from 13 to 12 while Q3 remained six. Reconnect retained Q2 at 12 without a mutation error. The mutation-map count moved from two to one, showing the newly queued delete confirmed while the prior update entry awaited cleanup. Exact admin queries returned no card set and no card for the deleted UUIDs. | Pass | Repeat with a paired card set if cascade-delete behavior changes. |
| V09 | Queued creates and reviews survived force quits at human-scale delays ranging from about five seconds to more than one minute and were reconstructed on cold start. | Partial pass | The product owner stopped the 0 ms, 50 ms, 150 ms, and 500 ms edge cases; deterministic coverage would require process-level fault injection rather than inaccurate manual timing. |
| V10 | `INSTRUMENTED-2` reconstructed the optimistic Q2 result and mutation after offline relaunch, then produced exactly one server card set and card after reconnect without rollback. The private SDK mutation map still had one entry after server confirmation even though in-flight count was zero and authoritative state was present; in this SDK, confirmed entries can remain until query processing cleanup and must not be presented as unsent writes. `INSTRUMENTED-7` directly confirmed this distinction: its review changed from one unconfirmed entry before restart/reconnect to zero unconfirmed and one confirmed entry after server acceptance. | Pass for restart, replay, exactly-once server state, and queue-state interpretation | Preserve the confirmed/unconfirmed distinction in any future user-facing sync design. |
| V11 | The required Q1/Q2/Q3 queries repeatedly survived the tested online/offline cold starts, but the deliberate twelve-plus-query hash churn case was not run. | Deferred by product decision; not passed | A diagnostics-only query-churn harness is required if cache-eviction qualification becomes necessary. |
| V12 | The product owner chose not to run the disposable-account remote-revocation flow during this verification session. No physical evidence was collected. | Deferred by product decision; not passed | Qualify remote token revocation and private-cache behavior before account safety is declared launch-ready. |
| V13 | The product owner chose not to run the disposable-account pending-write/auth-change flow during this verification session. No physical evidence was collected. | Deferred by product decision; not passed | Qualify account switching with queued writes before multi-account safety is declared launch-ready. |
| V14 | In controlled two-device run `CONFLICT-1`, both devices cached the same card and independently edited the same front side while explicitly `closed`. TestFon queued `V14-2 TestFon`; Tobfon queued `V14-2 TobFon`. Reconnecting TestFon first changed authoritative HTML to its value. Reconnecting Tobfon second changed the same full card-set field to its value. Both devices then displayed `V14-2 TobFon`. Neither client reported a mutation error or conflict. | Pass: server acceptance order determines the winner; both accepted writes are silent, whole-field last-write-wins | User-facing sync design cannot promise conflict detection for concurrent text edits without app-owned revisions/history. |
| V15 | In `CONFLICT-3`, TestFon cached the same Thai card and queued a front-only user edit while offline. Tobfon then changed only the back while online; authoritative state correctly contained the original front plus `V15 Back Tobfon`. When TestFon replayed later, authoritative state became `V15 Front TestFon` plus TestFon's stale original Thai back. Both writes were accepted. The app's edit transaction updates both canonical HTML attributes, so the logically non-overlapping edits are a full card-set overwrite rather than an attribute-level merge. The final client-authored `updatedAt` was also older than Tobfon's overwritten value, confirming acceptance order is independent of that field. | Fail merge expectation: a stale offline editor silently clobbers a concurrent change to the other side | Add app-owned conflict detection/recovery or narrower dirty-field transactions before promising safe concurrent editing. |
| V16 | In controlled two-device run `CONFLICT-2`, both devices started from the same learning schedule and graded the same card while explicitly offline. TestFon queued `again`; Tobfon queued `good`. Reconnecting TestFon first produced the exact expected `relearning` schedule (interval zero, ease 2.15, repetition zero, lapses one). Reconnecting Tobfon second replaced every scheduling field with its independently calculated `review` schedule (interval three, ease 2.35, repetition two, lapses zero). Both writes were accepted without conflict feedback. | Pass: scheduling updates are full-object, acceptance-order last-write-wins; one legitimate review is silently lost | Define whether concurrent grading needs revisions, review events, or an explicit documented limitation before launch. |
| V17 | A disposable account B queried account A's known `$users`, profile, card-set, card, and tag UUIDs through production user context; every result count was zero. Permission-engine simulations for update and delete on the profile, card set, card, and tag all returned `all-checks-ok? = false`. Authoritative admin counts remained exactly one for every A entity afterward. The disposable B user was deleted. | Pass | Repeat whenever ownership links or production permission rules change. |
| V18 | In `INSTRUMENTED-4`, an offline Storage upload failed after 40 ms with `The Internet connection appears to be offline.` The failure log survived force quit, but reconnect authenticated with no retry, no Storage completion event, and no database mutation in flight. An exact authoritative `$files.path` query returned no row. | Pass: Storage is not covered by the database transaction queue | Product media work must supply its own durable retry state and user feedback. |
| V19 | The product owner confirmed that import/export is development-only at this stage and does not require current physical-device qualification. | Justified exclusion from FLA-37 | Run the offline boundary case when import/export becomes a supported user-facing feature. |
| V20 | In `COMBINED-1`, a `hard` grade queued offline during an active review. Force quitting without closing the session and relaunching offline returned to `Bereit zum Lernen`, so session position/count were intentionally not restored. The one unconfirmed schedule mutation and Q2 data did survive. Reconnect confirmed it, and authoritative state exactly matched the logged two-day interval, 2.2 ease, repetition two, zero lapses, and `review` state. | Pass with documented UI boundary: card data is durable; in-progress session navigation is not | Treat restart-to-prep as intended unless resumable sessions become a product requirement. |
| V21 | The proposed manual flow was rejected as invalid: the app does not expose `Bereit zum Lernen` until Q1 has a valid profile, so a human cannot disable networking between auth success and the profile transaction by reacting to that screen. Testing after the screen appears only proves an already-created profile persists. | Deferred by product decision; not passed | A diagnostics-only delay/fault-injection hook is required to test both sides of the auth/profile persistence boundary. |
| V22 | In `COMBINED-2`, a new offline card remained visible with one unconfirmed mutation across force quit and offline cold start. During reconnect it reached authenticated/in-flight, then the network closed two seconds later; by closure the write was confirmed with zero unconfirmed mutations. A later stable reconnect retained Q2 at 13 with an empty queue. Exact UUID queries found one card set and one card, with no duplicate or mutation error. | Pass for replay interrupted immediately after confirmation and subsequent reconnect idempotency | A transport-level fault injector would be required to deterministically cut the socket before the confirmation response. |

## Closure assessment

The product owner stopped the remaining large edge cases after the core physical
verification was complete. V03, V09, V11-V13, and V21 remain explicitly partial
or deferred and must not be represented as passed. The verified core covers
physical offline cold start, create/edit/delete/review, durable queued replay,
exactly-once UUID state, reconnect interruption, two-device conflicts, ownership
permissions, and the separate Storage failure boundary. FLA-42 and FLA-43 own
the unsupported offline-tag and conflict-recovery promises. This accepted scope
variance allows FLA-37 to close as an evidence-gathering task without implying
that the deferred edge cases were qualified.

## Original exit criteria for FLA-37

The original plan stated that FLA-37 was complete only when:

- every matrix row has observed results or a documented, justified exclusion;
- V02, V04-V10, V14-V16, V18, V21, and V22 are run on the physical iPhone;
- the authoritative server state confirms exactly-once IDs and final values;
- the installed SDK version and any upgraded candidate version are not mixed in
  one result set;
- unsupported product promises become explicit implementation issues;
- reconnect-time failures have a defined user-facing recovery requirement;
- database conclusions are not generalized to Storage uploads.

## Sources

- Instant React Native persistence: https://www.instantdb.com/docs/start-rn
- Instant initialization and query cache: https://www.instantdb.com/docs/init
- Instant queries and offline `queryOnce` behavior:
  https://www.instantdb.com/docs/instaql
- Instant transactions: https://www.instantdb.com/docs/instaml
- Instant Storage and React Native uploads:
  https://www.instantdb.com/docs/storage
- Instant permissions: https://www.instantdb.com/docs/permissions
- Installed package source inspected under
  `node_modules/@instantdb/react-native/node_modules/@instantdb/core/src/Reactor.js`
  and `node_modules/@instantdb/react-native-mmkv/src/index.ts`
