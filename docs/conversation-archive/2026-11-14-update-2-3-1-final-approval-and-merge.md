# SwiftDictionary — Update 2.3.1 final approval and merge

**Date:** 2026-11-14  
**Repository:** https://github.com/WhiteWingCat/wordbook  
**Feature branch:** `feature/update-2-3-1-bug-fix-and-changes`  
**Pull request:** [#5](https://github.com/WhiteWingCat/wordbook/pull/5)  
**Status:** Owner-approved and merged to `main`.

## Owner's final acceptance

After the corrected Cloudflare preview caught up to the final feature commit, the owner tested it and confirmed all requested refinements were present:

1. Premium activity cards stack as full-width rows; Free displays one activity card and Premium up to three.
2. Allowance counts appear only beside the category title, not on individual activity cards.
3. The title-side allowance indicator is centered and color-coded according to remaining allowance.
4. Switching between the Free and Premium mock accounts updates the permanent lesson allowance correctly (5 vs 15).
5. Category tabs are slightly larger and use white text.

The owner explicitly approved the update as official and ready to merge.

## Source correction incident

An earlier attempt to apply the final changes used a stale Git tree reference. This caused old CSS and Daily Learning JavaScript to be restored, even though the commit history appeared to show the requested changes. The previous claim that the five refinements were already implemented was incorrect. CI run #763 on `d1c9be67` did not validate those final refinements.

The source was corrected by fetching the current feature-branch files and updating them sequentially against their current file SHAs. Commit `8c4c4949be68f2b372def13ce75c8ec67b67405e` contains the corrected source and regression assertions. The actual branch files were inspected before the owner was asked to retest.

## Final validation

Both CI runs completed successfully against the final feature commit, with all three jobs passing:

- [Run #771](https://github.com/WhiteWingCat/wordbook/actions/runs/43571579491)
- [Run #772](https://github.com/WhiteWingCat/wordbook/actions/runs/43571583586)

Jobs: Chromium browser regression smoke tests; PostgreSQL 17 migration and allowance tests; Supabase CLI local Auth compatibility against disposable local services.

Cloudflare's PR deployment status reported a successful preview deployment for commit `8c4c494`. The owner independently confirmed the five requested UI/account-switching changes in that preview.

## Merge result

PR #5 was merged on **2026-11-14 at 07:52:23 UTC**.

- Feature head: `8c4c4949be68f2b372def13ce75c8ec67b67405e`
- Merge commit: `3ca194f908356f85aed1c143c647ebf488e9a353`
- The repository's `main` branch was re-fetched after merge and confirmed to point to that merge commit.
- PR state was confirmed as closed and merged.

## Production and privacy boundaries

- No production Supabase migration or production data operation was run.
- The successful feature preview and Git merge do not by themselves prove the main-branch hosting deployment or production database migration has completed.
- The final changes add no new personal-data fields, analytics, tracking or third-party content.
- Continue to apply Malaysia PDPA and general legal/privacy planning to future feature expansions. This archive is not legal advice or a compliance certification.

## Next milestone

The next planned release remains **Update 2.4.0 — Quiz**, followed by **Update 2.5.0 — Flashcards**. Both remain planned, not implemented. Before new feature work, review data minimisation, content licensing and applicable Malaysia/international legal considerations.
