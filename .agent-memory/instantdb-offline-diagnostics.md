# InstantDB offline diagnostics

FLA-37 used a temporary diagnostics harness in non-production builds. It stored
a durable MMKV event log, recorded transaction IDs/statuses and connection
changes, exposed Q1/Q2/Q3 state, and included a non-retrying Storage probe. The
feature, route, flags, private-SDK observers, MMKV log, and verifier script were
removed after testing at the product owner's request. Recreate purpose-built
instrumentation from the audit evidence only if a deferred case is resumed.

Pending/in-flight mutation counts and reconnect-time mutation errors used
private internals from Instant React Native `0.22.145`; they were best-effort
test instrumentation, never product APIs.

The first instrumented V04 run found that production requires
`cardSets.sideAShowText` and `sideBShowText`. Existing sampled values were all
`true`. The compatibility decision is to retain these deployed attributes,
represent them in the checked schema, and write `true` for new/imported card
sets rather than deleting production fields. The rejected optimistic create
rolled Q2 back cleanly from 11 to 10 when its pending mutation was removed.

A later paired-card run proved atomic server sync for two variants and tags, but
a tag first introduced offline did not appear in the stable Q3 suggestions query
until reconnect. FLA-42 tracks the required durable optimistic/local tag overlay.

In Instant RN 0.22.145, `_pendingMutations()` includes both genuinely queued
mutations and server-confirmed mutations awaiting query/timeout cleanup. Treat
entries with `tx-id` or `confirmed` as confirmed bookkeeping; only entries
without those fields are unconfirmed writes. Diagnostics expose both counts.

Physical two-device conflict runs showed server-acceptance-order last-write-wins
with no conflict metadata. App card edits update both canonical HTML fields, so
a stale offline front-only edit overwrites a newer back-only edit. Concurrent
reviews replace the full absolute schedule, silently losing the earlier grade.
Client-authored `updatedAt` is not a guard because an older value can replay last.
FLA-43 tracks conflict-safe edits/reviews and recovery UX.

The first-profile race cannot be tested by manually disabling networking after
`Bereit zum Lernen` appears: that screen is gated on Q1 already having a valid
profile. V21 needs a diagnostics-only delay/fault-injection point before profile
ensure; do not treat an offline restart after reaching the screen as evidence.
