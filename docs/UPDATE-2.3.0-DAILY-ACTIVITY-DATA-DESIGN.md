# Update 2.3.0 — Daily Activity Data Foundation

**Status:** Design draft. No production schema changes have been made.

## Approved product behaviour

- Daily Topic, Daily Application, Daily Discovery, and Daily Revision are independently enabled per account and all default to enabled.
- Preferences sync across devices through the authenticated user's user_preferences row.
- Daily Revision is adaptive and prioritises weak/overdue topics using aggregate performance and review recency.
- Daily Discovery mixes vocabulary, etymology, expressions, language facts, grammar insights, and common mistakes.
- Free allowance: one successful completion per daily category per local day. Premium: three per category.
- Starting, resuming, or abandoning a daily session is free. A successful first completion is the only chargeable event. Repeated completion requests are idempotent.
- The permanent lesson allowance remains a separate shared counter across all three difficulty levels.
- No daily activity receives the private permanent-lesson testing exemption.

## Proposed schema additions

### User preferences

Add four non-null boolean fields to user_preferences, all defaulting to true:

- daily_topic_enabled
- daily_application_enabled
- daily_discovery_enabled
- daily_revision_enabled

Existing owner-scoped RLS policies already cover user preference reads and updates. No separate preference table or client-side storage is needed.

### Daily activity sessions

Add an owner-scoped daily_activity_sessions table containing only:
- session UUID and user UUID;
- activity category;
- stable content ID and optional stable topic ID;
- optional difficulty;
- assignment local date and IANA timezone snapshot;
- source category (daily selection or adaptive revision);
- status (in_progress, completed, abandoned);
- start/completion timestamps;
- optional aggregate correct_count and question_count for Application and Revision.

Do not store selected answers, free-text answers, typed responses, keystrokes, device identifiers, precise location, or unrelated behavioural data.

A partial unique index should permit at most one unfinished session per user and activity category. A learner may resume that same session across devices and across a local-day boundary. Once completed or abandoned, a new session may be created if that day's completion allowance remains.

### Server-side functions

- start_daily_activity_session(...): authenticates the caller, checks their saved activity preference, loads their stored IANA timezone, returns an existing unfinished session if one exists, and otherwise checks the server-side plan allowance before creating a new session. It never charges allowance.
- complete_daily_activity_session(...): locks the user's completion stream, validates session ownership and aggregate result shape, transitions the session once, and lets a database trigger insert the corresponding completed event into learning_activity_log. The existing quota trigger performs the authoritative plan/timezone/limit check. If the quota check fails, the session transition and event both roll back.
- The daily completion trigger remains separate from the permanent lesson trigger, and the lesson-only testing exemption is never consulted for daily categories.

Daily Topic and Daily Discovery completions do not require question counts. Daily Application and Daily Revision require aggregate correct/question counts with question_count > 0 and 0 <= correct_count <= question_count.

## Local-day and resume behaviour

The session stores its assignment date and timezone for content/history context. Quota consumption is recorded at completion time, using the existing activity-log trigger's current local-day boundary. Therefore, a session started yesterday and completed after midnight consumes today's allowance, not yesterday's. Resuming the same unfinished session does not create another session or consume quota.

## Adaptive Revision inputs

The first version should use transparent, deterministic signals:
- aggregate accuracy by stable topic ID;
- number of attempts and amount of evidence;
- recency of the last review;
- overdue status and consecutive successful reviews.

Do not label a topic weak without a minimum amount of evidence. Low/declining accuracy shortens the next interval; repeated success lengthens it. A topic that is merely old should be marked due/overdue, not weak. Keep the algorithm explainable and tunable.

## Privacy, security, and legal review

- RLS must be enabled on the new session table with owner-scoped SELECT/INSERT/UPDATE policies.
- Clients may create only in_progress sessions. Only the authenticated completion RPC may transition a session to completed.
- The completion RPC must use SECURITY INVOKER where possible; the internal trigger writer belongs in the non-exposed private schema, validates auth.uid(), and revokes direct EXECUTE from browser roles.
- Aggregate practice data is used to personalise revision and Profile statistics. Explain this purpose in the privacy notice and provide a practical learning-history deletion route/retention policy.
- Keep content original or properly licensed. Record sources for factual Daily Discovery material; do not copy textbook questions, exercises, or full third-party articles.
- Review the app's Malaysia PDPA disclosures and data-handling practices before public release or any future paid plan.

## Implementation gates

1. Finish and review the completion-based permanent-lesson allowance foundation.
2. Test the daily preference/session schema and functions in the free PostgreSQL compatibility harness.
3. Add aggregate permanent-lesson practice result capture without persisting answer-level data.
4. Implement curated Daily Topic and Daily Discovery content.
5. Implement Daily Application with aggregate outcomes.
6. Implement adaptive Daily Revision after reliable aggregate result history exists.
7. Expand Profile statistics from persisted records.
8. Complete browser and account-isolation regression testing before any production migration or Pages deployment.
