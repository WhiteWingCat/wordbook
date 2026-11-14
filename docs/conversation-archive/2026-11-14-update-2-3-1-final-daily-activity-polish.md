# SwiftDictionary Update 2.3.1 — final daily activity polish and rollover

**Date:** 2026-11-14  
**Repository:** WhiteWingCat/wordbook  
**Feature branch:** feature/update-2-3-1-bug-fix-and-changes  
**Pull request:** [#5](https://github.com/WhiteWingCat/wordbook/pull/5)  
**Latest application commit:** 99dc69446ca56459c344915711ed2169c909b0c4

## Purpose and owner feedback

The owner raised six final refinements before considering the feature branch ready for main: remove the activity panel outline; make the Daily Learning reset/plan/context status respond to translation changes; remove duplicate cooldown text; improve definition contrast in Daily Discovery and lessons; ensure unfinished activities reset after the daily boundary; and close the reader after successful completion. The Dashboard remains unchanged.

## Implementation

### Reader presentation and readability

- Removed the activity reader border while retaining the transparent backdrop, panel spacing, rounded outer corners and shadow.
- Set lesson definition text and Daily Discovery definition text to the primary foreground colour for better contrast.
- No Dashboard changes were made.

### Translation refresh and cooldown text

- Added renderDailyStatus() to rebuild the Daily Learning reset explanation in the currently selected translation language.
- The refreshed text includes the allowance timezone, plan, English-learning-context note, deferred timezone-change notice and English-course guidance.
- The shared translation refresh updates this status along with Daily Learning labels, cards and an open activity reader.
- Completion success and refresh-error messages also respect the selected translation language.
- Kept the cooldown preview and removed the second, repeated allowance-exhaustion message.

### Unfinished activity rollover

The previous loader queried all in-progress sessions without restricting them to the current allowance day. That could leave yesterday's unfinished session resumable.

The updated loader compares each in-progress session's started_at against the current allowance-day interval in the user's effective allowance timezone. A session outside the current interval is marked abandoned through the existing abandon_daily_activity_session RPC before cards render. Only same-day in-progress sessions remain resumable.

This is a lazy rollover cleanup: it runs the next time Daily Learning loads after local midnight, not as a background job at the exact boundary. Until that next load, the old row may still have database status in_progress. The next load performs cleanup before showing resumable sessions.

Abandonment does not count as completion and does not consume allowance. Only successful completion consumes the daily allowance. Completed-session history remains intact.

### Completion closes the reader

After complete_daily_activity_session returns a confirmed saved session, the reader closes immediately and the activity list/allowance display refresh. If the completion RPC fails, the reader remains open so the learner can retry.

## Tests and validation

Browser coverage checks:
- Daily Learning status switching Chinese → English → Chinese while an activity reader is open.
- Zero-width reader border and primary-foreground definition text.
- Reader closure after confirmed completion.
- Expiry and abandonment of a previous-day in-progress session, followed by creation of a fresh session.

[GitHub Actions run #557](https://github.com/WhiteWingCat/wordbook/actions/runs/43556612276): all three jobs passed.
- Chromium browser regression: 16 tests passed.
- PostgreSQL 17 migration and allowance tests: passed.
- Disposable local Supabase Auth compatibility and security advisors: passed.

An earlier browser attempt failed because a test expected an English completion confirmation while its fixture selected Simplified Chinese. The implementation correctly returned the translated Chinese confirmation; the assertion was updated and the subsequent full CI run passed.

## Legal, privacy and data safety

- No new personal-data field, table, tracking event, raw answer collection, learner-profile category or database migration was added.
- Rollover updates the status of an existing user-owned session through the established server RPC and account-scoped access controls.
- No new personal data is collected, transmitted or logged.
- This is not a legal-compliance certification. Malaysia PDPA and applicable global privacy and age obligations remain project-wide considerations.

## Current state and next step

- PR #5 remains open and targets main.
- Latest feature head: 99dc69446ca56459c344915711ed2169c909b0c4.
- No PR merge, production database operation or production deployment has occurred.
- Cloudflare preview rebuild of the latest commit has not been independently confirmed. The owner should use the existing preview host with ?swiftMock=1 and fictional Test User A/B only.
- Owner retest should focus on the six refinements, especially an activity left unfinished across local midnight and successful completion closing the panel.
- Dashboard remains out of scope.
