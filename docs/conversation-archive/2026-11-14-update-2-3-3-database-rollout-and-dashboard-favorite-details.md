# SwiftDictionary Update 2.3.3 — production Daily Learning database rollout and Dashboard Favorite Words details

**Date:** 2026-11-14  
**Repository:** [WhiteWingCat/wordbook](https://github.com/WhiteWingCat/wordbook)  
**Status:** Six reviewed 2.3.0 migrations applied to production; Update 2.3.3 frontend change remains in open PR #7

## Owner request

The owner approved preparing and applying the reviewed 2.3.0 database migrations to the live Supabase project and requested that the combined work be treated as Update 2.3.3. The additional UI change: selecting a Favorite Word from the Dashboard should show its expanded details without navigating back to Dictionary.

## Production database changes

Applied all six migrations to the live SwiftDictionary Supabase project on 2026-11-14, in dependency order:

1. `20261114082303_swiftdictionary_update_2_3_0_saved_words_privilege_hardening`
2. `20261114082311_swiftdictionary_update_2_3_0_learning_content_catalog`
3. `20261114082324_swiftdictionary_update_2_3_0_completion_based_allowance`
4. `20261114082328_swiftdictionary_update_2_3_0_daily_activity_sessions`
5. `20261114082332_swiftdictionary_update_2_3_0_current_window_allowance_ledger`
6. `20261114082335_swiftdictionary_update_2_3_0_learning_history_deletion`

The exact SQL is source-controlled under `supabase/migrations/` with the same version timestamps recorded in the live migration history. The original review drafts remain in `docs/`.

## Preflight and verification

Before application:
- Historical lesson progress and lesson activity log reconciled one-to-one (13 rows in each relation at preflight).
- No per-user count mismatches, timestamp mismatches beyond the five-second tolerance, or duplicate practice-summary groups.
- Required Supabase Auth session columns were present.

After application:
- All six migration versions appear in live migration history.
- Daily activity sessions table, private approved-content catalogue, private allowance ledger, and Daily Learning/allowance/history-deletion RPCs exist.
- Free lesson allowance = 5/day; proposed Premium = 15/day.
- Free Daily Topic/Application/Discovery/Revision = 1 each/day; proposed Premium = 3 each/day.
- 161 approved catalogue rows are active.
- Historical completed events remain reconciled.
- No daily sessions or current-window ledger rows were created by the migrations themselves.
- Saved-word RLS remains enabled with three owner-scoped policies. Anonymous SELECT is denied; authenticated SELECT/INSERT/DELETE are allowed; authenticated UPDATE is denied.
- Authenticated callers cannot directly read private catalogue or allowance-ledger tables, but can execute the intended user-scoped RPCs.

No production synthetic account or test session was inserted. No personal saved-word contents were copied into the development record.

## Update 2.3.3 Dashboard Favorite Words change

- Branch: `feature/update-2-3-3-dashboard-favorite-details`
- PR #7: https://github.com/WhiteWingCat/wordbook/pull/7
- Feature head at archive time: `b09f10aa1fa22ea3ba4209408758cb2325eba4ae`
- English and Chinese favorites open the existing expanded detail drawer without leaving Dashboard.
- Previous/next controls and arrow-key navigation are suppressed while a Dashboard favorite is open; normal Dictionary modal behavior returns after close.
- Closing returns focus to the clicked favorite if it remains present.
- Favorites missing from the current dictionary catalogue remain on Dashboard and display a status message; no automatic redirect or guessed content.
- Added Chromium regression coverage for both English and Chinese Dashboard favorites.

## Validation and deployment status

- GitHub Actions run #775 passed PostgreSQL 17 migration/allowance tests, Chromium browser regression (including the new favorite-detail test), and disposable local Supabase Auth compatibility.
- Follow-up CI run #780 was queued/in progress for the final branch head after migration header cleanup; verify final conclusion.
- Cloudflare reported a successful branch preview for an intermediate commit; verify the current PR preview before merge.
- PR #7 is open and mergeable. The frontend change is not merged to `main` or deployed. The database migrations are live, so the previous Daily Learning server-schema blocker is resolved.
- Owner should refresh the live website and test Daily Learning. The Dashboard detail UI requires PR #7 approval, merge and successful main deployment before it is live.

## Security, privacy and legal notes

The private catalogue stores stable approved IDs/topic mappings, not question text or learner answers. The private allowance ledger stores per-user activity-category window counts, not word-level activity. No new tracking, third-party content or payment functionality was added. Saved-word grants were narrowed while retaining owner-scoped RLS.

Post-migration Security Advisor notices included INFO findings for private RLS-enabled tables with no policies (intentional deny-by-default design), WARN findings for authenticated execution of intended SECURITY DEFINER RPCs, and the existing Auth leaked-password-protection setting. These were recorded, not silently broadened into unrelated changes.

Malaysia PDPA and international privacy obligations remain relevant to account-linked learning records. No new personal-data category was introduced. This is planning guidance, not legal advice or compliance certification.

## Next actions

1. Verify CI run #780 and latest Cloudflare branch preview.
2. Owner tests live Daily Learning now that its server schema is installed.
3. Obtain explicit approval to merge PR #7 and deploy the frontend change.
4. Verify main deployment and test Dashboard English/Chinese favorite details on desktop and mobile.
5. Proceed to Update 2.4.0 Quiz after acceptance.
