# SwiftDictionary session archive — 2026-11-14 (second owner review)

## Session purpose

Continue the existing Update 2.3.1 feature branch after the owner reviewed the prior preview and reported seven further refinements. The owner explicitly stated the Dashboard is in a good place and should not receive further changes for now.

## Owner feedback

1. Fix permanent lesson translation refresh when switching translation language.
2. Improve Simplified Chinese translations in Daily Learning while keeping English learning prompts, grammar terms, answer choices and examples in English where they are the learning context.
3. Remove the dark semi-transparent backdrop behind the left-side activity panel and add content inset spacing.
4. Present Daily Discovery using dictionary-style details without previous/next navigation.
5. Ensure Daily Topic, Application and Revision are account-personalised; mock users should differ and resetting mock data should rotate their selections. Daily Discovery stays globally shared by UTC date.
6. Combine examples into one Examples box and remove “More examples”.
7. Open permanent lessons on a dedicated page rather than expanding the reader in the lesson library.

## Implementation and recovery point

Repository: [WhiteWingCat/wordbook](https://github.com/WhiteWingCat/wordbook)

- Branch: `feature/update-2-3-1-bug-fix-and-changes`.
- PR #5: [Update 2.3.1](https://github.com/WhiteWingCat/wordbook/pull/5), open and unmerged.
- Latest commit: `d1af4357fdbca0b86765ebba22750457eb9b62a5`.
- Changed: `index.html`, `daily-learning.js`, `mock-testing.js`, `tests/browser/update-2-3-0-smoke.spec.js`, `tests/update-2-3-0/check-frontend.mjs`, `tests/update-2-3-1/mock-testing.test.mjs`.

### Translation

- Centralised translation refresh for dictionary, permanent lesson, Daily Learning cards and an open activity reader. Profile preference save calls the same refresh.
- Fixed a retained-reader state reference that caused answer feedback to disappear during translation rerender.
- Added Simplified Chinese titles for all 28 Daily Topics and 25 Daily Applications, and Chinese UI labels for Daily Learning headings, preference labels, cards, status and reader controls.
- Added Chinese usage-note translations for all 12 Daily Discovery words.
- English grammar questions, answer choices, examples and headwords remain English. Chinese explanation text accompanies the English learning context.
- Daily Discovery RPC now explicitly passes null topic/difficulty metadata so global word sessions match the private approved catalogue.

### Activity reader

- Transparent backdrop, left-side slide-in panel, inset padding and mobile spacing.
- Daily Discovery uses dictionary-style headword, pronunciation, part of speech, definition, examples and usage note; no previous/next controls.
- All examples are in one Examples box; “More examples” has been removed.

### Personalised selection and mock reset

- Account-derived selection offset for Daily Topic/Application/Revision. Daily Discovery remains solely UTC-date-selected and globally shared.
- Adaptive revision still ranks weaknesses first and only uses account-derived selection among equally ranked candidates.
- Mock adapter exposes a session-storage generation counter. Reset increments it, preserves unrelated session keys and clears mock user stores; the new generation changes the personalised activity choices after reload.
- The generation counter is test-only and not a production profile field or backend table.

### Permanent lesson page

- Moved lesson reader to a dedicated `lessonDetailPage` panel. Opening a permanent lesson navigates to this page; its back control returns to Lessons.
- Hash handling safely returns to Lessons if the detail route is opened without an active lesson.
- Translation refresh rerenders the active lesson from the source lesson record while preserving practice state.

## Validation

Latest CI: [run #549](https://github.com/WhiteWingCat/wordbook/actions/runs/43553866219).

All three jobs passed:
- Chromium browser regression: 15 tests passed, including translation refresh, Discovery dictionary layout and permanent lesson page navigation.
- PostgreSQL 17 migration and allowance tests passed, including frontend/RPC and mock-adapter tests.
- Disposable local Supabase Auth compatibility and security-advisor checks passed.

Earlier CI failures were corrected before run #549: bilingual UI assertions were updated, the mock reset test now preserves unrelated session-storage values, the activity reader state reference was fixed, Discovery padding is tested on the inner content area, and the frontend timezone helper extraction boundary was updated.

## Dashboard scope freeze

No Dashboard redesign or statistics changes were made in this pass, in accordance with the owner's explicit request.

## Legal, privacy and safety

- No new production personal-data field, table, raw-answer collection or learner profiling category was added.
- Account-derived content offset is computed client-side and not stored or sent as a new data field. Do not log it.
- Mock generation is stored only in session storage in the explicit mock preview.
- Preserve existing RLS, account isolation, aggregate-only practice data and allowance behavior.
- Malaysia PDPA and global privacy/age obligations remain project-wide review items. This is not a compliance certification.
- No production migrations, data changes, PR merge or production deployment were performed.

## Next testing step

1. Continue on the existing feature branch; PR #5 remains open and unmerged.
2. Latest PR head: `d1af4357fdbca0b86765ebba22750457eb9b62a5`.
3. Wait for Cloudflare to rebuild the owner-confirmed preview host `feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev`.
4. Test with `?swiftMock=1` and fictional Test User A/B only. The preview still references the production Supabase configuration outside mock mode; never use real accounts or data-changing tests.
5. Test translation switching while permanent lessons and Daily Activities are open, panel appearance, Discovery dictionary format, consolidated examples, A/B personalised daily activities, shared Discovery, reset rotation and lesson page/back navigation.
6. Dashboard remains frozen. Spoken-frequency corpus ranking remains future work; the current Discovery list is curated.
7. Wait for owner feedback before further application changes. Do not merge or deploy without explicit approval.
