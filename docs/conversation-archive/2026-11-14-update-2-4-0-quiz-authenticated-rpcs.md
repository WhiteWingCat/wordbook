# 2026-11-14 — Update 2.4.0 Quiz authenticated RPC implementation

## User authorization and boundaries

The user asked to proceed with the next implementation stage after the question-bank/database foundation. Work continued on the existing feature branch, feature/update-2-4-0-quiz, and draft PR #8.

Standing project rules were followed:
- No paid hosted Supabase branch was created.
- No production migration or data change was performed.
- No production Quiz allowance values were changed.
- No merge or deployment was performed.
- All local Supabase integration work used disposable GitHub Actions containers.

## Decisions carried forward

- Four answer options per question.
- Beginner session: 10 Beginner questions.
- Intermediate session: 15 questions, selected from approved compositions of 12 Intermediate + 3 Beginner, 8 + 7, or 7 + 8.
- Advanced session: 20 questions, 12–16 Advanced + 4 Intermediate + 0–4 Beginner.
- Minimum approved bank capacity: Beginner 20; Intermediate 24 Intermediate + 16 Beginner; Advanced 32 Advanced + 8 Intermediate + 8 Beginner.
- Three-session target capacity: Beginner 30; Intermediate 36 Intermediate + 24 Beginner; Advanced 48 Advanced + 12 Intermediate + 12 Beginner.
- Same-day question non-reuse across sessions and difficulties.
- At least three topics per session; no topic may contribute more than 40% of a session.
- One active unfinished session per account.
- Unfinished sessions remain resumable without a timer until completed or explicitly abandoned.
- Abandonment does not consume completion allowance.
- Answers may be changed until submission.
- Server-side score and nearest-whole-number percentage; no pass/fail.
- Full answer review only after completion.
- Quiz allowance target remains Free 1/day and Premium 3/day.
- Existing production allowance values remain Free 5/day and Premium 12/day until a separately reviewed production migration is approved.

## Implementation

New migration:
- supabase/migrations/20261114160000_swiftdictionary_update_2_4_0_quiz_authenticated_rpcs.sql

The migration adds:
- immutable source lesson, topic and source-difficulty metadata to issued question snapshots;
- authenticated RPC wrappers for availability, start/resume, answer saving, submission, abandonment, history and completed review;
- private SECURITY DEFINER implementations using auth.uid(), fixed empty search_path and owner checks;
- public SECURITY INVOKER wrappers;
- RLS and direct-table privilege revocation;
- random question and option order snapshots;
- feasible source-composition selection based on the remaining unseen question pool;
- server-side scoring and idempotent completion through the existing learning_activity_log trigger;
- extension of delete_my_learning_history() to remove Quiz sessions and answer snapshots.

A separate private.quiz_daily_question_reservations ledger stores only user ID, local date, question ID and reservation timestamp. It preserves the same-day no-repeat rule after a user deletes Quiz history. It contains no prompt, answer, score or explanation. Expired reservations are purged after a conservative 36-hour window when availability or a new session is requested. Account deletion removes the rows through the user foreign-key cascade.

History deletion removes Quiz session snapshots and completion events but retains the allowance ledger so deletion cannot reset a daily quota. It also retains the minimal temporary no-repeat ledger until expiry. This retention must be explained in the Privacy Notice before public release.

## Test infrastructure and validation

Changed/added files on the feature branch:
- supabase/migrations/20261114160000_swiftdictionary_update_2_4_0_quiz_authenticated_rpcs.sql
- supabase/tests/quiz_rpc_bootstrap.sql
- supabase/tests/quiz_rpc_test_observers.sql
- supabase/tests/quiz_authenticated_rpcs.sql
- .github/workflows/quiz-db-foundation.yml

The workflow includes:
1. A disposable PostgreSQL 17 service applying the foundation and RPC migrations, then testing schema constraints, question sampling, session lifecycle, answer changes, scoring, allowances, deletion, ownership and privileges.
2. A disposable local Supabase stack validating real local Auth schema/JWT helpers, the synthetic SwiftDictionary application baseline, 2.3.x prerequisite migrations, both Quiz migrations, authenticated RPC tests and Supabase security advisors.

Workflow run 66 passed both Quiz jobs (PostgreSQL 17 and local Supabase integration/security advisors). The companion 2.3.x workflow's PostgreSQL and Chromium browser regression jobs passed; its local Supabase job was still running when checked. A final extra assertion for direct access and RLS on the daily reservation table was committed after run 66; the follow-up workflow is pending.

The local Supabase stack is created and destroyed within GitHub Actions. It is not a hosted Supabase branch and is not connected to the production project.

## Current limitations

- No approved production Quiz questions have been inserted; the question bank remains empty.
- Quiz frontend screens/navigation are not implemented.
- The implementation currently exposes the English learning course only; translation-language availability depends on approved bank content for the selected pair.
- Production allowance values are still Free 5/day and Premium 12/day; the target Free 1/day and Premium 3/day has not been applied.
- Draft PR #8 remains open and must not be merged without explicit user approval.
- No production migration, allowance change, merge or deployment occurred.

## Preliminary Malaysia privacy/legal review

Quiz stores account-linked learning-performance data: issued question IDs, selected answers, scores, timestamps, source lesson/topic mappings, local date and timezone. No advertising tracker or third-party analytics was added.

The PDPA 2010 regulates personal-data processing in commercial transactions. The current free/personal project purpose means precise applicability needs legal review; a future Premium/commercial operation makes the Act more directly relevant. The DPO and breach-notification provisions introduced by the 2024 amendment took effect on 1 June 2025. JPDP's DPO criteria include processing more than 20,000 data subjects, more than 10,000 sensitive-data subjects, or activities requiring regular and systematic monitoring. Adaptive weak-topic prioritisation evaluates a learner's performance and may require review under the Commissioner's Automated Decision-Making and Profiling Guideline (issued 30 April 2026). Do not assume a small user count alone resolves the monitoring criterion.

Before release, the later legal milestone should review:
- Privacy Notice wording for Quiz answer/progress processing, purpose, retention and deletion, including the 36-hour reservation ledger and retained allowance count;
- whether a DPO or DPIA is required, including the profiling and regular/systematic-monitoring criteria;
- whether the project falls within a data-controller registration class under Circular No. 1/2026;
- Supabase project region, subprocessors and a valid section 129 cross-border transfer basis if data leaves Malaysia;
- breach response, data-subject requests, account deletion/retention and the global 16+ age policy.

This is a preliminary engineering risk check, not legal advice. The dedicated Terms and Legal update remains scheduled after Flashcards is released to main.

Official sources:
- PDPA 2010 reprint (2026): https://www.pdp.gov.my/wp-content/uploads/2026/10/Akta-709-cetakan-semula-2026-BI.pdf
- JPDP FAQ: https://www.pdp.gov.my/en/faq/
- DPO guidance: https://www.pdp.gov.my/en/akta/personal-data-protection-guidelines-on-the-appointment-of-data-protection-officer-dpo/
- Automated Decision-Making and Profiling Guideline: https://www.pdp.gov.my/en/akta/automated-decision-making-and-profiling-guideline-admp/
- Cross-Border Transfer Guideline: https://www.pdp.gov.my/en/akta/personal-data-protection-guidelines-on-cross-border-transfer-of-personal-data-cbpdt/
- Circular No. 1/2026: https://www.pdp.gov.my/en/akta/personal-data-protection-commissioners-circular-no-1-2026-registration-of-data-controllers/

## Next stage

Build the question-bank authoring/import/approval pipeline and populate sufficient reviewed content. Then integrate the Quiz frontend and run browser tests. Production migration and release remain separate approval gates.
