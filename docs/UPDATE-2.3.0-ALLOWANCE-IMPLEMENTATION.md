# Update 2.3.0 — Allowance foundation implementation notes

**Status:** Draft implementation review. The current branch head has passed the free PostgreSQL 17 compatibility test suite in GitHub Actions, including a Daily Learning runtime smoke test. No production database or live website changes have been made.

## Scope of this step

Implement the approved completion-based allowance foundation for permanent lessons, privacy-minimised lesson practice summaries, and the database foundation for daily activity sessions. The branch also contains the initial Daily Learning page, synced preference controls, curated English activity content, and adaptive revision selection; this remains draft frontend code pending live integration and browser QA.

## Confirmed live-state findings

- `lesson_progress` has a unique row per user/difficulty/lesson, with `in_progress` and `completed` states.
- Inserting a new progress row currently writes a `lesson` row to `learning_activity_log`; this is the current start-based charge.
- A browser-side direct UPDATE currently marks a lesson complete.
- The existing activity-log trigger already checks entitlement server-side, uses the user's stored IANA timezone, and serializes same-user usage with an advisory transaction lock.
- Current plan limits are Free lesson 5 and Premium lesson 12. The approved target is Free 5 and Premium 15.
- The current activity-category constraints allow only `lesson`, `quiz`, and `flashcard`.
- Authenticated users currently have INSERT permission on their own activity-log rows; the new design removes browser INSERT and lets a trusted database trigger write completion events.
- Existing personal testing exemption is checked inside the server-side quota trigger and remains limited to `lesson`.

## Historical activity reconciliation

Read-only verification of the live database found:
- 13 lesson-progress rows, all completed at inspection time.
- 13 lesson activity-log rows and no other activity-log categories.
- Per-user progress/log counts match exactly.
- Chronological pairing by user, using `started_at` and log `created_at`, matched all 13 pairs with a zero-second difference.

The SQL draft therefore adds `event_type` and backfills old lesson rows as completed or started by pairing the existing start log to its progress row. Completed historical rows receive their actual `completed_at` as the event timestamp. The draft aborts if the per-user count or timestamp pairing invariant no longer holds; it will not guess when reconciling data.

This prevents abandoned starts from being counted and preserves completed history. It also avoids accidentally charging a start made on the previous local day when the completion occurs today.

## Proposed database behaviour

The accompanying `UPDATE-2.3.0-ALLOWANCE-MIGRATION-DRAFT.sql` is a review artifact, not yet an executable migration.

1. Add `event_type` = `started` or `completed` to the activity log, with no default so every trusted writer must choose the event type explicitly.
2. Count only `completed` events in the existing server-side quota trigger.
3. Remove the lesson-start charging trigger.
4. Restrict direct lesson-progress INSERTs to `in_progress`; allow transition to `completed` only while the authenticated completion RPC is executing.
5. Add `complete_permanent_lesson(difficulty, lesson_id, topic_id, correct_count, question_count)` as a SECURITY INVOKER RPC. It checks ownership through RLS, serializes per-user completion, updates progress, and lets the database completion trigger insert the quota event and aggregate practice result.
6. Because the progress update and quota insert are in one transaction, quota rejection rolls back completion. Repeated RPC calls return an already completed row without adding another event.
7. Remove direct browser INSERT access to `learning_activity_log`.
8. Preserve the existing plan/entitlement/timezone checks and the private lesson-only exemption.
9. Set permanent lesson limits to Free 5 / Premium 15 and add the four independent daily category rows at Free 1 / Premium 3. Quiz and Flashcard rows remain unchanged.

The RPC is SECURITY INVOKER so owner-scoped RLS remains active for the progress update. The internal trigger function lives in the non-exposed `private` schema and is SECURITY DEFINER only to write the activity event after authenticated ownership has been verified; direct EXECUTE is revoked from browser roles.

## Frontend changes staged on this branch

The `index.html` patch is now staged alongside the SQL review draft:

- `completeLesson()` calls `complete_permanent_lesson(...)` with difficulty, lesson ID, a stable topic ID, first-attempt correct count, and question count; the direct browser-side UPDATE is removed.
- The lesson UI records only an in-memory first-attempt correctness flag per question. The database stores only the aggregate correct/question counts and stable topic ID, never selected answers or raw response data.
- The lesson completion trigger writes the activity event and aggregate practice result in the same transaction. A quota failure rolls both back. Direct browser INSERT access to `lesson_practice_results` is removed, and one aggregate summary per completed permanent lesson is enforced.
- A quota rejection leaves the lesson `in_progress`, preserves the learner's saved progress, and explains that completion can be retried after the local-day reset.
- `loadLessonAllowance()` counts only `event_type = "completed"` records and uses completion-based wording.
- The Profile activity query reads `event_type`, and completion totals count completed events only. The Profile activity categories now include the four approved daily activity types.
- The obsolete start-limit error message has been removed.
- Authentication, account switching, saved-word sync, dictionary search, and other unrelated flows were not intentionally changed.

The frontend is not live-compatible until the database migration and RPC are installed. Do not merge or deploy this branch until the database and browser validation checklist passes. The migration has not been applied to production.

## Free GitHub Actions PostgreSQL compatibility test harness

To avoid any paid Supabase database branch or plan, this branch now includes a GitHub Actions workflow that starts a temporary PostgreSQL 17 service for the duration of a test run. The repository is public, and GitHub documents standard GitHub-hosted runner usage in public repositories as free. The workflow uses no Supabase credentials and does not connect to the production project. The service is destroyed when the job ends.

Files:
- `.github/workflows/update-2-3-0-allowance-test.yml`
- `tests/update-2-3-0/allowance-baseline.sql`
- `tests/update-2-3-0/allowance-assertions.sql`
- `docs/UPDATE-2.3.0-DAILY-ACTIVITY-DATA-DESIGN.md`
- `docs/UPDATE-2.3.0-DAILY-ACTIVITY-MIGRATION-DRAFT.sql`
- `daily-learning.js` (Daily Learning page behaviour and initial curated content)
- `tests/update-2-3-0/test-concurrency.sh`

The test baseline is a minimal Supabase-compatible schema fixture, not a dump of production. It now mirrors the relevant production column types, constraints, foreign keys, plan codes, plan limits, roles, RLS policies, triggers, and `auth.uid()` behaviour needed by this migration. The existing production Free Quiz/Flashcard limits (5) and Premium Quiz/Flashcard limits (12) are included and asserted unchanged. It is useful for PostgreSQL syntax and transaction/permission logic, but it cannot prove compatibility with every Supabase-managed setting or the exact production schema.

**Latest confirmed run:** [GitHub Actions run 42782802321](https://github.com/WhiteWingCat/wordbook/actions/runs/42782802321) — passed on branch head `037592fce0dc199579f535e5083d4eba7e74aed3`. It checked inline/external JavaScript syntax, Daily Learning runtime initialisation with a mocked Supabase client, selection that skips previously completed daily assignments, both SQL drafts on PostgreSQL 17, historical event backfill, Free/Premium limits, unchanged Quiz/Flashcard limits, completion-only charging, start-only events remaining free at a full quota, abandon/resume/replay behaviour, rollback on quota failure, duplicate completion idempotency, direct-write restrictions, lesson-only exemption, independent daily categories, owner-scoped RLS, and concurrent quota-boundary serialization.

The first run exposed a missing authenticated identity in the concurrency test setup. The fixture was corrected, and the subsequent run passed. This was a test-harness setup issue, not a migration failure.

## Validation checklist

- [x] Migration SQL applies successfully to the PostgreSQL 17 compatibility fixture.
- [x] Historical event backfill preserves the fixture's completed and in-progress states.
- [x] Free lesson allowance is 5 and Premium is 15.
- [x] Free daily category limits are 1 each and Premium daily category limits are 3 each.
- [x] A successful first completion consumes exactly one lesson allowance.
- [x] A quota-rejected completion rolls back the progress transition and usage event.
- [x] Duplicate completion retries consume no additional allowance.
- [x] Two concurrent completions at the quota boundary cannot exceed the daily limit in the compatibility test.
- [x] Direct status update to completed and direct activity-log INSERT are denied in the compatibility test.
- [x] The private test exemption remains lesson-only in the compatibility test.
- [x] Aggregate first-attempt practice results are stored atomically with permanent lesson completion.
- [x] Direct browser INSERT into lesson practice results is denied; only one summary per completed lesson is accepted.
- [x] Starting and abandoning a lesson do not consume a completion allowance.
- [x] Premium users can complete exactly 15 permanent lessons in the compatibility test.
- [x] Quiz and Flashcard limits remain unchanged (Free 5 / Premium 12).
- [x] IANA timezone boundary calculations correctly produce 23-hour spring-forward and 25-hour fall-back days.
- [x] Daily categories have independent limits; the exemption does not bypass them.
- [x] Daily session start/resume/abandon/replay and completion RPC flows pass the PostgreSQL compatibility tests.
- [x] Start-only activity events remain uncharged even after the completion quota is full.
- [x] Daily Learning page initialisation renders all four activity cards in the mocked frontend runtime test.
- [x] Daily content selection skips a previously completed assignment when choosing the next daily item.
- [x] Daily preferences default to enabled, and owner-scoped RLS prevents cross-account session reads/updates.
- [ ] Daily reset is validated against the exact Supabase production configuration and a browser using a non-UTC stored timezone.
- [ ] Historical backfill is rechecked against the live production rows immediately before any production migration.
- [ ] Supabase security and performance advisors reviewed after any approved production migration.
- [ ] Existing account switching, saved-word isolation, and unlimited dictionary search still work in browser regression tests.
- [ ] Browser tests pass before the PR is marked ready.

## Legal and privacy check

This step records only the learning activity category, event type, language code, and timestamps already needed for progress/allowance. Practice insights store aggregate correct/question counts and topic identifiers only; they do not store raw answers, typed responses, keystrokes, device fingerprints, precise location, or unrelated behavioural tracking.

**Release legal/privacy gates:**
- The repository currently has no dedicated Privacy Policy or Terms page. Before public release, add a clear notice describing Google/Supabase account data, saved words, learning preferences (including the IANA timezone), lesson progress, completion history, aggregate practice results, purposes, retention, hosting/service providers, and how users can request deletion.
- A deletion route is not implemented. Do not grant browser users direct DELETE access to learning_activity_log: it is also the completion allowance ledger, so deleting current-day events could let a user reset their quota. Design a server-mediated deletion process that removes learning content/results while preserving the current-day quota accounting until its reset, or move quota accounting to a separate minimal ledger.
- Timezone changes are currently user-editable. Before release, decide how to prevent a timezone change from granting a second allowance window (for example, defer the new timezone until the next reset or carry today's usage across the change). This protection is not yet implemented.
- The current seed library contains only 5 Daily Topic, 5 Daily Application, and 6 Daily Discovery entries. A Premium user can request up to 3 completions per category per day; the pools are too small for sustained daily use. Expand and fact-check the content libraries before advertising the full Premium allowance as a sustained learning experience.
- Daily Discovery notes are paraphrased and link to Cambridge Dictionary, British Council, and Wordorigins references. Keep the examples independently authored; do not copy dictionary definitions, exercises, textbook passages, or third-party images. Verify attribution and the applicable source terms before any commercial use.

For Malaysia, review the app's privacy notice and data-handling practices against applicable PDPA obligations before public release or paid subscriptions. This is a practical risk checklist, not legal advice.


## No-cost testing boundary

The GitHub Actions workflow uses standard hosted runners on this public repository. It does not require a paid Supabase branch, Supabase plan upgrade, new Supabase project, paid GitHub runner, or payment method. Do not switch the workflow to a larger runner or connect it to production credentials. The local compatibility checks are an additional safety layer, not a substitute for final review of the real Supabase schema and managed Auth/RLS behaviour.


The latest compatibility fixture was expanded after a read-only production schema review. It now uses the production `bigint` progress ID shape, auth-user foreign keys, the lesson completion-consistency constraint, and the actual Free/Premium Quiz and Flashcard limits. No production data was copied into the fixture.


## Current implementation boundary

The permanent lesson completion and aggregate-result foundation, plus the daily activity preference/session database draft, have passed the free PostgreSQL compatibility suite. The frontend includes the Daily Learning page shell and four activity cards, account-synchronised preference toggles, a first curated set of Daily Topic/Application/Discovery content, and an adaptive Daily Revision selector. Application and Revision save only first-attempt aggregate outcomes; Topic and Discovery are reading activities. The initial content set currently targets English learning, with Chinese explanations shown when Chinese is selected as the translation language. Profile practice insights now display recent aggregate accuracy, number of recent scored attempts, and topics due for review; the due-topic count uses a minimum evidence threshold. Expanded content libraries, broader language support, live browser testing, and live Supabase integration remain outstanding. These drafts are not production migrations, and the frontend is not deployed.


The daily activity content is authored for SwiftDictionary and includes source links for factual Daily Discovery notes. The etymology entry about salary explicitly notes that the popular Roman-soldier salt-pay story is debated. No long third-party passages or textbook exercises are copied. The page is still a draft and has not been deployed.

During this work, the existing browser helper for converting a user's local midnight to UTC was found to ignore the time-of-day offset. It has been corrected to account for hour/minute/second as well as the calendar date. The free CI tests now verify Asia/Kuala_Lumpur and America/Los_Angeles midnight conversions, plus New York spring-forward and fall-back day lengths.
