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


## Personal lesson testing access — account-specific allowance exception

- Added a private database-side allowlist for the single authenticated account approved by the owner for lesson testing.
- The allowlist table is in the non-exposed `private` schema, has RLS enabled, and grants no table access to browser roles. Users cannot add or change their own exemption.
- The authenticated trigger still verifies that the request belongs to `auth.uid()`, validates the user's timezone, checks that the activity is enabled for the account's plan, and records every lesson start in `learning_activity_log`.
- Only lesson starts by the allowlisted account skip the daily quota count. Quiz, Flashcard, and every other activity type retain their configured limits; all other accounts retain normal limits.
- Added the read-only `is_personal_learning_test_access()` RPC so the signed-in UI can display **Unlimited — Personal testing access** for the exempt account; the frontend display is informational and does not enforce the exception.
- The exception is intended for internal QA only. Remove the allowlist row and revoke the temporary access when testing is complete.

### Required verification

1. Sign in with the allowlisted account and confirm the Lessons page displays **Unlimited** and identifies personal testing access.
2. Open all nine lessons, including starting more lessons than the normal daily allowance; confirm each start succeeds and each activity is still logged.
3. Sign in with a separate non-exempt account that has exhausted its allowance; confirm a new lesson start is still rejected by the database trigger.
4. Confirm resuming an existing lesson and revisiting a completed lesson remain free for both accounts. Confirm the exception does not affect other activity categories.
5. Confirm neither account can read or modify the private allowlist table through the Supabase Data API.
6. Confirm the personal testing status RPC returns false for every non-allowlisted account and does not expose the allowlist contents.

### Legal and privacy note

- This is an account-specific internal testing exception, not a public plan or subscription entitlement.
- It does not change dictionary access, paid-feature plans, or other users' daily limits.
- Keep the allowlist restricted to the owner-approved account, document its removal after QA, and do not publish the UUID in client-side source or public documentation.


## Lesson practice answer randomization and question coverage

- Practice answer options are shuffled independently each time a learner enters a lesson, including when reopening an in-progress or completed lesson.
- The correct answer index is recalculated from the shuffled option order; feedback and completion checks must still validate the correct option.
- A lesson's option order is kept stable while the learner remains in the lesson, including when switching the translation language, so selections and progress are not disrupted.
- Re-entering the same lesson generates a different option order from the immediately previous entry whenever a question has multiple options.
- Existing multi-question lessons remain supported through the `practices` array. Current content coverage: **Choose a, an or the** has four practice questions; the other eight lessons currently have one each.

### Required verification

1. Enter each of the nine lessons and confirm the correct answer is not always shown in the middle position.
2. Leave and re-enter each lesson; confirm option positions are reshuffled and the correct answer is still accepted.
3. Switch translation language while inside a lesson; confirm option order stays stable, translated prompts/options refresh, and practice progress is preserved.
4. Confirm wrong options remain incorrect after shuffling and correct options still receive correct feedback.
5. Complete every practice question and confirm automatic lesson completion still works.
6. Confirm the four-question Articles lesson still renders all questions and requires all of them to be answered correctly.
7. Expand question coverage for additional lessons after agreeing on the target question count and content scope.


## Lesson practice expansion — initial nine-lesson collection

- Expanded each of the eight lessons that previously had one question to **three original practice questions each**. The Articles lesson retains its four questions.
- The initial collection now contains **28 practice questions** across nine lessons: eight lessons × three questions, plus four Articles questions.
- Added matching Simplified Chinese prompts and options for the new questions. English example sentences remain in English where they are the subject of the grammar exercise; explanatory prompts and meaning choices are localized.
- Existing answer-position randomization continues to shuffle each question's options on lesson entry and remap the correct answer index.
- Every question remains required for automatic lesson completion; learners must answer all questions correctly.
- These nine lessons are the initial lesson catalogue, not a permanent product limit. Future updates can add lessons and difficulty/topic collections without changing this initial count.

### Static checks after expansion

- Eight English lesson records now use three practice questions each: passed.
- Articles lesson retains four questions: passed.
- Matching Chinese practice arrays contain three translated questions for each expanded lesson: passed.
- Existing question-answer indexes and option arrays are present: passed.
- Existing lesson translation resolver, per-entry option shuffling, answer remapping, and automatic completion flow remain in place: source inspection passed.

### Browser verification still required

1. Open all nine lessons in English and Simplified Chinese; confirm the expected 3/4 question counts and no missing translations.
2. Verify all 28 questions, including correct and incorrect answer feedback.
3. Re-enter lessons and confirm answer choices reshuffle while correctness remains accurate.
4. Confirm translation switching preserves current selections, checked progress, and answer order.
5. Confirm a lesson is marked completed only after all its questions are answered correctly and the save succeeds.
6. Confirm lesson progress, daily allowance behavior, personal testing access, account switching, saved words, and unlimited dictionary search remain intact.
7. Confirm the lesson catalogue can be expanded later without changing the meaning of the nine initial lessons.

### Legal/content note

- Newly added questions and answer choices are original SwiftDictionary educational content, not copied from third-party workbooks or paid course materials.
- Continue reviewing linguistic accuracy and avoid reproducing proprietary question banks, textbook exercises, or licensed content without permission.
\n\n## Latest lesson-library expansion — 12-lesson catalogue

This section supersedes the earlier nine-lesson / 28-question count above. The nine original lessons remain the initial permanent catalogue; this expansion adds three more lessons rather than replacing or limiting the original collection.

- Beginner now includes **Build useful verb combinations** (do homework, make breakfast, take a break, catch a bus).
- Intermediate now includes **Recognise word families and affixes** (prefixes, suffixes, word families, and grammatical form).
- Advanced now includes **Distinguish near-synonyms precisely** (including imply/infer and economic/economical).
- The library now contains **12 lessons**, with four lessons at each difficulty level.
- Each of the three new lessons has four original practice questions, bringing the full library to **40 questions** (the original 28 plus 12 new questions).
- Matching Simplified Chinese lesson content and practice prompts/options were added for all three lessons. English terms remain in English where they are the learning target.
- Existing practice randomization, correct-answer remapping, translation switching, progress persistence, and automatic completion logic were not intentionally changed.

### Static verification for this expansion

- All 12 lesson IDs occur once in the English lesson data and once in the Simplified Chinese translation map.
- The new English lesson records each contain four practice questions.
- Inline JavaScript syntax compilation: passed.
- Live browser interaction, database progress, and allowance behaviour have not yet been tested for this expansion.

### Browser verification still required

1. Confirm all 12 lessons appear under the correct difficulty and topic filters.
2. Open the three new lessons in English and Simplified Chinese; verify explanations, examples, prompts, and all four questions.
3. Test correct and incorrect feedback for all 12 new questions; confirm answer shuffling does not change correctness.
4. Switch translation language during a new lesson and confirm selections, practice progress, and option order remain stable.
5. Complete each new lesson and confirm completion is saved only after every question is answered correctly.
6. Confirm the new lessons use the existing allowance and progress rules: one charge on first start, no extra charge on resume/revisit.
7. Recheck saved words, Google sign-in, account switching, and unlimited dictionary search.

### Legal and content review

- The three lessons, explanations, examples, questions, and answer options are original SwiftDictionary educational material.
- The new content does not reproduce third-party textbook exercises or proprietary question banks.
- Word meanings and usage distinctions have been reviewed for general accuracy, but a native-speaker or qualified language-editor review remains advisable before public release.
- This is an additive content expansion; no subscription gate or change to unlimited dictionary search was introduced.


## Further grammar expansion — 15-lesson catalogue

This section supersedes the preceding 12-lesson / 40-question status. The three additional lessons broaden the grammar foundation while retaining the original lessons and the first vocabulary expansion.

- Beginner: **Use countable and uncountable nouns** — singular/plural forms, much/many, and quantity expressions such as a piece of advice.
- Intermediate: **Choose first and second conditionals** — realistic future possibilities versus hypothetical situations.
- Advanced: **Understand mixed conditionals** — past conditions with present results and present conditions with past results.
- The catalogue now contains **15 lessons**, with five lessons at each difficulty level.
- The complete catalogue contains **52 original practice questions**, with matching Simplified Chinese prompts and options for all 52.
- All three new lessons have four questions each. The original nine lesson records and the three vocabulary lessons remain in place.
- Existing answer randomization, answer-index mapping, translation selection, progress and completion logic were not intentionally changed.

### Static verification for this expansion

- All 15 lesson IDs appear once in the English lesson data and once in the Simplified Chinese translation map.
- Each difficulty contains five lessons.
- Each new lesson contains four English practice questions and four matching Chinese practice questions.
- All English questions have three options and a valid correct-answer index.
- Inline JavaScript syntax compilation: passed.
- No live browser test has been performed.

### Browser verification still required

1. Confirm all 15 lessons appear in the correct difficulty and topic filters.
2. Open the three new grammar lessons in English and Simplified Chinese; review the teaching notes, examples, and all four questions.
3. Test correct and incorrect feedback, including answer randomization.
4. Switch translation language during practice and verify selections and progress are preserved.
5. Complete each new lesson and confirm the save succeeds before completion is shown.
6. Confirm starting, resuming, and revisiting these lessons follows the existing allowance rules.
7. Recheck authentication, account switching, saved-word isolation, and unlimited dictionary search.

### Legal and content review

- The new explanations, examples, questions, and options are original SwiftDictionary learning content.
- No third-party question bank, workbook, or textbook exercise was copied.
- Grammar rules have been checked for general accuracy. A qualified language editor or native-speaker review is still recommended before public release.
- This is a content-only expansion. It introduces no subscription gate and does not restrict dictionary search.
