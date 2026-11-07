# SwiftDictionary Update 2.1.0 — Consolidated QA Record

## Update 2.1.0 scope and implementation

- Added five primary navigation destinations: Dictionary, Lessons, Quiz, Flashcards, and Profile.
- Dictionary remains the default route and retains the existing unlimited search, course switch, translation switch, filters, saved words, and word-detail renderer.
- Lessons, Quiz, and Flashcards render Coming Soon pages and are directly addressable through the in-app hash routes `#lessons`, `#quiz`, and `#flashcards`.
- Profile is signed-in only; a signed-out Profile request redirects to Dictionary.
- Profile includes total activity, today's activity, languages represented in the activity log, expandable progress details, daily allowances, and account preference controls.
- Preferences include display name, learning language, translation language, and IANA timezone. Matching learning/translation languages are allowed.
- Profile preferences are created lazily after sign-in. The browser timezone is used as the initial default; the user can change it in Profile.
- The UI shows Free defaults of 5 uses per day per category and Premium defaults of 12. No payment/checkout feature was added.
- Activity usage is counted at session start by category across the user's learning languages. Dictionary lookups and saved words are not counted.
- Activity rows contain activity type, language code, and timestamp only.

## Supabase migration and security checks

- Applied additive migrations to the connected SwiftDictionary Supabase project. Existing `saved_words` table was not modified.
- Migration records: `swiftdictionary_update_2_1_0_foundation`, `swiftdictionary_update_2_1_0_quota_validity_and_timezone`, `swiftdictionary_update_2_1_0_prevent_quota_backdating`, `swiftdictionary_update_2_1_0_timezone_change_guard`, `swiftdictionary_update_2_1_0_allow_matching_languages`, and `swiftdictionary_update_2_1_0_harden_data_api_grants`, and `swiftdictionary_update_2_1_0_serialize_timezone_and_quota`.
- Added `languages`, `profiles`, `user_preferences`, `user_entitlements`, `learning_plan_limits`, and `learning_activity_log`.
- Verified RLS enabled on all six new tables.
- Verified owner-scoped policies for profile, preferences, entitlement, and activity records.
- Verified anon/authenticated grants after hardening: anonymous clients can read only language and plan-limit reference tables; user-owned data is not granted to anon. Authenticated users can read/write only their own allowed rows under RLS. Entitlements are read-only to browser clients.
- Verified quota and timezone triggers exist and all custom trigger functions are `SECURITY INVOKER`.
- Quota trigger checks the authenticated owner, entitlement status and validity window, IANA timezone, plan/category limit, and transaction lock; it overrides client-supplied timestamps to prevent backdating.
- Timezone changes are blocked after learning activity has been recorded during the user's current local day.
- Initial configured limits: Free 5/day per category; Premium 12/day per category.
- Existing saved-word row count was 23 at the post-migration inspection; existing saved-word policies remained present. No saved-word data migration was run.
- Supabase Auth configuration was not changed. The pre-existing leaked-password protection warning remains outside this update's scope.

## Static source checks

- HTML parser: passed.
- Inline JavaScript syntax check with Node.js: passed after the navigation/profile changes.
- Existing English and Chinese vocabulary arrays were retained from Update 1.1.0.
- Existing `supabase-config.js` script reference remains; the config file is deliberately excluded from the release archive.
- Existing `banner.svg` asset remains external and must be retained in the deployment repository.
- Existing authentication and saved-word functions were retained and extended only with a profile refresh after sign-in; they were not replaced.

## Not verified in this static review

No live browser session or browser automation environment was available. The following checks must be performed by the owner on the deployed GitHub Pages site before public launch:

1. Verify Dictionary opens by default and the five navigation items remain on one row with horizontal scrolling where needed on narrow screens.
2. Open `#lessons`, `#quiz`, and `#flashcards` directly and confirm each Coming Soon page renders. Test browser Back/Forward navigation.
3. While signed out, select Profile and open `#profile`; confirm both redirect to Dictionary. While signed in, open Profile and confirm it loads.
4. Confirm Profile displays the correct account email, learning overview, activity details, and configured daily allowances.
5. Change display name, learning language, translation language, and timezone; save; refresh; confirm preferences persist and dictionary selectors reflect the saved languages.
6. Confirm timezone validation rejects invalid IANA identifiers and that changing timezone after a recorded activity during the current local day is blocked.
7. Confirm account switching still works on desktop and mobile, and Profile state does not leak between Google accounts.
8. Confirm existing English/Chinese word searches, pinyin search, translation switching, word details, stroke-order animation, and saved-word behavior remain intact.
9. Confirm saved words remain isolated per account and persist after refresh and account switching.
10. Test quota behavior in a controlled test account: each category's sixth Free start is rejected; category limits are independent; concurrent starts cannot exceed the configured limit; timezone midnight and daylight-saving transitions reset correctly; changing the timezone cannot be used to reset an already-used daily allowance.
11. Confirm unauthenticated API access to user-owned tables is denied and one signed-in account cannot read or change another account's profile, preferences, entitlements, or activity.
12. Confirm `banner.svg` and the existing `supabase-config.js` load from their existing repository paths.

## Legal and privacy review

- The new Profile and progress features process personal data: optional display name, language preferences, timezone, entitlement status, and learning-activity timestamps.
- Activity logging is minimized and does not store answers, responses, word history, or device identifiers.
- Before public deployment, update the privacy notice with data categories, purposes, retention, Supabase processing, account/data deletion method, and quota behavior.
- The intended audience is 16+ and global; age and privacy rules vary by jurisdiction. This review is not a legal compliance certification.
- No subscription checkout, payment provider, or paid feature was introduced. Dictionary search remains unlimited and ungated.

## Release/deployment status

- This is a development build pending owner live-browser verification and final release approval.
- No GitHub Pages deployment was performed.
- `supabase-config.js` and `banner.svg` are intentionally excluded from this ZIP; retain the existing working files.

---



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
- The underlying saved-word persistence and Supabase auth-state workflow from Update 1.1.0 was retained; this update adds profile loading after authentication without replacing the account-switching flow.
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
