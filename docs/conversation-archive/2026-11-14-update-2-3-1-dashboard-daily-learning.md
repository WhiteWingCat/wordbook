# SwiftDictionary session archive — 2026-11-14

## Session purpose

Continue Update 2.3.1 on the existing feature branch after the owner tested the Cloudflare preview and supplied seven refinements for the Profile dashboard and Daily Learning.

## Owner feedback and requirements

1. Change active-course recency to relative elapsed time (for example, “Last active 3 days ago”).
2. Improve Activity overview with meaningful visualisation rather than plain text and counts.
3. Hide the next daily activity preview when the user's daily allowance is exhausted and the activity is in cooldown.
4. Make Daily Discovery global: all users receive the same subject each global day. Daily Topic, Daily Application and Daily Revision remain personalised.
5. Refocus Daily Discovery on less-common dictionary vocabulary. Keep the previous mixed discovery content for backlog or possible reuse elsewhere.
6. Open all daily activities in a left-side slide-in detail panel like Dictionary.
7. Provide more examples in relevant daily activity readers.

## Implementation

Repository: [WhiteWingCat/wordbook](https://github.com/WhiteWingCat/wordbook)

- Feature branch: `feature/update-2-3-1-bug-fix-and-changes`.
- PR #5: [Update 2.3.1](https://github.com/WhiteWingCat/wordbook/pull/5), not merged.
- Latest commit at session close: `562f9ad6c594083ddef064d3764d791681341170`.
- Changed `index.html` and `daily-learning.js`.
- `index.html`: relative active-language recency; activity-category bar visualisation; new styles for dashboard and Daily Discovery drawer; improved Daily Learning introduction.
- `daily-learning.js`: global UTC-date word selection; curated 12-word Daily Discovery pilot; cooldown placeholder instead of next-slot preview; modal-backdrop slide-in reader; explicit close/backdrop dismissal; dictionary-like discovery details; expanded examples and completed practice-question example sentences.
- The previous mixed discovery collection remains in the source but is no longer used by the active Daily Discovery selector.
- Existing per-user session RPCs and allowance logic remain in use.

## Important qualification: statistical frequency

The new 12-word pilot is curated and is **not yet statistically ranked from spoken-corpus frequency counts**. The reader explicitly labels the classification as curated rather than a live conversational-corpus ranking.

Research identified a candidate: Lingevo's spoken frequency list derived from approximately 3.1 million words of OANC Switchboard and Charlotte telephone/face-to-face conversation transcripts. Lingevo says its derived lists are unrestricted, including commercial use, with credit to Lingevo and OANC. This source is limited to an American-English conversation sample and should not be presented as globally representative.

References:
- https://lingevo.com/resources/
- https://anc.org/data/oanc/
- https://anc.org/OANC/index.html

Before implementing true statistical selection, obtain and inspect the actual frequency data, verify its terms/attribution, choose a defensible threshold and record corpus limitations. Do not describe the current curated pilot as corpus-ranked.

## Validation and test evidence

- JavaScript syntax validation passed for `daily-learning.js` and the inline app script in `index.html` after final JavaScript edits.
- Static assertions passed for relative timestamps, visual activity bars, UTC global word selection, cooldown preview suppression, slide-in drawer controls, expanded examples and dictionary-style definition.
- One syntax failure was found during an intermediate check: an apostrophe in the cooldown message terminated a single-quoted string. It was changed to a typographic apostrophe; syntax validation passed afterward.
- Latest GitHub Actions run at session close: [run #486](https://github.com/WhiteWingCat/wordbook/actions/runs/43549929803), still queued. It covers Chromium browser regression, PostgreSQL 17 migration/allowance checks and disposable local Supabase Auth compatibility. No pass/fail claim is made yet.
- Owner has not tested this latest set of changes. The next step is to wait for CI and then owner preview testing.

## Privacy, legal and safety review

- No new personal-data table, raw-answer collection or learner tracking category was added.
- The shared word is chosen client-side by UTC date. User sessions, completion and allowance data remain individual and account-scoped.
- Keep RLS and account isolation intact. Do not expose private allowance ledger data.
- Malaysia PDPA applicability and global age/privacy obligations remain project-wide review items. This change does not constitute a compliance certification.
- For future frequency-data reuse, verify Lingevo/OANC terms and attribution before redistribution. Preserve the distinction between spoken American-English sample frequency and universal English frequency.

## Recovery instructions

1. Continue on `feature/update-2-3-1-bug-fix-and-changes`; do not recreate the branch.
2. Check run #486; inspect failed job logs if any.
3. Wait for Cloudflare Pages to rebuild the preview at the owner-confirmed host: `feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev`.
4. Use `?swiftMock=1` and fictional Test User A/B only. Do not use real accounts or data-changing tests; preview still shares production Supabase configuration.
5. Test dashboard recency and bars, cooldown states, global discovery sameness, personalised other daily categories, drawer behavior, translation, examples, completion/replay/abandon.
6. Statistical spoken-frequency ranking is still pending; do not claim it is implemented.
7. Wait for owner feedback before further application changes. Do not merge, deploy or change production Supabase without explicit approval.

## Source conversation

ChatGPT conversation dated 2026-11-14 covering the owner's seven Update 2.3.1 refinements and the implementation handover.


### Follow-up validation and server-catalogue correction — 2026-11-14

- A first CI attempt failed because `tests/update-2-3-0/check-frontend.mjs` still expected the old `dailyDiscoveries` array. The test was updated to validate `dailyDiscoveryVocabulary` and its dictionary metadata.
- Further review found that dynamically generated global discovery IDs would be rejected by the server-side approved content catalogue. Corrected this before owner testing:
  - Each of the 12 vocabulary entries now has a stable approved base ID.
  - Session IDs use `approved-word-id:YYYY-MM-DD`, with the date based on the shared UTC day.
  - The private validator accepts only a valid date suffix whose base ID is active in the private catalogue, with null topic and difficulty.
  - The content-catalogue migration draft replaces the old 27 discovery rows with 12 approved vocabulary IDs.
  - Catalogue checker expectations now total 80 entries (28 Topic + 25 Application + 12 Discovery + 15 permanent lessons).
  - SQL assertions test valid date-scoped IDs, unknown IDs, malformed dates and forged topic metadata. The allowance test fixture was updated to use a date-scoped ID.
- Latest PR #5 head confirmed: `c2f7ab612e1d3f773eb5322296b77240e8a36e24`.
- Latest CI run [#499](https://github.com/WhiteWingCat/wordbook/actions/runs/43550190284) completed successfully: Chromium browser regression, PostgreSQL 17 migration/allowance tests and disposable local Supabase Auth compatibility all passed.
- The earlier run #495 failure was confined to the stale frontend checker expectation; run #499 includes the corrected checker, catalogue migration, date-scoped validator and updated allowance assertion.
- Static JavaScript syntax and catalogue matching checks also passed.
- This CI evidence does not replace owner preview testing. Cloudflare preview deployment for the latest commit has not been independently confirmed in this record.
- The current Daily Discovery set is still a curated pilot, not statistically ranked by spoken-corpus frequency. This remains a known content-quality limitation.
