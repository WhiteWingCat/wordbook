# Update 2.3.1 — Daily Learning category tabs and plan-sized activity rows

**Date:** 2026-11-14  
**Feature branch:** `feature/update-2-3-1-bug-fix-and-changes`  
**Pull request:** #5 (open; not merged)  
**Validated code/test commit:** `55ad7a12abaa462142a7c6e88b8466d11851040a`  
**CI:** [Run #749](https://github.com/WhiteWingCat/wordbook/actions/runs/43568453615)

## Owner feedback

After reviewing the previous allowance/content fixes, the owner requested one final Daily Learning layout adjustment:
- Replace the single all-activities list with category tabs for Daily Topic, Daily Application, Daily Discovery and Daily Revision.
- Show one activity card in a row for Free, or three activity cards in a row for Premium, following the permanent lesson-library layout.
- Place Start, Resume and Review completed content actions on the right side of each card row.
- When a category's daily allowance is exhausted, show the midnight-reset explanation below that category's title, not as an additional locked lesson card.

## Implementation

### Category tabs

- Replaced the combined activity-card list with four accessible tab buttons and one active tab panel.
- The selected category is retained when the list is rerendered after activity completion, preference changes or translation changes.
- The existing activity preference checkboxes remain in place. A paused category still has a tab and displays its paused state within the panel.
- Tab labels follow the selected translation language.

### Free/Premium activity rows

- Free users see one activity card in the active category.
- Premium users see three distinct activity cards in the active category.
- Daily Topic and Daily Application choose separate items for each Premium slot.
- Daily Revision keeps its highest-priority adaptive topic first, then uses different candidate topics for the remaining Premium slots so the three cards do not simply repeat one lesson.
- Daily Discovery retains the same global UTC schedule for every account; Free receives its first slot and Premium receives up to three.
- Completed content and in-progress sessions remain represented as review/resume cards. When a local allowance is exhausted, no new scheduled Discovery cards are shown; completed Discovery content remains available for review even if the UTC schedule has rolled over.
- Premium cards use a three-column desktop layout, with responsive reduction on narrower screens. Free cards use a single-column layout.
- Card content and its action are laid out horizontally, with Start, Resume or Review completed content aligned at the right side of the row.

### Allowance reset placement

- Removed the exhausted-allowance cooldown message from the lesson-card content.
- Each category panel now shows its own remaining allowance count and, once exhausted, the midnight-reset explanation directly beneath that category's title.
- The message uses the account's effective allowance timezone.
- Existing allowance values and server-side enforcement are unchanged.

### Accessibility and responsive behavior

- Category controls use tablist/tab/tabpanel semantics, selected-state attributes and focus handling.
- Tab navigation and card actions remain usable on mobile widths; Premium columns collapse responsively to avoid cramped cards.
- The existing permanent lesson navigation and Dashboard layout remain unchanged.

## Validation

GitHub Actions **run #749** completed successfully against code/test commit `55ad7a12abaa462142a7c6e88b8466d11851040a`:
https://github.com/WhiteWingCat/wordbook/actions/runs/43568453615

All three jobs passed:
- **Chromium browser regression:** 22 tests passed. Coverage includes all four category tabs; Free one-card and Premium three-card rows for each category; right-aligned actions; reset-message placement after Daily Topic completion; completed Discovery review across UTC rollover; existing lesson and daily-activity allowance enforcement; content review; translations; Dashboard; account switching and mock isolation.
- **PostgreSQL 17 migration and allowance tests:** passed. The UI-only layout change did not alter the database migration or allowance ledger. Frontend syntax/integration, approved-catalogue, direct-RPC, completion, review, concurrency and deletion checks passed.
- **Supabase CLI local Auth compatibility:** passed, including local Auth contract and security-advisor checks.

## Legal, privacy and release boundaries

- This is a presentation/navigation change using existing plan limits, activity preferences, completed sessions and content. It introduces no new personal-data fields, tracking, analytics, answer-level telemetry or external content source.
- No new dictionary/question corpus or licensed material was introduced.
- Malaysia PDPA and general privacy planning remains unchanged. Premium commercialisation still requires separate review of subscription pricing, renewal, cancellation/refund and consumer disclosures. This is a planning note, not a legal-compliance certification.
- Dashboard scope remains frozen.
- No production Supabase migration, production data operation, merge or deployment was performed.

## Current recovery point and owner preview handoff

1. Continue on `feature/update-2-3-1-bug-fix-and-changes`; PR #5 remains open and unmerged.
2. Latest feature code/test commit validated by CI: `55ad7a12abaa462142a7c6e88b8466d11851040a`.
3. Confirm Cloudflare Pages has rebuilt the latest feature head before the owner retests. Use the mock preview only:
   `https://feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev/?swiftMock=1`
4. Retest with fictional Test User A (Free) and Test User B (Premium):
   - Each of the four tabs appears and switches independently.
   - Free sees one card per category; Premium sees three.
   - Start/Resume/Review actions sit at the right side of each row.
   - Exhaust Daily Topic and confirm the reset message appears beneath the category title, without a locked cooldown card being inserted into the lesson list.
   - Completed content remains reviewable without consuming another allowance.
   - Discovery continues to respect the global schedule and the user's local allowance day.
   - Chinese/English translation refresh continues to work without navigating away.
5. Do not merge PR #5, apply production migrations or deploy until the owner explicitly approves.

## Earlier Update 2.3.1 context

The previous owner-reported content-quality and allowance fixes remain part of this same feature branch and are recorded in [the preceding archive](2026-11-14-update-2-3-1-activity-quality-allowance-and-review.md). This tab-layout change does not replace or reverse those fixes.
