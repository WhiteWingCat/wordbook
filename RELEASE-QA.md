# SwiftDictionary Update 2.2.0 — Development QA Record

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


## Lesson feedback follow-up — automatic completion and reader polish

- Removed the separate manual "Finish lesson" control. A lesson is now marked completed only after every practice question has been answered correctly.
- Completion is saved to the existing `lesson_progress` row; it does not insert a new lesson-start activity and therefore does not consume another daily allowance.
- Practice inputs and answer-check controls are locked while the completion update is being saved, preventing a late answer change or duplicate submission. If the update fails, controls are restored and the learner can retry.
- The Chinese lesson practice resolver now reads the singular `practice` translation object as well as the existing plural `practices` array. Previously, most translated question prompts silently fell back to English.
- Improved practice question cards, answer-choice states, progress display, and completion feedback for narrow and wide layouts.
- Applied explicit high-contrast foreground styling to the sentence-part highlights inside the lesson reader to override browser-default `mark` text rendering.
- No Previous/Next lesson navigation controls are rendered inside the lesson reader; learners return to the lesson library using Back to lessons.

### Static checks after the feedback changes

- Inline JavaScript syntax compilation: passed.
- Manual completion button absent from the reader markup: passed.
- Automatic completion is called only when all practice answers are correct: passed.
- Chinese translation lookup supports both singular and plural practice structures: passed.
- Lesson-reader highlight foreground override present: passed.
- Previous/Next lesson navigation controls absent from the reader renderer: passed.

### Additional live-browser checks still required

1. Complete a lesson with all correct answers and verify the library immediately shows **Completed** without a separate button.
2. Confirm a wrong answer can be retried and that changing a previously correct answer requires checking it again.
3. Simulate a failed Supabase completion update and confirm the lesson remains **In progress**, an error is visible, and the learner can retry.
4. Confirm completing a lesson does not consume a second daily lesson-start allowance.
5. Check all nine lesson prompts in Simplified Chinese, including practice questions, while confirming English answer examples remain readable where they are intentionally part of the exercise.
6. Check sentence-part highlight contrast in the dark theme on desktop and mobile.
7. Re-test account switching, per-account progress isolation, saved words, and unlimited dictionary search.


## Follow-up feedback — completion navigation and live translation switching

- Added a **Back to lessons** action at the bottom-right after a lesson has been successfully saved as completed.
- Changing the global translation language now immediately refreshes the active lesson and lesson-library topic labels without requiring page navigation.
- The translation refresh preserves checked answer selections and already-verified practice progress, so changing languages mid-lesson does not force the learner to restart practice.

### Additional browser checks

1. Complete a lesson and confirm the bottom-right **Back to lessons** action appears below the practice section only after the completion save succeeds.
2. Change translation language while viewing a lesson; verify the lesson title, explanation, examples, mistakes, topic and practice prompts refresh immediately.
3. Change translation language after answering some practice questions; verify selections and correct-answer progress remain intact.

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


## Follow-up fixes — account menu and selector persistence

- [x] Profile removed from the horizontal primary navigation.
- [x] Top-right account menu exposes Sign in when signed out; Profile, Preferences, Switch account, and Sign out when signed in.
- [x] Profile icon picker offers 12 built-in icons and stores the selection per account in `profiles.avatar_icon`; signed-out selection is local to the browser.
- [x] Menu supports outside-click and Escape dismissal and reports expanded state accessibly.
- [x] Learning course and translation-language selectors restore their stored values on page load.
- [x] Selector changes persist to local browser preferences and synchronize to the signed-in user's Supabase preferences row.
- [x] Profile loading waits for pending preference writes before re-reading preferences.
- [x] Existing `saved_words` table and policies remain untouched.

### Manual browser checks still required

1. Signed out: open the top-right menu, choose an icon, navigate between Dictionary and Coming Soon pages, and confirm the icon and course selectors remain selected after refresh.
2. Signed in: choose an icon and confirm it remains after refresh and after signing out/in to the same account.
3. Switch between two Google accounts and confirm each account retains its own icon, learning course, and translation language.
4. Change course and translation language, open Profile, return to Dictionary, and confirm neither selector resets.
5. Use Preferences from the account menu and confirm it opens Profile at Account preferences.
6. Confirm Switch account signs out the current account and opens the Google sign-in dialog.
7. Confirm direct `#profile` navigation still redirects signed-out visitors to Dictionary.
8. Recheck mobile layout and account-menu dismissal.

Static JavaScript syntax validation was run for this follow-up build. Live-browser testing is not claimed.


## Update 2.2.0 development status
- Lessons placeholder replaced with English lesson library and reader.
- Three difficulty levels, each with three initial authored lessons and independent progress.
- Topic filtering, learning goals, explanation, examples, common mistakes and practice feedback.
- Progress sync uses owner-scoped Supabase tables; practice results store aggregate counts only.
- First lesson start inserts one progress record; an AFTER INSERT trigger records the existing `lesson` allowance. Existing records are reused on resume/revisit.
- Concurrent duplicate starts are handled by re-reading the unique existing progress row; no second charge is created.
- Database guard prevents changing lesson identity and prevents completed progress from reverting.
- Existing `saved_words`, authentication and `supabase-config.js` were not changed.
- Static browser testing and live GitHub Pages checks are pending. Do not deploy before owner review.


## Update 2.2.0 — lesson experience refinements (development)

- Lesson library uses one horizontal row per lesson, with progress aligned at the right: Completed, In progress, or Not started. Status colours are supplemented by text labels.
- Objectives, explanation, examples, and common mistakes are grouped into one teaching-content panel. Practice questions use a separate panel.
- Practice accepts multiple questions for topics that benefit from them, while retaining compatibility with the original single-question lesson data.
- The articles lesson now has four practice questions and a visual cue panel distinguishing first mention, identifiable nouns, and vowel sounds.
- The sentence-basics lesson has a labelled subject/verb/object breakdown.
- A prominent Lessons-page allowance panel shows new lesson starts remaining, plan limit, configured timezone reset, and one-remaining / exhausted states. It counts today's lesson activity rows using configured timezone day boundaries; the database trigger remains the enforcement authority.
- A quota rejection displays an explicit message explaining that resuming an existing lesson and revisiting completed lessons remain free.
- Existing lesson start/resume/complete database flow and saved-word/authentication code were not intentionally changed.

### QA status
- Source changes committed to the feature branch only.
- No live browser session was available for this pass. The revised lesson list, practice interactions, responsive layout, timezone boundary display, quota rejection message, and progress status colours remain to be tested in a browser.
- The sentence breakdown currently presents semantic labels as visual chips; inline highlighted sentence treatment remains a refinement item.
- Translation-language support currently localizes selected interface labels only. Full lesson-content translation remains outstanding and must not be represented as complete.
- Confirm the lesson-start trigger can insert into learning_activity_log under authenticated RLS and grants; verify with a signed-in test account before deployment.
- No deployment to GitHub Pages was performed.
