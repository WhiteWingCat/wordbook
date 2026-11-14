# SwiftDictionary Update 2.3.1 — owner feedback: activity rows, allowance indicator and Premium mock allowance

**Date:** 2026-11-14  
**Implementation branch:** `feature/update-2-3-1-bug-fix-and-changes`  
**Pull request:** [#5](https://github.com/WhiteWingCat/wordbook/pull/5)  
**Latest implementation commit:** `d1c9be67b2d37578cd46bad6c4b123b644d75386`  
**Validation run:** [GitHub Actions #763](https://github.com/WhiteWingCat/wordbook/actions/runs/43570440623) — completed successfully; all three jobs passed.

## Owner feedback

The owner reviewed the four-category Daily Learning tabs and requested five refinements:

1. Each activity card must occupy one full-width row. Three Premium cards must not be compressed into a single three-column row because the right-side Review completed content action causes text to wrap and become crowded.
2. Allowance counts must not appear on activity cards; the count belongs beside the active category title only.
3. The category allowance indicator should be clean, centered and color-coded according to remaining allowance.
4. Premium mock account must show the established permanent lesson limit of 15 rather than the Free limit of 5.
5. Category tabs should be slightly larger and use white text for clarity.

## Implementation

### Daily activity cards and allowance indicator

- Changed the Premium category layout from three columns to one column. Premium still receives up to three distinct activity cards; they are vertically stacked as separate full-width rows.
- Free remains one card per category.
- Kept each card's Start, Resume or Review completed content action at the right side of its row.
- Removed the numeric remaining-allowance status from each unstarted activity card; unstarted cards now use a neutral “New activity” status. In-progress and completed/review labels remain unchanged.
- Moved the category's remaining count into a compact indicator beside the active category title.
- Centered the count and its “remaining today” label inside the indicator. Added semantic color states: green for more than two-thirds remaining, amber for more than one-third through two-thirds remaining, and red for one-third or less, including exhausted.
- Kept category-level reset explanations beneath the category title and did not change allowance amounts or enforcement.
- Increased tab padding and font weight/size; active and inactive tab labels now use white text. Focus-visible styling remains.

### Permanent lesson Premium mock allowance and account switching

Investigation found that the mock fixture already defines Premium as 15 permanent lesson completions and Free as 5, and its mock completion RPC enforces those respective values. The visible mismatch was caused by the permanent Lessons view not refreshing its progress and allowance after an account switch; the displayed allowance could therefore remain from the previously active account.

- Updated account refresh to reinitialize permanent lesson progress and reload the entitlement-based allowance after signed-in or signed-out account refresh.
- This ensures the lesson library's displayed allowance is recalculated from the newly active account's plan rather than retaining the prior account's display state.
- No plan limit, entitlement schema, SQL migration or production account data was changed.

### Regression coverage

- Added a mock test confirming the Free fixture has a 5-lesson limit and the Premium fixture has a 15-lesson limit.
- Added a mock RPC enforcement test that completes 15 Premium permanent lessons successfully and verifies the 16th completion is rejected.
- Extended the frontend regression checker to require lesson allowance refresh during account refresh and to verify the category allowance presentation and removal of card-level numeric allowance status.
- Existing tests continue to verify Free/Premium daily activity allowances and account-isolated mock state.

## Commits

- `b58de685d8e1ed27be73ab1205c4e5570af95420` — initial layout, indicator and allowance test changes.
- `427cdcb9be72a7f91a0e615db381bf320b42fa57` — refresh permanent lesson allowance after account switching and add the 15-completion Premium enforcement test.
- `d1c9be67b2d37578cd46bad6c4b123b644d75386` — correct the test to inspect Free and Premium plan limits within their respective isolated mock fixtures.

An intermediate CI run exposed a test-fixture assumption: the mock database exposes only the currently selected plan's limit rows, not both plans simultaneously. The test was corrected to assert Free's limit before switching to Premium, then assert Premium's limit after switching. The separate Premium 15-completion enforcement test passed in the earlier run.

## Validation status

GitHub Actions run **#763** completed successfully against commit **`d1c9be67b2d37578cd46bad6c4b123b644d75386`**. All three jobs passed:
- **Chromium browser regression smoke tests:** passed, including the isolated mock adapter and frontend regression checker.
- **PostgreSQL 17 migration and allowance tests:** passed, including allowance enforcement, frontend syntax/RPC integration, migration/policy/ledger assertions, concurrency and history-deletion checks.
- **Supabase CLI local Auth compatibility:** passed against disposable local Supabase services, including Auth schema/roles/JWT helpers, migration/policy assertions and security-advisor checks.

An earlier intermediate mock test failure was due to incorrectly expecting both plan rows to exist in one isolated mock fixture. The test was corrected to inspect each plan in its own mock identity. Final run #763 passed, including the Premium 15-completion RPC enforcement test.

## Privacy, legal and release boundaries

- Changes are limited to presentation, client-side account-refresh behavior and mock-only regression coverage.
- No new personal data, analytics, tracking, answer-level telemetry, external content or third-party corpus was introduced.
- No database schema, migration, allowance amount or production data was changed.
- Malaysia PDPA and general privacy planning remains applicable; this patch introduces no new category of personal-data processing. This is not a legal-compliance certification.
- PR #5 remains open and unmerged. No production migration, production data operation or deployment was authorized or performed.

## Owner retest checklist

After the Cloudflare Pages feature preview rebuilds the latest branch head, use only the mock preview and fictional Test User A (Free) / Test User B (Premium):

`https://feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev/?swiftMock=1`

1. Confirm each Premium category shows up to three separate full-width activity rows, not three columns.
2. Confirm Start, Resume and Review completed content actions remain aligned at the right of each row and the text has sufficient room.
3. Confirm no numeric remaining allowance appears on individual activity cards.
4. Confirm the allowance indicator appears beside the active category title, is centered and changes color as remaining usage decreases.
5. Confirm the category reset explanation remains below the title when exhausted.
6. Switch between Test User A and Test User B while Lessons is open. Confirm Free shows 5 total permanent lesson completions and Premium shows 15, with the correct remaining count after switching.
7. Complete 15 Premium permanent lessons in mock mode and verify a 16th new completion is blocked; completed lessons remain reviewable.
8. Confirm category tabs are slightly larger and white-text labels are clear on active and inactive tabs.
9. Recheck mobile widths and Chinese/English translation refresh.

Do not merge PR #5, apply production migrations, or deploy without explicit owner approval.
