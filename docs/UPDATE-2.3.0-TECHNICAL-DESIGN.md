# SwiftDictionary Update 2.3.0 — Daily Learning Expansion
## Technical design and current-state review

**Status:** Planning only. No application code or Supabase schema has been changed by this document.

## 1. Confirmed product decisions

The following decisions are approved for Update 2.3.0:

- **Daily activities:** Show all enabled daily activities together on the Daily Learning page. Users can choose which activities they want to take part in; selecting an activity must not itself consume an allowance.
- **Daily Revision:** Adaptive. Prioritise weak topics and use spaced review intervals based on performance and time since last review.
- **Daily Discovery:** Mixed content: vocabulary, word origins, expressions, language facts, grammar insights, and common mistakes.
- The four daily activity types are Daily Topic, Daily Application, Daily Discovery, and Daily Revision.
- The permanent lesson library remains separate from the daily activity experience.
- **Allowance policy (approved):** Free accounts may complete up to 5 permanent lessons per local day and 1 completed session in each daily category (Revision, Discovery, Topic, Application). Premium accounts may complete up to 15 permanent lessons per local day and up to 3 completed sessions in each daily category.
- **Completion-based charging (approved):** Starting or abandoning a lesson/session does not consume an allowance. The allowance is consumed only when that lesson/session is successfully completed and saved. Resuming an unfinished session does not consume another allowance. Completion must be charged at most once for the same qualifying completion; retries after a failed save must be idempotent.
- Daily category limits are separate: one Revision does not consume Discovery, Topic, or Application allowance.
- Quiz and Flashcards remain reserved for Updates 2.4.0 and 2.5.0.
- Dictionary lookup remains free and unlimited.

## 2. Current production architecture inspected

Repository: `WhiteWingCat/wordbook`, branch `main`.

Connected Supabase project: `SwiftDictionary` (Postgres 17).

### Existing user and learning tables

| Table | Current role | Update 2.3.0 relevance |
|---|---|---|
| `profiles` | Display name and avatar | Profile dashboard identity |
| `user_preferences` | Learning language, translation language, IANA timezone | Daily activity choices and local-day boundaries |
| `user_entitlements` | Free/Premium plan status | Plan-aware allowance calculation |
| `learning_plan_limits` | Per-plan, per-activity daily limits | Must be extended for any new activity categories |
| `learning_activity_log` | Activity category, language, timestamp | Existing authoritative daily allowance log |
| `lesson_progress` | Per-user lesson status and completion | Lesson history and topic linkage |
| `lesson_practice_results` | Aggregate correct/question counts per lesson topic | Potential source for lesson mastery, but currently not populated by the frontend |
| `saved_words` | Account-isolated dictionary favourites | Potential future vocabulary revision source; do not change existing behaviour |
| `private.learning_limit_exemptions` | Server-side personal lesson testing exception | Must remain private and limited to its existing lesson scope |

All inspected tables have RLS enabled. User-owned tables have owner-scoped policies. The private testing allowlist intentionally has no browser-facing policies or grants.

### Existing application behaviour

- The frontend creates a `lesson_progress` row only on a learner's first start of a lesson.
- A database trigger currently records that first start in `learning_activity_log` as activity type `lesson`; resuming and revisiting an existing lesson do not create another start.
- **This current start-based quota behaviour must be redesigned** to match the approved completion-based policy. A started/abandoned lesson must not count. The authoritative quota check and usage record must happen atomically when completion is saved, with user timezone and transaction-level concurrency protection.
- The current lesson practice flow checks answers in the browser and saves lesson completion, but the inspected frontend contains no insert into `lesson_practice_results`.
- Current Profile activity statistics read `learning_activity_log`; they cannot infer topic accuracy, question-level performance, or revision due dates from that log.
- `learning_activity_log` deliberately stores only activity type, language code, and timestamp. Do not overload it with answer content or detailed learning telemetry.

## 3. Important findings and blockers before schema implementation

### 3.1 Practice-result capture is not active

The live database contains `lesson_practice_results`, but it currently has zero rows. The frontend does not reference this table. Therefore, adaptive revision cannot safely be based on lesson accuracy until a verified result-writing flow exists.

**Approved direction:** Add a reliable aggregate-result write after a practice attempt has a final outcome. Store only the minimum necessary summary (stable topic ID, difficulty, correct count, question count, attempt timestamp, and activity/session reference where applicable). Do not store the learner's selected answers, free-text responses, typed sentences, or raw keystrokes. Do not collect names, email addresses, device fingerprints, precise location, or unrelated behavioural data in learning records. Keep records owner-scoped with RLS, restrict reads to the authenticated owner, and use aggregate metrics for adaptive revision. Provide a clear privacy explanation that practice performance is used to personalise revision and progress statistics. Define a retention/deletion approach so users can request deletion of their learning history without deleting their account.

### 3.2 Migration history reconciliation — baseline recorded

The live Supabase migration list initially contained the Update 2.1.0 migrations and the personal testing-allowlist migrations, but no Update 2.2.0 migration record. The 2.2.0 lesson tables and triggers were already present in production.

A reconciliation baseline named `swiftdictionary_update_2_2_0_reconciliation_baseline` has now been applied and recorded. Its SQL is committed in `supabase/migrations/202611100001_swiftdictionary_update_2_2_0_reconciliation_baseline.sql`. It performs read-only assertions that the deployed lesson tables, key triggers, functions, and RLS enablement exist. It does not recreate, drop, or alter application tables, policies, triggers, functions, or user data. Its purpose is to establish a verified migration-history checkpoint without falsely replaying the original additive migration.

**Known schema drift:** The live `guard_lesson_progress_update()` includes a safeguard that clears `completed_at` when a row remains `in_progress`; the checked-in `SUPABASE-MIGRATION-2.2.0.sql` does not include that line. The live definition is therefore not byte-for-byte identical to the root SQL file. Future migrations must use the inspected live definitions as their baseline and explicitly document any intentional changes. Do not replay the root 2.2.0 migration.

This reconciles the missing history checkpoint, but does not retroactively claim that the original 2.2.0 SQL file was executed by Supabase migration tooling.

### 3.3 Approved allowance policy and required enforcement redesign

The owner has approved these daily completion limits:

| Activity category | Free plan | Premium plan |
|---|---:|---:|
| Permanent lessons (combined across Beginner, Intermediate, Advanced) | 5 completed lessons/day | 15 completed lessons/day |
| Daily Revision | 1 completed session/day | 3 completed sessions/day |
| Daily Discovery | 1 completed session/day | 3 completed sessions/day |
| Daily Topic | 1 completed session/day | 3 completed sessions/day |
| Daily Application | 1 completed session/day | 3 completed sessions/day |

Daily categories have independent limits. The four daily categories must not share one combined daily counter.

**Charge only on successful completion:** opening, starting, resuming, or abandoning a session does not consume allowance. A qualifying completion consumes one unit only after the completion and usage record are committed successfully. The quota check, completion transition, and usage insert must be atomic and concurrency-safe. A failed completion save must not consume quota; retrying the same completion must not double-charge. Reopening an already completed permanent lesson or replaying completed daily content should not charge again unless the owner later explicitly approves a separate repeat-attempt model.

For permanent lessons, count completed lesson IDs across all three difficulty levels. The existing unique progress row means a lesson's first transition to `completed` is the chargeable event; revisits are free. For daily activities, count distinct completed daily sessions per category and local day; resuming the same session is free.

The current database constraint and plan-limit rows support `lesson`, `quiz`, and `flashcard`. Add explicit daily activity categories (`daily_topic`, `daily_application`, `daily_discovery`, `daily_revision`) and configure plan limits as above. The permanent lesson limit remains under `lesson`, but its trigger moves from first start to first completion. Preserve Quiz and Flashcard categories for their future releases. The personal testing exemption must remain scoped to `lesson` only; it must not exempt any 2.3.0 daily category.

### 3.4 Existing security advisories

The Supabase advisor currently reports:
- The private allowlist table has RLS enabled but no policies. This is intentional because browser roles have no table grants; do not add client policies to it.
- The public `is_personal_learning_test_access()` RPC is a SECURITY DEFINER function callable by authenticated users. It returns only the caller's own boolean status and is currently used by the UI. Review it as an existing narrow exception; do not copy this pattern for new 2.3.0 endpoints.
- Leaked-password protection is disabled in Auth. This is an existing account-security setting, unrelated to the new learning feature, and should be reviewed separately by the owner.
- The advisor reports several unused indexes, including the index on the currently empty practice-results table. Reassess indexes after real query patterns exist; do not remove indexes as part of this feature planning.

## 4. Proposed product and data architecture

### 4.1 Daily Learning home

Show all enabled activities together:
1. Daily Topic
2. Daily Application
3. Daily Discovery
4. Daily Revision

Each card should show its purpose, today's content/recommendation, completion state, and remaining allowance where relevant. A user preference controls whether each activity is shown. All four should be enabled by default unless the owner later chooses another default.

Changing preferences, opening an activity, or starting/resuming a session must not consume a learning allowance. The relevant allowance is consumed only after a qualifying session is successfully completed and saved. Abandoning an unfinished session is free.

### 4.2 Content catalogue

Keep curated public learning content version-controlled in the repository initially, rather than creating an admin-managed content CMS prematurely.

Recommended content groups:
- Daily Topic: short teaching unit, learning objective, explanation, examples, topic identifiers, difficulty, and translation fields.
- Daily Application: original practice prompts with validated answer keys, topic identifiers, difficulty, and concise explanations.
- Daily Discovery: mixed editorial cards covering vocabulary, etymology, expressions, language facts, grammar insights, and common mistakes, with sources recorded for factual claims and licensed assets only.
- Daily Revision: generated from the signed-in learner's own history; not a public static content feed.

Use stable topic IDs shared with permanent lessons wherever the learning objective is genuinely the same. Do not infer topic identity from display titles.

### 4.3 User preferences

Add an owner-scoped preference record for the four daily activity toggles, or extend the existing preferences structure if that remains simpler after inspecting its current update flow. Defaults: all four enabled. Preferences must be account-specific and synchronised across devices.

### 4.4 Daily assignment history

Introduce a per-user daily assignment/session model that records:
- user ID;
- activity type;
- local assignment date and timezone snapshot;
- stable content or topic ID;
- session status (started, completed, abandoned if needed);
- start/completion timestamps;
- source/reason (daily selection, weak-topic recommendation, or scheduled revision);
- a stable idempotency key for completion accounting.

Use a uniqueness/idempotency rule so refreshing the page or opening it on another device does not generate duplicate assignments. A started or abandoned session is not quota usage. The successful completion transition and quota usage must be committed in one transaction. A local date must be derived from the user's configured IANA timezone, not the browser's current timezone alone.

### 4.5 Aggregate practice outcomes

Use aggregate outcomes to drive mastery and Profile statistics. Prefer a consistent session/result schema shared by Daily Application and Daily Revision, and integrate existing lesson practice summaries without duplicating the same attempt.

Minimum fields:
- user ID;
- activity/session ID;
- stable topic ID;
- difficulty where relevant;
- correct count and question count;
- attempt timestamp.

Never store passwords, tokens, or unnecessary personal information. Do not persist every answer choice merely to compute accuracy.

### 4.6 Adaptive revision and weak-topic priority

Build an initial transparent algorithm rather than an opaque recommendation model.

Suggested signals:
- recent accuracy and total attempts;
- recency of last successful review;
- number of consecutive successful reviews;
- overdue interval;
- a minimum evidence threshold before labelling a topic weak.

Suggested initial policy:
- Insufficient evidence: recommend normal introductory review, not a weak-topic label.
- Low or declining accuracy: bring the topic forward and shorten its next interval.
- Consistent success: gradually lengthen the interval.
- Long-unreviewed topics: increase priority, but do not label them weak solely because time has passed.

Store next-due review state or calculate it from review events. Start with a simple, testable interval schedule; tune it using owner testing rather than claiming scientifically precise mastery.

### 4.7 Profile progress dashboard

Add:
- total daily activities started/completed;
- daily activity breakdown;
- topic accuracy based on recorded aggregate attempts;
- revision due/overdue counts;
- topics needing attention;
- learning history over time;
- existing Beginner/Intermediate/Advanced lesson completion.

All figures must be derived from persisted records. Avoid optimistic counters that increment before a database save succeeds. Keep all queries user-filtered and protected by RLS.

## 5. Approved allowance policy — implementation requirements

The numerical limits and completion-based charging rules in Section 3.3 are approved and should be implemented as written. No further product decision is needed for the basic allowance model.

Implementation must ensure:
- one permanent lesson counter shared across Beginner, Intermediate, and Advanced;
- four separate daily counters, one for each daily activity category;
- Free: 5 permanent lesson completions and 1 completion per daily category per local day;
- Premium: 15 permanent lesson completions and 3 completions per daily category per local day;
- starts, resumes, and abandoned sessions are free;
- only a successful first completion consumes a unit;
- duplicate completion requests cannot double-charge;
- a failed save cannot consume a unit;
- completed content revisits/replays do not charge again;
- the personal testing exemption remains lesson-only and private.

Plan status must be checked server-side at the time of completion. Daily boundaries must use the user's stored IANA timezone. Do not trust a client-supplied plan, local date, completion flag, or remaining allowance.

## 6. Security, privacy, and legal precautions

- Enable RLS on every new exposed table and define explicit owner-scoped policies for SELECT/INSERT/UPDATE. Include both USING and WITH CHECK for updates.
- Grant only the minimum required privileges; RLS does not replace table grants.
- Do not expose service-role credentials or private schema tables in the browser.
- Prefer SECURITY INVOKER functions. If a privileged function is truly necessary, place it in a non-exposed schema, validate `auth.uid()` internally, and restrict EXECUTE explicitly.
- Index user/date/activity/topic columns used by RLS filters and common queries; validate with actual query plans rather than speculative indexes.
- Avoid collecting full answer text, personal notes, or unrelated behavioural data.
- Use original learning explanations, examples, questions, and discovery articles. Track citations and image licences for factual/editorial material. Do not copy textbook exercises or full third-party articles.
- Include clear privacy wording explaining that performance history is used to personalise revision and Profile statistics.

## 7. Recommended implementation order

1. Reconcile the 2.2.0 schema and migration history; establish a reproducible baseline.
2. Redesign the allowance database flow so quota is charged on successful completion rather than start; preserve atomicity and idempotency.
3. Add the four independent daily allowance categories and configure Free/Premium limits approved in Section 3.3.
4. Implement privacy-minimised practice-result capture and owner-scoped daily activity preferences/assignments.
5. Implement Daily Topic and its content catalogue.
6. Implement Daily Application and aggregate practice-result capture.
7. Implement mixed Daily Discovery content.
8. Implement adaptive Daily Revision and weak-topic prioritisation.
9. Expand Profile statistics using persisted data.
10. Test timezone boundaries, concurrent/duplicate completion requests, abandoned sessions, allowance counters, account switching, RLS, deletion/retention, and regressions in dictionary search, saved words, and permanent lessons.

## 8. Release safeguards

- Work on a dedicated Update 2.3.0 feature branch; do not develop directly on `main`.
- Preserve Supabase authentication, account switching, per-account saved words, unlimited dictionary search, and the existing lesson progress/allowance rules.
- Do not deploy Pages or apply production schema changes until the owner approves the implementation and the migration has been reviewed.
- Accumulate and validate the complete feature set, then prepare one consolidated release rather than delivering a new project version after every small batch.

## 9. Current verification snapshot

- Repository `main` was inspected; this document is based on the merged Update 2.2.0 code.
- Production Supabase tables, columns, RLS policies, triggers, and migration records were inspected.
- The reconciliation migration was applied successfully. It added a migration-history record and verified expected objects; it did not alter application schema or user data.
- Current row counts at review time: 13 lesson progress records, 0 lesson practice result records, and 13 learning activity log records. No user identifiers or answer content were queried for this summary.
- No application code or GitHub Pages deployment was changed during this review.


## 10. Owner-approved decisions added after the initial review

- Practice tracking is approved provided it is privacy-minimised as specified in Sections 3.1 and 6: aggregate outcomes only, no raw answers/free text, strict owner-scoped RLS, clear purpose disclosure, and a deletion/retention approach.
- Migration-history reconciliation is an explicit next engineering task. Do not mark migrations as applied or execute a baseline script until live schema equivalence has been verified statement by statement and a rollback/recovery plan exists.
- Daily allowance policy is final for planning: Free = 5 permanent lesson completions/day and 1 completion in each of the four daily categories/day; Premium = 15 permanent lesson completions/day and 3 completions in each daily category/day.
- Allowances are consumed only on successful completion. Starting, resuming, and abandoning do not consume allowance. Completion accounting must be atomic, concurrency-safe, and idempotent.


## 11. Migration reconciliation execution record

- Applied successfully to the connected SwiftDictionary Supabase project on 2026-11-10: `swiftdictionary_update_2_2_0_reconciliation_baseline`.
- Source-controlled at `supabase/migrations/202611100001_swiftdictionary_update_2_2_0_reconciliation_baseline.sql` on the Update 2.3.0 planning branch.
- The migration asserts the presence of the deployed 2.2.0 lesson tables, key triggers/functions, and RLS enablement. It intentionally performs no schema alteration or data rewrite.
- This creates an auditable migration-history checkpoint; it does not misrepresent the original root-level 2.2.0 SQL as having been run through migration tooling.
- The live guard-function difference described in Section 3.2 remains documented and must be respected by the next migration.
