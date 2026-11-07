# SwiftDictionary Update 1.1.0 — Consolidated QA Record

## Content scope and counts

- English course: **792 unique entries**, up from 692 in v19 (+100).
- Simplified Chinese course: **206 unique single-character entries**, up from 106 in v19 (+100).
- No duplicate English headwords or Chinese headwords were found.
- No multi-character Chinese headwords were found in the Chinese grid dataset.
- All English entries have a word, pronunciation field, English definition, Chinese gloss, and examples.
- All Chinese entries have a character, pinyin field, English definition, Chinese definition, examples, and a structure note.
- The 100 English entries with multiple-sense data contain 244 individual senses. Every sense has its own definition, Chinese gloss, and contextual examples after this audit correction.
- The 35 senses in the first 14 entries that lacked per-sense examples were supplied with separate contextual examples.

## Pinyin review

- All characters appearing in Chinese-course definition and example text have a character-level pinyin mapping, so the detail renderer can show a pinyin line rather than silently dropping unmapped characters.
- Added phrase-level pinyin for 198 Chinese definition/example lines in the 100 new Chinese entries.
- Added/updated 100 new headword readings in the character map; the new character entries' explicit pinyin fields were used as the source for their headword mappings.
- Added a context-specific phrase reading for `他背着书包去学校。` (`bēi` for 背, meaning to carry).
- Automated Han-Latin transliteration was used to fill missing phrase and character readings. This is a coverage improvement, not a complete expert linguistic certification. Polyphonic characters and context-dependent readings still warrant native-speaker spot-checking.
- Related-word rendering continues to preserve pinyin supplied in related-word strings.

## Static code and compatibility checks

- HTML parser: passed.
- Inline JavaScript syntax check with Node.js: passed.
- Duplicate HTML element IDs: none found.
- Required English fields: no missing values.
- Required Chinese fields: no missing values.
- English sense examples: no missing values.
- Chinese character grid: all headwords are exactly one character.
- Displayed Chinese definition/example text: no Han characters remain without a character-level pinyin mapping.
- English search predicate remains word-only; Chinese pinyin matching remains enabled.
- External `supabase-config.js` script reference remains present; the project-specific config is deliberately not included in the release archive.
- The saved-word persistence code and Supabase auth-state listener sections checked against v19 are byte-for-byte identical to the v19 source.
- No new third-party JavaScript library or local stroke-data bundle was added.

## Existing feature preservation

The source retains the v19 implementation for translation-language switching, Chinese character structure lessons, Hanzi Writer stroke-order controls, saved words, Supabase authentication, account switching, and cloud synchronization. The authentication listener and saved-word persistence sections compared during this audit match v19 byte-for-byte.

## Not verified in this static review

No live browser session was available for this review. The following must be checked by the site owner after uploading the release to GitHub Pages:

1. Open English and Chinese details; verify text layout, scrolling, per-sense examples, and pinyin placement.
2. Switch translation language in both courses and confirm the selected language is reflected in definitions.
3. Search English words and confirm matches are based on the word only; search Chinese by character and pinyin without tone marks.
4. Open several newly added Chinese characters and verify stroke data loads from the CDN; test play, pause/resume, replay, previous/next, and progress controls.
5. Save English words and Chinese characters, refresh, and confirm saved words persist without duplicates.
6. Sign out, sign into a different Google account, and confirm each account sees only its own saved words. Repeat on a shared device if possible.
7. Recheck the mobile layout and account switching on the live GitHub Pages URL.

## Release packaging and legal notes

- `supabase-config.js` is intentionally excluded; retain the existing working file unchanged beside `index.html`.
- Existing external assets and repository files not included in this ZIP should be retained.
- Hanzi Writer remains loaded from jsDelivr and stroke data remains fetched at runtime. Attribution and the Arphic license text are included.
- Definitions, glosses, examples, and automated pinyin are educational content and should continue to receive linguistic review. Recheck third-party licensing before bundling data locally or introducing monetized features that depend on it.
- No deployment was performed as part of this QA.
