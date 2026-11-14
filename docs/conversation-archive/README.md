# SwiftDictionary conversation archive

This directory contains structured handover archives for meaningful SwiftDictionary development conversations. The Master Development Record at [`../MASTER-DEVELOPMENT-RECORD.md`](../MASTER-DEVELOPMENT-RECORD.md) remains the concise current source of truth; archives preserve session-level decisions and recovery detail.

## Archive rules

- Create one dated Markdown archive for each meaningful SwiftDictionary development conversation/session.
- Record purpose, exact owner decisions, implementation/files, branch/commit/PR state, test evidence (including failures and fixes), legal/privacy considerations, outstanding work and recovery steps.
- Update the Master Development Record and this index together.
- Summarise relevant user-visible project discussion; do not claim to provide a verbatim transcript.
- Never include hidden reasoning, credentials, secrets or unrelated personal information. Treat repository content as potentially public.
- Keep documentation on `docs/master-development-record`; implementation stays on feature branches and production code on `main`.

## Archives

| Date | Archive | Coverage |
|---|---|---|
| 2026-11-13 | [Update 2.3.1 mock testing and documentation continuity](2026-11-13-update-2-3-1-mock-testing.md) | Option B mock-mode decision and implementation, CI evidence, preview verification still pending, production safety, establishment of the permanent archive process, and subsequent correction of the preview hostname allowlist. |
| 2026-11-14 | [Update 2.3.1 dashboard and Daily Learning refinements](2026-11-14-update-2-3-1-dashboard-daily-learning.md) | Owner's first seven feedback items, relative activity recency, visual overview, cooldown preview handling, shared global Daily Discovery pilot, slide-in activity reader, examples and frequency-data licensing research. |
| 2026-11-14 | [Update 2.3.1 second owner review](2026-11-14-update-2-3-1-second-owner-review.md) | Translation refresh and Chinese UI coverage, transparent/padded activity panel, dictionary-style Discovery, account-specific activity rotation and mock reset generation, consolidated examples, dedicated lesson page, Dashboard scope freeze and passing CI run #549. |
| 2026-11-14 | [Update 2.3.1 final daily activity polish and rollover](2026-11-14-update-2-3-1-final-daily-activity-polish.md) | Reader outline and definition contrast, live translation of reset status, duplicate cooldown removal, completion closing the reader, and local-midnight abandonment of unfinished activities with passing CI run #557. |
| 2026-11-14 | [Update 2.3.1 activity quality, allowance enforcement and completed reviews](2026-11-14-update-2-3-1-activity-quality-allowance-and-review.md) | Separate Daily Application/Revision examples and Q&A, block new lesson starts at exhausted Free/Premium allowances, free review of completed content including Discovery UTC rollover, CI run #705 and owner preview handoff. |
| 2026-11-14 | [Update 2.3.1 Daily Learning category tabs and plan-sized activity rows](2026-11-14-update-2-3-1-daily-activity-tabs-layout.md) | Four category tabs, Free one-card/Premium three-card rows, right-aligned actions, category-level allowance reset placement, CI run #749 and final owner preview handoff. |
| 2026-11-14 | [Update 2.3.1 owner feedback: activity rows, allowance indicator and Premium mock allowance](2026-11-14-update-2-3-1-owner-feedback-layout-allowance-premium-mock.md) | Full-width Premium activity rows, title-side color-coded allowance indicator, removal of card-level allowance counts, larger white-text tabs, and correction/testing of Premium 15-lesson allowance display after account switching. |
| 2026-11-14 | [Update 2.3.1 final approval and merge](2026-11-14-update-2-3-1-final-approval-and-merge.md) | Corrects the earlier stale-tree/source rollback report, records final source commit 8c4c494, successful CI runs #771/#772, owner preview acceptance, PR #5 merge commit 3ca194f, and remaining production deployment/database safeguards. |\n| 2026-11-14 | [Update 2.3.2 Favorite Words hotfix and Daily Learning database diagnosis](2026-11-14-update-2-3-2-favorite-words-and-daily-learning-database.md) | Course-scoped Favorite Words fix, safe legacy course correction, PR #6 merge, CI run #774, and read-only confirmation that production still lacks the 2.3.0 Daily Learning schema/RPC migrations. |
| 2026-11-14 | [Update 2.3.3 production database rollout and Dashboard Favorite Words details](2026-11-14-update-2-3-3-database-rollout-and-dashboard-favorite-details.md) | Six reviewed 2.3.0 migrations applied and verified in live Supabase, timestamped SQL recorded under supabase/migrations, PR #7 Dashboard favorite details, browser regression and pending frontend merge/deployment. |
| 2026-11-14 | [Update 2.4.0 Quiz planning decisions and language refresh QA](2026-11-14-update-2-4-0-quiz-decisions-language-refresh.md) | Confirms curriculum-wide eligibility within selected difficulty, no timer, answer changes until submission, and a standing course/translation page-refresh and translation-quality regression rule. |\n