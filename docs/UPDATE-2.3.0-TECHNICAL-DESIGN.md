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
- A database trigger records that first start in `learning_activity_log` as activity type `lesson`; resuming and revisiting an existing lesson do not create another start.
- The lesson allowance trigger enforces daily limits in the database, with user timezone and transaction-level concurrency protection.
- The current lesson practice flow checks answers in the browser and saves lesson completion, but the inspected frontend contains no insert into `lesson_practice_results`.
- Current Profile activity statistics read `learning_activity_log`; they cannot infer topic accuracy, question-level performance, or revision due dates from that log.
- `learning_activity_log` deliberately stores only activity type, language code, and timestamp. Do not overload it with answer content or detailed learning telemetry.

## 3. Important findings and blockers before schema implementation

### 3.1 Practice-result capture is not active

The live database contains `lesson_practice_results`, but it currently has zero rows. The frontend does not reference this table. Therefore, adaptive revision cannot safely be based on lesson accuracy until a verified result-writing flow exists.

**Decision:** In the implementation phase, add a reliable aggregate-result write after a practice attempt has a final outcome. Store only the minimum necessary summary (topic, difficulty, correct count, question count, attempt timestamp, and activity/session reference where applicable). Do not store the learner's selected answers or free-text response content.

### 3.2 Migration history requires reconciliation

The live Supabase migration list includes the Update 2.1.0 migrations and the personal testing-allowlist migrations, but does not show a recorded Update 2.2.0 migration entry. The live `lesson_progress` and `lesson_practice_results` tables and their triggers do exist.

This indicates that the deployed schema and migration history are not currently represented by a single, fully reconciled migration record. Do not blindly re-run `SUPABASE-MIGRATION-2.2.0.sql` or assume the file has been applied through migration tracking.

**Decision:** Before applying any 2.3.0 DDL, compare the live schema with repository SQL, identify which 2.2.0 statements were applied outside migration history, and prepare a safe baseline/reconciliation plan. No production migration-history edits are part of this planning task.

### 3.3 Activity allowance categories need an explicit policy

The current database constraint and plan-limit rows support `lesson`, `quiz`, and `flashcard`. The current allowance trigger expects a matching enabled row in `learning_plan_limits`.

The four daily activities should not silently be counted as `lesson` starts, nor should they bypass the server-side trigger. A deliberate quota design is required before implementation.

**Proposed direction:** Introduce explicit activity categories for `daily_topic`, `daily_application`, `daily_discovery`, and `daily_revision`, or explicitly document a smaller grouping if product policy prefers shared allowances. Reuse the existing plan-limit table and server-side trigger pattern. Preserve the existing `lesson`, `quiz`, and `flashcard` categories unchanged. Do not choose new Free/Premium numerical limits until the owner approves them.

The personal testing exemption must remain scoped to `lesson` only. It must not exempt any 2.3.0 activity.

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

Changing preferences must not consume a learning allowance. An allowance is charged only when a qualifying activity session starts successfully.

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
- source/reason (daily selection, weak-topic recommendation, or scheduled revision).

Use a uniqueness/idempotency rule so refreshing the page or opening it on another device does not generate duplicate assignments or charge another start. A local date must be derived from the user's configured IANA timezone, not the browser's current timezone alone.

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

## 5. Allowance policy — decisions still required

Before coding, the owner should approve:
1. Whether each of the four daily activities has its own daily allowance category or whether some share one category.
2. Free and Premium daily limits for each category.
3. Whether Daily Revision consumes an allowance, and if so whether its limit differs from new-learning activities.
4. Whether a started but abandoned session consumes the allowance (recommended: yes, once a session is successfully created, to prevent repeated resets; resuming that same session is free).
5. Whether completed daily content can be replayed free or counts as a new attempt (recommended: replay/review is free; only a new daily assignment/session start counts).

The existing lesson allowance and personal testing exception must remain unchanged.

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
2. Approve activity allowance categories and numerical limits.
3. Implement owner-scoped daily activity preferences and idempotent daily assignments.
4. Implement Daily Topic and its content catalogue.
5. Implement Daily Application and aggregate practice-result capture.
6. Implement mixed Daily Discovery content.
7. Implement adaptive Daily Revision and weak-topic prioritisation.
8. Expand Profile statistics using persisted data.
9. Test timezone boundaries, duplicate sessions, allowances, account switching, RLS, completion saves, and regressions in dictionary search, saved words, and permanent lessons.

## 8. Release safeguards

- Work on a dedicated Update 2.3.0 feature branch; do not develop directly on `main`.
- Preserve Supabase authentication, account switching, per-account saved words, unlimited dictionary search, and the existing lesson progress/allowance rules.
- Do not deploy Pages or apply production schema changes until the owner approves the implementation and the migration has been reviewed.
- Accumulate and validate the complete feature set, then prepare one consolidated release rather than delivering a new project version after every small batch.

## 9. Current verification snapshot

- Repository `main` was inspected; this document is based on the merged Update 2.2.0 code.
- Production Supabase tables, columns, RLS policies, triggers, and migration records were inspected read-only.
- Current row counts at review time: 13 lesson progress records, 0 lesson practice result records, and 13 learning activity log records. No user identifiers or answer content were queried for this summary.
- No application code, production data, schema, migrations, or GitHub Pages deployment was changed during this review.
