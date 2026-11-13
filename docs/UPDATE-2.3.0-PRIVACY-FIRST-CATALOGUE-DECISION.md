# Update 2.3.0 — Privacy-first content validation decision

**Decision:** The owner selected the privacy-first approach for practice-result integrity on 13 November 2026.

## Product and privacy boundary

- SwiftDictionary stores aggregate practice results only: correct count, question count, stable topic identifier, difficulty and attempt timestamp.
- Individual selected answers, raw question responses, typed text, keystrokes and per-question event logs are not stored.
- Aggregate accuracy is self-reported by the browser and is not cryptographic proof of mastery. A technically capable user may manipulate the submitted counts.
- These aggregates are used for personal progress displays and adaptive revision only. They must not be treated as identity verification, certification, eligibility, billing evidence or other high-stakes proof.
- No new analytics or answer-level telemetry is introduced by this design.

## Private approved content catalogue

The new review migration `docs/UPDATE-2.3.0-CONTENT-CATALOG-MIGRATION-DRAFT.sql` creates `private.learning_content_catalog`. It stores only stable content identifiers and their approved metadata:

- Activity type.
- Content ID.
- Topic ID where applicable.
- Difficulty where applicable.
- Learning language code.
- Active/inactive status.

The current snapshot contains 95 approved English content entries:

| Type | Entries |
|---|---:|
| Daily Topic | 28 |
| Daily Application | 25 |
| Daily Discovery | 27 |
| Permanent lessons | 15 |
| **Total** | **95** |

No question text, answer options, correct answers or learner responses are copied into the catalogue.

The table has RLS enabled and no client SELECT grants or policies. The validator is in the non-public `private` schema. Browser roles cannot read the catalogue directly.

## Server-side checks

- New permanent lesson progress rows must reference an active approved lesson ID and difficulty.
- Permanent lesson completion and historical replay-summary RPCs must provide the exact topic mapping for that lesson.
- Daily session creation validates activity type, content ID, topic, difficulty, saved learning language and source.
- Adaptive Revision IDs must follow the generated revision identifier format and resolve to an active Daily Application item with the same topic, difficulty and language.
- The user's stored learning language is authoritative. The current daily content catalogue is English-only, so the current Daily Learning experience remains unavailable when the learning course is not English.
- The existing per-user transaction lock and completion-based quota rules remain in force.

The catalogue is an allowlist, not a content store. Whenever learning content is added, removed, renamed or remapped, its catalogue migration must be reviewed and updated in the same release. Release validation must compare the frontend's stable IDs and metadata with the approved catalogue.

## Test-only content

`tests/update-2-3-0/content-catalog-test-fixtures.sql` contains synthetic IDs used by disposable SQL/concurrency tests. It must only run in test databases and must never be applied to hosted production Supabase.

`tests/update-2-3-0/content-catalog-assertions.sql` checks catalogue counts, client access restrictions, valid and invalid mappings, adaptive revision source validation, and rejection of a forged topic through the actual Daily Learning start RPC.

## Release interpretation

This design provides server-side validation of *which content/topic combination* a session or lesson may reference. It does not verify that a learner actually selected the correct answers. Adaptive Revision should therefore describe its signals as practice history / self-reported performance, not verified competence.

The migration remains a review draft on the Update 2.3.0 development branch. It has not been applied to the production Supabase project. No merge or deployment is authorised by this decision.
