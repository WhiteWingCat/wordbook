# Update 2.3.1 — activity content quality, allowance enforcement and completed reviews

**Date:** 2026-11-14  
**Feature branch:** `feature/update-2-3-1-bug-fix-and-changes`  
**Pull request:** #5 (open; not merged)  
**Validated code/test commit:** `8fb19e183f524277fc9b5c133e8860d79a4a975b`  
**CI:** [Run #705](https://github.com/WhiteWingCat/wordbook/actions/runs/43565545461)

## Owner feedback

The owner tested the mock preview and reported four issues:

1. Daily Application and Daily Revision reused identical examples and Q&A. The activities must provide different material.
2. Users could still navigate into new lessons after using their daily completion allowance, for both Premium and Free plans.
3. Users should be able to review content they already completed after using their allowance.
4. Some strings presented as examples were actually questions.

No allowance amounts or prior product decisions were changed.

## Implementation

### Separate Application and Revision content

- Added an explicit set of two example sentences for each of the 25 Daily Application items.
- Added separate, topic-specific Daily Revision materials for all 13 revision topics. Each revision topic has its own examples and Q&A, rather than borrowing the source Application questions.
- Updated `makeRevisionContent` to use the dedicated Revision material.
- Removed the renderer's conversion of practice-question prompts into example sentences. Only explicit example fields are now rendered in the Examples section.
- Added source checks for complete examples, question/example separation, and non-reuse of Application examples or Q&A by the corresponding Revision topic.
- Added browser coverage confirming both activities render real examples independently of their practice questions.

### Enforce exhausted allowances

- Daily activity cards now disable the start action when the user's category allowance is exhausted. This applies to Free and Premium according to their existing plan limits.
- The permanent Lessons library now reads the server-side allowance ledger through `get_my_learning_allowance_usage`, displays the correct remaining count, and disables unstarted lessons at zero remaining.
- `openLesson` rechecks the allowance before inserting a new progress row, so a stale or bypassed UI state cannot start a new lesson after the allowance has been used.
- Previously started lessons can still be resumed under the existing free-resume rule. Their eventual completion remains subject to the server-side completion allowance.
- Updated the mock adapter to enforce the same new-session and replay behavior.

### Review completed content for free

- Daily Topic, Daily Application and Daily Revision now show the user's completed items from the current local allowance day as separate review cards.
- Daily Discovery also preserves completed review cards when the global UTC schedule changes during the user's local allowance day. These are review-only cards and do not expose additional new scheduled entries or consume another allowance.
- The Daily Learning start RPC now checks for an exact previously completed session before validating the current schedule, plan visibility or activity preference. A legitimate completed session can therefore be reopened after quota exhaustion, UTC schedule rollover or a plan change.
- New content still passes the private approved-catalogue validator and existing plan-specific slot checks. The change does not allow a new session to bypass Free/Premium restrictions.
- Permanent completed lessons remain available to review at no additional allowance cost.

## Validation and test evidence

GitHub Actions **run #705** completed successfully against code/test commit `8fb19e183f524277fc9b5c133e8860d79a4a975b`:

- **Chromium browser regression:** 21 tests passed. Coverage includes Free and Premium lesson limits, completed lesson review, independent Application and Revision examples/Q&A, Daily Topic review after exhaustion, Discovery review across UTC rollover, plan visibility, translation refresh, local-midnight expiry and existing Dashboard/account regressions.
- **PostgreSQL 17 migration and allowance tests:** passed. This includes the new assertion that reopening an exact completed Daily Topic session after the Free allowance is exhausted returns the saved completed session without incrementing usage, as well as existing ledger, catalogue, direct-RPC, concurrency and deletion assertions.
- **Supabase CLI local Auth compatibility:** passed against disposable local services, including Auth schema/roles/JWT compatibility and security-advisor checks.

Intermediate failures were corrected before the final successful run. These included question-form examples, duplicate examples in one Revision topic, locale-specific test expectations, and a rollover test using a display word instead of the approved stable Discovery content ID. One earlier Supabase CLI setup attempt was rate-limited by GitHub's release API; the complete final run #705 succeeded.

## Legal, privacy and data handling

- The new examples and Revision questions were authored for SwiftDictionary. No third-party dictionary corpus, licensed question bank or external frequency dataset was imported.
- No new personal-data fields, tracking, answer-level telemetry or global learner-completion records were added.
- Completion and review records remain account-scoped. The approved content catalogue remains private and RLS-protected.
- The standing Malaysia PDPA and general privacy review remains applicable. No new legal or data-source issue was introduced by these corrections. If Premium is commercialised later, subscription pricing, renewal, cancellation/refund and consumer disclosures still require separate review.
- This is an engineering/privacy planning review, not a legal-compliance certification.

## Release boundary and owner preview

- PR #5 remains open and unmerged.
- The SQL migration remains a draft; no production Supabase migration, production data operation, merge or deployment was performed.
- Dashboard scope remains frozen.
- The Cloudflare Pages rebuild for the latest feature head has not been independently confirmed. After confirming the preview rebuild, use only the mock preview and fictional Test User A (Free) / Test User B (Premium):
  `https://feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev/?swiftMock=1`
- Owner retest checklist:
  1. Confirm Daily Application and Daily Revision show different examples and different Q&A for the relevant topics.
  2. Confirm every example is an actual sentence/example, not an exercise prompt.
  3. Use Free to exhaust one daily-category allowance and Premium to exhaust three; confirm new content cannot be started after the limit.
  4. Confirm completed daily content remains reviewable without reducing or increasing allowance usage.
  5. Confirm completed Discovery content remains reviewable across UTC rollover while the local allowance day is still active.
  6. Confirm Free completed lessons remain reviewable after five completions and Premium completed lessons after fifteen.
  7. Confirm unfinished activities still follow the existing local-midnight expiry behavior and translations continue to refresh in place.
- Do not merge PR #5 or deploy until the owner explicitly approves.
