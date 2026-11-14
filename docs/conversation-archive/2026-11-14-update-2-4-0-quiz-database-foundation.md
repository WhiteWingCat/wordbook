# SwiftDictionary Update 2.4.0 — Quiz database foundation and no-cost validation (2026-11-14)

## Owner decision

The owner declined the estimated hourly cost of a hosted Supabase development branch and requested an alternative. No hosted Supabase branch was created.

## Alternative validation environment

A GitHub Actions workflow, `.github/workflows/quiz-db-foundation.yml`, provisions an ephemeral PostgreSQL 17 service container for each run. It bootstraps minimal Supabase-compatible roles and schemas (`anon`, `authenticated`, `auth.users`, `public.languages`), applies the migration and runs assertions. The job destroys the container at completion. It does not connect to production Supabase.

This is not a full local Supabase/Auth/PostgREST/JWT/RLS integration environment. A local Supabase CLI stack may be used later for those tests without a hosted Supabase branch, provided the developer has Docker resources.

## Implemented foundation

Feature branch: `feature/update-2-4-0-quiz`

Draft PR: https://github.com/WhiteWingCat/wordbook/pull/8

Files:
- `supabase/migrations/20261114120000_swiftdictionary_update_2_4_0_quiz_question_bank_foundation.sql`
- `supabase/tests/quiz_question_bank_foundation.sql`
- `.github/workflows/quiz-db-foundation.yml`

Three private tables were added:
1. `private.quiz_question_bank`: versioned bilingual prompts, four answer options, correct answer, explanations, approval lifecycle and indexes.
2. `private.quiz_sessions`: account-scoped session state, difficulty, course/translation snapshot, source composition, local date/timezone and results.
3. `private.quiz_session_questions`: issued-question ledger, immutable question snapshots, shuffled option order, saved answer and private answer key.

The database enforces four unique option IDs with required bilingual text, correct-option validity, one approved revision per question ID, one active session per user, allowed question counts, unique question positions, immutable question snapshots and unique `(user_id, local_date, question_id)` across all sessions and difficulty levels. RLS is enabled and direct client table privileges are revoked.

## Final validation

GitHub Actions workflow **Quiz database foundation**, run #7, passed on PostgreSQL 17.12:
- Migration applied successfully.
- Tables, RLS and direct privilege revocations verified.
- Four-option bilingual question approved and approval timestamp assigned.
- Three-option and duplicate-option questions rejected.
- Shuffled option-order permutation validation passed.
- Answer changes before submission passed.
- Same-day reuse after abandonment rejected.
- Test transaction rolled back and ephemeral database container destroyed.

The first test run found and exposed a missing ordering-column reference in a trigger; this was corrected. The next test run found a missing synthetic auth user in the fixture; this was corrected. The final run passed. The existing 2.3.x PostgreSQL migration/allowance regression job also passed. Concurrent local-Supabase and browser regression jobs were still in progress at the time of this archive.

## Not yet implemented

Authenticated RPCs, sampling/randomisation, exact source-difficulty ratio enforcement, session creation/resume/abandon/submit, scoring, allowance integration, deletion integration and approved question content are still outstanding. No question is approved or seeded; all Quiz difficulties remain unavailable.

## Production safety

No production Supabase migration, allowance setting, user data, merge or deployment was changed. Current production Quiz allowance settings remain Free 5/day and Premium 12/day pending a future reviewed migration to the confirmed Free 1/day and Premium 3/day. PR #8 remains draft and must not be merged yet.
