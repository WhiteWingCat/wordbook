# Update 2.3.0 — Allowance foundation implementation notes

**Status:** Draft implementation review. No production database or live website changes have been made.

## Scope of this step

Implement the approved completion-based allowance foundation for permanent lessons first. Daily activity sessions will later use the same completion-log model, but are not enabled by this step.

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

1. Add `event_type` = `started` or `completed` to the activity log.
2. Count only `completed` events in the existing server-side quota trigger.
3. Remove the lesson-start charging trigger.
4. Allow status transition to `completed` only while the authenticated completion RPC is executing.
5. Add `complete_permanent_lesson(difficulty, lesson_id)` as a SECURITY INVOKER RPC. It checks ownership through RLS, serializes per-user completion, updates progress, and lets the database completion trigger insert the quota event.
6. Because the progress update and quota insert are in one transaction, quota rejection rolls back completion. Repeated RPC calls return an already completed row without adding another event.
7. Remove direct browser INSERT access to `learning_activity_log`.
8. Preserve the existing plan/entitlement/timezone checks and the private lesson-only exemption.
9. Set permanent lesson limits to Free 5 / Premium 15 and add the four independent daily category rows at Free 1 / Premium 3. Quiz and Flashcard rows remain unchanged.

The RPC is SECURITY INVOKER so owner-scoped RLS remains active for the progress update. The internal trigger function is SECURITY DEFINER only to write the activity event after authenticated ownership has been verified; direct EXECUTE is revoked from browser roles.

## Frontend changes required before enabling the migration

The current `index.html` still needs a coordinated patch on this branch:

- In `completeLesson()`, replace the direct `lesson_progress.update(...)` call with:
  `supabaseClient.rpc("complete_permanent_lesson", { p_difficulty: ls.difficulty, p_lesson_id: x.id })`.
- Keep the existing retry behaviour. A quota rejection must leave the lesson `in_progress`, so the learner can resume and retry after the local-day reset.
- In `loadLessonAllowance()`, filter activity-log rows by `event_type = "completed"` and change all UI wording from lesson starts to lesson completions.
- In the Profile activity query, select `event_type`. Calculate completion statistics from completed rows only, while optionally retaining started events for a separate engagement statistic. Do not count both a start and completion as two completed activities.
- Keep account switching, saved-word sync, dictionary search, and all other existing flows unchanged.

The frontend must not be merged or deployed until the database migration and RPC are installed and verified. The migration must not be applied to production as part of this draft review.

## Validation checklist

- [ ] Migration applied to a disposable Supabase database branch first.
- [ ] Historical event backfill preserves all existing progress and activity records.
- [ ] Free lesson allowance is 5 and Premium is 15.
- [ ] Opening, resuming, or abandoning a lesson does not consume allowance.
- [ ] First successful completion consumes exactly one lesson allowance.
- [ ] A failed completion save consumes none.
- [ ] Duplicate completion retries consume no additional allowance.
- [ ] Two simultaneous completions at the quota boundary cannot exceed the daily limit.
- [ ] Daily reset uses the stored IANA timezone, including DST-aware boundaries.
- [ ] Personal test exemption remains lesson-only.
- [ ] Direct client status update and direct activity-log INSERT are denied.
- [ ] Existing account switching, saved-word isolation, and unlimited dictionary search still work.
- [ ] Supabase security and performance advisors reviewed after applying the migration.
- [ ] Browser tests pass before the PR is marked ready.

## Legal and privacy check

This step records only the learning activity category, event type, language code, and timestamps already needed for progress/allowance. It does not add raw answers, keystrokes, device fingerprints, precise location, or unrelated behavioural tracking. Keep the privacy notice accurate about completion history and daily limits, provide a deletion route for learning history, and explain the free/premium limits clearly before any future paid plan is offered. For Malaysia, review the app's privacy notice and data-handling practices against applicable PDPA obligations before public release or paid subscriptions.
