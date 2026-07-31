# Deterministic tag identity

Tags use a deterministic UUIDv5 derived from the normalized `ownerTitle`
(`userId:normalizedTitle`) and the fixed `com.tobio.flashcards.tags` namespace.
All tag creation, linking, unlinking, updates, and imports must use that direct ID.
Keep `ownerTitle` unique as an integrity constraint.

This is required for offline behavior in Instant React Native 0.22.145. Its
optimistic store drops triples for a first-ever unresolved lookup reference, so
lookup-based tag writes do not expose a new tag until server confirmation.
Direct deterministic IDs make the canonical tag and links available to Instant's
persisted optimistic graph without a parallel application-owned store, and two
offline devices derive the same ID.

Tag normalization is part of the durable identity contract: NFC Unicode
normalization, normalized whitespace, and locale-independent casing. Changing
the namespace or normalization after release requires a data migration.

The app was pre-release when this identity was introduced, so no migration from
old random-ID development tags was created. Existing development data must be
reset before testing deterministic writes.
