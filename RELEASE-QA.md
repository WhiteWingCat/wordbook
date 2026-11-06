# SwiftDictionary v19 — Final Review & QA Record

## Source and content checks

- 692 English entries and 106 Chinese entries were parsed from the release source.
- Every English entry has a word, pronunciation field, English definition, and Chinese gloss. Six English entries have no `related` value; this field is optional and is not required for every entry.
- All 106 Chinese headwords are unique and exactly one character long.
- All Chinese definition/example lines containing Han characters have phrase-level pinyin entries after the two final corrections in v19.
- All related-word segments in the Chinese course contain supplied pinyin; the renderer passes that pinyin through rather than replacing it with a per-character default reading.
- The source retains phrase-specific pinyin handling for polyphonic readings and contextual tone changes.
- The Chinese structure notes remain alongside the stroke-order lesson.

## Feature and compatibility checks

- Hanzi Writer 3.7.3 is loaded from jsDelivr; character data is requested from `hanzi-writer-data@2.0.1` when a Chinese detail opens.
- The stroke lesson includes playback, pause/resume, replay, previous/next stroke controls, and a stroke progress display.
- The source retains the `supabase-config.js` external script reference; the project-specific configuration file is deliberately not included in this patch ZIP.
- The authentication/saved-word code lines referencing Supabase auth, `saved_words`, cloud sync, account changes, and sign-out are byte-for-byte identical to the v18 baseline source.
- No service-role key or Google OAuth client secret was added.

## Automated static checks

- Inline JavaScript syntax check with Node.js: passed.
- HTML parsing: passed.
- Duplicate element IDs: none found.
- English entries: 692; no blank pronunciation or Chinese-gloss fields.
- Chinese entries: 106; unique and single-character.
- Contextual Chinese pinyin coverage: no missing phrase-map entries for Chinese definition/example lines.
- Related-word pinyin format: no missing supplied readings.
- Release archive integrity and required file presence: checked before delivery.

## User-reported local browser checks

The user reported that the following tests passed on the local HTML copy:

- Stroke-order lesson and the stroke-data checker.
- Translation-language switching; the character, pinyin, example, and structure lesson remained intact.
- English word-only search.
- Chinese character search.
- Chinese pinyin search without tone marks.

## Live-site checks still required after the user uploads v19

- Save English words and Chinese characters, refresh the live site, and confirm both sets persist without duplicates.
- Sign out and sign in to another Google account; confirm saved words remain isolated and account switching works in the updated release.
- Recheck the mobile layout and live CDN stroke-data loading on the deployed version if possible.

The user's earlier account-switching test on the existing live site passed, but the updated v19 release still requires a fresh live-site check. No deployment has been performed by this review.
