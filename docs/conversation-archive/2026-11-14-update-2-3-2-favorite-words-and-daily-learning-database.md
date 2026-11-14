# SwiftDictionary — Update 2.3.2 Favorite Words hotfix and Daily Learning database diagnosis

**Date:** 2026-11-14  
**Repository:** https://github.com/WhiteWingCat/wordbook  
**Production baseline at start:** Update 2.3.1 merge commit `3ca194f908356f85aed1c143c647ebf488e9a353`.

## Owner request

The owner reported that most Update 2.3.1 features were available on the live website, but Daily Learning was waiting for a server database update. The owner also saw English and Simplified Chinese saved words mixed between the two Dashboard Favorite Words categories. The owner requested an Update 2.3.2 hotfix and explicitly authorised merging it to `main` after validation.

## Daily Learning production database diagnosis

The connected SwiftDictionary Supabase project was healthy and running PostgreSQL 17.11.0.003. Read-only migration-history inspection showed that production migration history ended at `20261110041007`, the 2.2.0 reconciliation baseline.

Read-only schema checks confirmed the following objects were absent:
- `public.daily_activity_sessions`
- `private.learning_content_catalog`
- `private.learning_allowance_usage`
- RPCs `public.start_daily_activity_session`, `public.complete_daily_activity_session` and `public.get_my_learning_allowance_usage()`

Daily activity preference flags and allowance-timezone fields were missing from `user_preferences`; completion event fields were missing from `learning_activity_log`; and `learning_plan_limits` still contained only the `lesson`, `quiz` and `flashcard` categories.

This is why the live application reports that Daily Learning is waiting for its matching server database update. The website code is ahead of the production database schema.

### Pending 2.3.0 migration sequence

The repository contains six SQL drafts in `docs/`, but they have not yet been promoted into timestamped files under `supabase/migrations/`:
1. Saved-words least-privilege hardening (independent).
2. Approved learning content catalogue.
3. Completion-based allowance foundation.
4. Daily activity session foundation.
5. Separate current-window allowance ledger.
6. Learning-history deletion implementation.

The catalogue precedes allowance; Daily Activity follows the allowance foundation; the ledger follows both; history deletion follows allowance, Daily Activity and ledger. The drafts passed disposable PostgreSQL 17 and local Supabase CLI compatibility tests in CI run #774. This is not evidence that they have been applied to production.

**No production migration, production SQL write or production bulk saved-word update was performed.** Proper timestamped migrations, historical backfill review, backups/rollback planning and explicit owner approval are required before production changes.

## Favorite Words root cause and implementation

The Dashboard grouped rows using the database `course` field, but the in-memory saved-state set used only the word text. Identical word strings could therefore share saved state across English and Chinese. Read-only inspection also indicated legacy saved rows whose stored course disagreed with the word's script/catalogue. No word contents or user IDs were retained in this archive.

The hotfix:
- Uses a composite course-plus-word key for in-memory favorites.
- Persists signed-out local favorites as explicit course/word pairs and accepts old string-only local entries.
- On a signed-in user's Dashboard load, classifies clearly identifiable legacy rows using Han-script code points and exact dictionary-catalogue membership.
- Repairs only the authenticated user's own rows. It inserts the corrected course row first and deletes the old course row second. If insertion fails, the original is retained. Unknown entries are not guessed.
- Uses existing authenticated INSERT/DELETE permissions and RLS; no database schema change is required.
- Adds browser coverage for mixed-course legacy rows and static assertions for course-scoped favorite state.

## Branch, tests and merge

- Branch: `hotfix/update-2-3-2-favorite-words-course-isolation`
- PR #6: https://github.com/WhiteWingCat/wordbook/pull/6
- Final feature commit: `b50f0cc7b6ec74b065342c1e953d2f6d85d44fcd`
- GitHub Actions run #774 passed all three jobs: 22 Chromium browser tests, PostgreSQL 17 migration/allowance tests and disposable local Supabase Auth compatibility.
- Earlier run #773 exposed two test-harness issues: a strict locator assertion after adding multiple favorite rows, and altered mock INSERT timing. Both were fixed; run #774 passed.
- PR #6 merged on 2026-11-14 at 08:10:27 UTC.
- Merge commit and verified `main` HEAD: `60904fb77fec0c3757e8aa1947439440954ae385`.
- Main GitHub Pages deployment workflow #43574533852 was queued after merge; deployment completion must be verified separately.

## Privacy and legal review

The hotfix adds no new personal-data fields, analytics, tracking, raw answer telemetry or third-party content. It corrects existing saved-word course labels within the signed-in user's own RLS scope, does not collect additional information, and leaves unknown entries untouched. Insert-before-delete preserves the original if the corrected insert fails.

Malaysia PDPA and general privacy obligations remain applicable. This is a limited data-quality operation on existing user-owned data, not a new data collection category. Review the privacy notice if future changes introduce broader profiling or analytics. This is planning guidance, not legal advice or a compliance certification.

## Next actions

1. Confirm main GitHub Pages deployment #43574533852 succeeded for merge commit `60904fb77fec0c3757e8aa1947439440954ae385`.
2. After the deployment is live, refresh the site and open Dashboard while signed in; clearly identifiable legacy mismatches are repaired on that user's Dashboard load.
3. Prepare proper timestamped production migrations from the six tested 2.3.0 drafts in dependency order.
4. Present the exact SQL, backfill effects, RLS/security changes and rollback/backup plan, then obtain explicit owner approval before applying production migrations.
5. Verify production schema, migration history and Daily Learning behavior after approval.
6. Proceed to Update 2.4.0 Quiz after the 2.3.0 server database rollout is complete.
