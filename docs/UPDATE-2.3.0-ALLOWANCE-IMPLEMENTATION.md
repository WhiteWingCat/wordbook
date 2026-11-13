# Update 2.3.0 — Allowance foundation implementation notes

**Status:** Draft implementation review. The earlier allowance foundation passed its PostgreSQL 17 and browser baseline. Subsequent privacy-first catalogue validation and authenticated Daily Learning browser tests have been added and are undergoing fresh CI validation; do not treat the latest branch head as release-validated until that run passes. No production database or live website changes have been made.

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

**Latest confirmed run:** [GitHub Actions run 42783459140](https://github.com/WhiteWingCat/wordbook/actions/runs/42783459140) — passed on branch head `ecafaf6b190d104acdc45afe226c6222b2adb8a9`. It checked inline/external JavaScript syntax, Daily Learning runtime initialisation with a mocked Supabase client, selection that skips previously completed daily assignments, clear free-replay messaging when a content pool is exhausted, both SQL drafts on PostgreSQL 17, historical event backfill, Free/Premium limits, unchanged Quiz/Flashcard limits, completion-only charging, start-only events remaining free at a full quota, abandon/resume/replay behaviour, rollback on quota failure, duplicate completion idempotency, direct-write restrictions, lesson-only exemption, independent daily categories, owner-scoped RLS, concurrent permanent-lesson quota serialization, and concurrent duplicate daily completion requests producing exactly one event.

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
- [x] Timezone changes preserve the previous allowance timezone until its next local midnight; repeated changes cannot move that boundary or grant another daily completion in the PostgreSQL compatibility test.
- [x] Daily categories have independent limits; the exemption does not bypass them.
- [x] Daily session start/resume/abandon/replay and completion RPC flows pass the PostgreSQL compatibility tests.
- [x] Start-only activity events remain uncharged even after the completion quota is full.
- [x] Daily Learning page initialisation renders all four activity cards in the mocked frontend runtime test.
- [x] Daily content selection skips a previously completed assignment when choosing the next daily item.
- [x] An exhausted curated pool is labelled as a free replay rather than implying another completion can be charged.
- [x] Concurrent duplicate daily completion requests are idempotent and write exactly one completion event.
- [x] Daily preferences default to enabled, and owner-scoped RLS prevents cross-account session reads/updates.
- [x] Expanded curated content pools meet the initial minimum size, contain unique IDs, include required Chinese translations, and cover all 13 lesson topic IDs.
- [x] Daily Application questions have valid answer indexes and explanations in the frontend content validation test.
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
- Timezone changes remain user-editable, but the allowance timezone is now server-protected: a change is deferred until the current allowance day ends in the previous timezone. Repeated changes preserve the original pending boundary, and clients cannot forge or extend the server-owned override. The database quota trigger, Daily Learning session RPC, lesson allowance display, Daily Learning display, and Profile daily statistics use the same effective timezone. This is covered by PostgreSQL regression tests; live Supabase and cross-browser verification remain release gates.
- The curated English library has been expanded to 28 Daily Topic entries, 25 Daily Application sets (each with two scored questions), and 27 Daily Discovery entries. This provides at least eight days of distinct curated content at the Premium limit of three completions per category per day, before replay is needed. Content is mapped to all 13 stable lesson topic IDs for adaptive revision. These are initial pools, not an indefinite content supply; continue editorial expansion before promising ongoing novelty.
- Daily Discovery notes are paraphrased and link to Cambridge Dictionary, British Council, and Wordorigins references. Keep the examples independently authored; do not copy dictionary definitions, exercises, textbook passages, or third-party images. Verify attribution and the applicable source terms before any commercial use.

For Malaysia, review the app's privacy notice and data-handling practices against applicable PDPA obligations before public release or paid subscriptions. This is a practical risk checklist, not legal advice.


## No-cost testing boundary

The GitHub Actions workflow uses standard hosted runners on this public repository. It does not require a paid Supabase branch, Supabase plan upgrade, new Supabase project, paid GitHub runner, or payment method. Do not switch the workflow to a larger runner or connect it to production credentials. The local compatibility checks are an additional safety layer, not a substitute for final review of the real Supabase schema and managed Auth/RLS behaviour.


The latest compatibility fixture was expanded after a read-only production schema review. It now uses the production `bigint` progress ID shape, auth-user foreign keys, the lesson completion-consistency constraint, and the actual Free/Premium Quiz and Flashcard limits. No production data was copied into the fixture.


## Current implementation boundary

The permanent lesson completion and aggregate-result foundation, plus the daily activity preference/session database draft, have passed the free PostgreSQL compatibility suite. The frontend includes the Daily Learning page shell and four activity cards, account-synchronised preference toggles with safe network-error rollback, a first curated set of Daily Topic/Application/Discovery content, and an adaptive Daily Revision selector. Daily content selection avoids previously completed assignments where new material remains and labels exhausted content as a free replay. Application and Revision save only first-attempt aggregate outcomes; Topic and Discovery are reading activities. The initial content set currently targets English learning, with Chinese explanations shown when Chinese is selected as the translation language. Profile practice insights now display recent aggregate accuracy, number of recent scored summaries, and topics due for review; the due-topic count uses a minimum evidence threshold. Further content growth, native Simplified Chinese learning activities (the current Chinese support is translation text only), live browser testing, and live Supabase integration remain outstanding. These drafts are not production migrations, and the frontend is not deployed.


The daily activity content is authored for SwiftDictionary and includes source links for factual Daily Discovery notes. The etymology entry about salary explicitly notes that the popular Roman-soldier salt-pay story is debated. No long third-party passages or textbook exercises are copied. The page is still a draft and has not been deployed.

During this work, the existing browser helper for converting a user's local midnight to UTC was found to ignore the time-of-day offset. It has been corrected to account for hour/minute/second as well as the calendar date. The free CI tests now verify Asia/Kuala_Lumpur and America/Los_Angeles midnight conversions, plus New York spring-forward and fall-back day lengths.


## Curated content expansion — 2026-11-10

The Daily Learning draft now contains:
- 28 Daily Topic reading entries across beginner, intermediate and advanced material.
- 25 Daily Application sets, each containing two scored questions, answer explanations and Simplified Chinese translations.
- 27 Daily Discovery entries covering grammar, usage, vocabulary, word formation, idioms, writing and common mistakes.
- Stable topic mappings for all 13 lesson topic identifiers so Daily Revision can select content for each existing lesson area.
- A frontend CI check for minimum pool size, unique IDs, required metadata, Chinese translation presence, valid answer indexes and topic coverage.

The learning explanations, examples and questions are independently authored for SwiftDictionary. Discovery entries include reference links where an external grammar or usage claim is useful; links are references for further reading, not permission to reproduce the linked publisher's content. The salary etymology entry retains an explicit uncertainty note. Before any future paid distribution or substantial reuse of third-party materials, review source terms, licensing and attribution requirements. The content is English learning with Chinese translations; a native Chinese learning curriculum is not included in this expansion.

The expanded pools provide at least eight days of distinct curated content at the proposed Premium rate of three completions per category per day (the smallest pool is 25). This is a practical initial buffer, not an unlimited content pipeline.


## Adaptive Daily Revision review — 2026-11-10

The revision selector was strengthened and covered by deterministic regression fixtures:

- Practice rows with missing/invalid timestamps, non-integer counts, zero questions, negative correct counts, or correct counts above the question total are ignored rather than influencing mastery.
- The selector still uses the three most recent valid aggregate attempts and the existing 1/3/7/14-day interval bands.
- Weak-topic status still requires at least two attempts and six questions, and now also requires the latest attempt to remain below 70%. A clear latest-attempt recovery (at least 80% and at least 20 percentage points above the previous attempt(s)) suppresses the weak label while the rolling accuracy and due interval continue to be tracked.
- Overdue topics are ranked by how far past their interval they are, after weak-and-due topics receive the highest priority. Strong but overdue topics remain due without being mislabeled weak.
- Topics already completed in Daily Revision today remain excluded.
- Revision content IDs now encode the selected application-set ID. The selector rotates through unused application sets for that topic before replaying earlier material, and resumed sessions recover the matching content set from the session ID.
- Added deterministic tests for weak-topic priority, overdue-but-not-weak topics, recent improvement, minimum evidence, same-day repeat prevention, and malformed history.

The GitHub Actions run for commit `e7a6f66209b410ef219b8f57d446fc29706c981e` passed: [run #42792996028](https://github.com/WhiteWingCat/wordbook/actions/runs/42792996028). This validates the frontend syntax/integration checks and the existing PostgreSQL 17 migration, RLS, allowance, and concurrency suite. It does not replace live browser testing or a live Supabase integration test. No production database or deployment was changed.


## Timezone-change protection — 2026-11-10

The allowance migration draft now adds two server-managed fields to `user_preferences`:

- `allowance_timezone`: the timezone that continues to govern the current allowance window after a user changes their preferred timezone.
- `allowance_timezone_until`: the exact UTC instant of the next midnight in that previous timezone.

A database trigger owns these fields. On a timezone change it freezes the previous timezone through its next local midnight. Additional timezone changes before that instant do not move the boundary. Attempts by an authenticated client to set, clear, or extend the override are overwritten by the trigger. After the boundary expires, the newly preferred timezone is used; a later change starts a new deferred transition.

The lesson-completion quota trigger and Daily Activity session-start RPC both calculate usage with the effective timezone. The frontend reads the same server-owned fields for the Daily Learning page, lesson allowance card, and Profile's today-activity statistic. The Profile explains that a saved timezone change takes effect after the current allowance day ends.

Regression coverage verifies:
- The first timezone change preserves the old timezone and next-midnight boundary.
- Repeated changes do not move the boundary.
- Client attempts to forge or extend the override are ignored.
- A Daily Topic completion remains charged and a second completion is rejected despite changing timezone.
- After the original boundary expires, the new preferred timezone is used for a subsequent Daily Activity session.

The PostgreSQL 17 migration, policy, frontend syntax/runtime, and concurrency suite passed on commit `6de4013e3922362d0534fc6045e49405546831f2`: [GitHub Actions run #42794351935](https://github.com/WhiteWingCat/wordbook/actions/runs/42794351935). This is a disposable Supabase-compatible test fixture, not a live production database test. No production schema or website was changed.


## Privacy and learning-history deletion design — 2026-11-10

Two review documents have been added:

- `docs/UPDATE-2.3.0-PRIVACY-AND-DELETION-DESIGN.md` — data inventory, recommended separation of allowance accounting from deletable learning history, transactional deletion workflow, account-deletion distinction, retention proposal, Malaysia PDPA review, and release gates.
- `PRIVACY-POLICY-DRAFT.md` — plain-language draft notice with explicit placeholders for controller identity/contact, provider processing locations, subprocessors, retention and operational details that must be verified before publication.

**Important architectural decision:** the current `learning_activity_log` is both learning history and the quota source. It must not be directly deleted while it remains authoritative for daily limits. The recommended design introduces a private, server-owned minimal current-window allowance ledger (one row per user/activity category) and makes learning history independently deletable. The ledger stores no lesson/content/topic identifiers, answers, language text or individual completion trail. All completion paths must update it atomically under the existing per-user lock.

No deletion RPC, allowance-ledger schema, frontend control, Auth Admin deletion function, production migration, or deployment has been implemented in this task. These are design documents only. The implementation must be separately reviewed, tested in the free PostgreSQL harness and an isolated Supabase project, and explicitly approved before any production changes.

### New release gates

- [ ] Review and approve the allowance-ledger design before implementation; migrate quota enforcement away from `learning_activity_log` without changing plan limits or timezone protections.
- [ ] Implement atomic, idempotent learning-history deletion; prove it cannot reset current-window usage or race with completion.
- [ ] Verify all affected tables, foreign keys, RLS policies, triggers, private objects, Auth settings, and Storage ownership against the live schema.
- [ ] Test that history deletion clears all learning-derived Profile/Daily Learning data but preserves saved words, account, preferences and current allowance usage.
- [ ] Implement and test account deletion separately using a trusted server-side Auth Admin operation; never expose a service-role/secret key in the browser.
- [ ] Finalise the privacy notice only after the controller/contact details, actual provider regions/subprocessors, backup/log retention and cross-border transfer safeguards are confirmed.
- [ ] Complete Malaysia PDPA review, including DPO threshold/systematic-monitoring assessment, breach response, cross-border transfer and age-related obligations.



## Separate current-window allowance ledger — implementation draft

A third, separate SQL draft now follows the permanent allowance and Daily Activity drafts:

- `docs/UPDATE-2.3.0-ALLOWANCE-LEDGER-MIGRATION-DRAFT.sql`
- `tests/update-2-3-0/allowance-ledger-seed.sql`
- `tests/update-2-3-0/allowance-ledger-assertions.sql`

The migration creates `private.learning_allowance_usage`, with at most one row per user/activity category. It stores only the current window start/end, a count, and an update timestamp. It contains no lesson/content/topic identifiers, answer data, language text, or completion event trail.

Before switching enforcement, the migration backfills each user's active allowance window from existing completed activity events. It preserves actual usage even if an existing count is already above the current plan limit; it does not silently reset or truncate counts.

The completion-event trigger now atomically increments this private ledger in the same transaction as the existing activity-history insert. It serializes through the existing per-user advisory lock. If the current window is at its plan limit, the insert and corresponding completion roll back. The lesson-only personal testing exemption remains limited to permanent lessons. Daily session start checks read the ledger through a narrowly scoped SECURITY DEFINER helper that verifies `auth.uid()` matches the requested user; the private table itself has no browser grants.

The daily activity start/resume RPC now reads current usage from the ledger. Starting/resuming remains free; only completion increments the ledger. The existing timezone transition fields determine the effective timezone and local-midnight window.

### Added compatibility tests

- Seed two legacy completed lesson events before the ledger migration and assert the migration backfills a count of two.
- Confirm authenticated clients cannot read the private table directly.
- Confirm the scoped usage helper returns only the caller's own current-window count.
- Complete three more lessons to reach the Free limit of five.
- Delete the detailed lesson history as a privileged operation and prove the current usage remains five and another completion is rejected.
- Complete one Daily Topic, delete its activity-history event, and prove another Daily Topic cannot be started in that allowance window.
- Force a ledger row into an expired window and prove the next successful completion rolls usage over to one.
- Existing timezone, RLS, plan-limit, completion idempotency, and concurrency tests continue to run after the ledger migration.

The GitHub Actions workflow now applies the ledger draft after the two existing 2.3.0 SQL drafts and runs the ledger assertions. This remains a disposable PostgreSQL 17 compatibility test, not a live Supabase migration test. No production database, website, or user data has been changed.

### Review notes before isolated Supabase integration

- Confirm the migration owner can create and own objects in the private schema and that the deployed Supabase roles/schema privileges match the fixture.
- Verify the trigger function's SECURITY DEFINER ownership, pinned empty search_path, explicit authenticated-user check, and private-table grants with Supabase advisors.
- Validate the ledger backfill query against a production snapshot in an isolated project immediately before release.
- Confirm all completion writers insert a completed `learning_activity_log` event in the same transaction. Any future completion type must use this same path or be explicitly integrated with the ledger.
- Keep the ledger out of user-facing Profile history and do not add client-side write or delete access.


### CI validation status for the ledger draft

The workflow has been updated to run in this order: PostgreSQL baseline → permanent allowance migration → Daily Activity migration → legacy event seed → allowance-ledger migration → existing allowance assertions → new ledger assertions → concurrency tests.

GitHub Actions run [#42799773985](https://github.com/WhiteWingCat/wordbook/actions/runs/42799773985) passed on commit `9687bebe2b77441563e1f015c8a8babb234d6e9b` for the preceding implementation, including frontend syntax/runtime checks, migration drafts, backfill, allowance assertions, history deletion, and completion/deletion serialization. The recent-authentication guard has since been strengthened to verify the signed JWT session_id against an existing, non-expired auth.sessions row; the updated session-backed implementation and its added tests passed in run [#42800408769](https://github.com/WhiteWingCat/wordbook/actions/runs/42800408769) on commit `39534035652a4b6758e7943fc650adcb1eb7c005`. This remains a disposable PostgreSQL 17 compatibility test, not a live Supabase migration test. No production database, website, or user data has been changed.


## Learning-history deletion implementation draft

The next implementation stage now includes:

- `docs/UPDATE-2.3.0-LEARNING-HISTORY-DELETION-MIGRATION-DRAFT.sql`
- `tests/update-2-3-0/learning-history-deletion-assertions.sql`
- A Profile **Privacy and data** section with an explicit destructive confirmation.

The authenticated RPC derives the target account exclusively from `auth.uid()`; the browser cannot supply another user ID. Its privileged implementation is in the non-exposed `private` schema, called through a `SECURITY INVOKER` public RPC wrapper. It requires the current signed JWT `session_id` to match an existing `auth.sessions` row created within the previous 15 minutes, acquires the same per-user advisory transaction lock as completion writers, and deletes the user's Daily Activity sessions, practice summaries, lesson progress and activity history in one transaction. It deliberately leaves the Auth user, profile, preferences, entitlement, saved words and private current-window allowance ledger untouched. Repeated calls are idempotent.

The Profile UI explains what is deleted and retained, warns that today's allowance is not restored, and only reports success after the RPC confirms it. If the authentication timestamp is too old, the user is instructed to sign out and sign in again before retrying.

The disposable PostgreSQL workflow now applies the deletion migration after the allowance ledger and checks recent-authentication enforcement, idempotency, complete removal of learning history, unchanged allowance counts, and retention of account/preferences/saved words. The session_id/auth.sessions revision passed in GitHub Actions run [#42800408769](https://github.com/WhiteWingCat/wordbook/actions/runs/42800408769). The tests cover a recent session, stale session, missing/signed-out session, expired session, data preservation, allowance retention and completion/deletion serialization. Isolated Supabase integration and browser validation are still outstanding. This is still a draft and has not been applied to production Supabase.


## Privacy-first content validation added after the first audit

The owner selected the privacy-first approach on 13 November 2026. The branch now contains:

- `docs/UPDATE-2.3.0-CONTENT-CATALOG-MIGRATION-DRAFT.sql`: private catalogue containing 95 stable English content IDs and approved topic/difficulty mappings (28 Daily Topics, 25 Daily Applications, 27 Daily Discoveries and 15 permanent lessons).
- `private.is_approved_learning_content(...)`: server-side allowlist validator. It checks activity type, ID, topic, difficulty, learning language and source; adaptive Revision IDs must resolve to an approved Daily Application source.
- A lesson-progress INSERT guard validates permanent lesson IDs at start. Permanent lesson completion and historical replay-summary RPCs also validate the exact topic mapping.
- `docs/UPDATE-2.3.0-PRIVACY-FIRST-CATALOGUE-DECISION.md`: owner decision, data minimisation boundary and release interpretation.
- `tests/update-2-3-0/content-catalog-test-fixtures.sql`: synthetic IDs used only by disposable tests.
- `tests/update-2-3-0/content-catalog-assertions.sql`: validates catalogue counts, direct client access restrictions, invalid mappings and the Daily Learning RPC.
- The GitHub Actions workflow now applies the catalogue before the allowance/Daily Learning drafts and validates it in both PostgreSQL 17 and disposable local Supabase jobs.
- Two signed-in browser tests now exercise Daily Topic completion and Daily Application first-try aggregate submission. They use a mocked Supabase client; they do not replace real Google OAuth or hosted-account testing.

The catalogue stores identifiers and metadata only. It does not store question text, answer options, correct answers or user responses. Practice results remain aggregate-only and self-reported; they are suitable for personal progress/adaptive revision, not tamper-proof proof of mastery. See the decision document for the full boundary.

**Test-fixture warning:** Synthetic catalogue rows are seeded after the production-catalogue count assertions and only in test environments. Never run the fixture SQL against hosted Supabase.

**Current CI note:** The first catalogue CI attempts correctly exposed missing test metadata and test-fixture ordering assumptions. Those were test harness failures, not production changes. The test fixtures and assertions have since been adjusted; the latest branch changes still require a complete green run before being considered validated.
