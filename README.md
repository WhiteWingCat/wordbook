# SwiftDictionary Update 2.2.0 — English Lessons Foundation

SwiftDictionary is a GitHub Pages-compatible vocabulary-learning website for English and Simplified Chinese. This update introduces an English Lessons foundation with Beginner, Intermediate and Advanced levels, a topic-filtered lesson library, guided lesson reader, multi-question practice where appropriate, visible lesson-start allowances, and account-synchronised lesson progress. Quiz and Flashcards remain Coming Soon. The English and Simplified Chinese dictionary courses, stroke-order lesson, Google authentication, account switching, and saved-word synchronization are retained.

## Release contents

- `index.html` — the application and vocabulary data.
- `feedback.html` — the feedback page.
- `THIRD_PARTY_NOTICES.md` — third-party attribution and license summary.
- `ARPHICPL.TXT` — the unmodified Arphic Public License text associated with the Hanzi Writer stroke-data project.
- `RELEASE-QA.md` — static review results and required live-site checks.

The existing `banner.svg` and `supabase-config.js` remain external project files and are not included in this archive.

## What's new

- Five-page navigation: **Dictionary**, **Lessons**, **Quiz**, **Flashcards**, and **Profile**.
- Dictionary remains the default page and its English/Chinese word-grid search remains free and unlimited.
- Lessons provides a topic-filtered library with Beginner, Intermediate and Advanced levels, separate progress per difficulty, a focused lesson reader, and practice. Quiz and Flashcards remain Coming Soon. The current development catalogue contains 15 lessons (five per difficulty) and 52 original practice questions, with English and Simplified Chinese lesson content.
- Pages can be opened directly using the in-app hash routes `#dictionary`, `#lessons`, `#quiz`, `#flashcards`, and `#profile`.
- Profile is restricted to signed-in users. Signed-out visitors who select or directly open Profile are redirected to Dictionary.
- Profile includes a learning overview, expandable activity and daily-allowance details, and account preferences for display name, learning language, translation language, and IANA timezone. The Lessons page also shows remaining daily new-lesson starts and the configured timezone reset.
- Daily activity allowances are configured in Supabase by plan and activity category. Initial values are Free: 5 starts per day per category; Premium: 12 starts per day per category. Premium entitlement infrastructure is present, but no payment, checkout, or subscription purchase flow is included.
- Daily resets use each user's configured timezone. A timezone change is blocked after learning activity has been recorded for that user's current local day.
- Learning activity records store only activity type, language code, and timestamp; they do not store answers, response content, or word-level activity.
- The quota check runs in a database trigger, serializes concurrent checks per user/category, and overrides client-supplied timestamps to prevent backdating.

## Retained features

- English word-only search; searching does not match definitions or Chinese translations.
- Chinese character search and pinyin search without tone marks.
- Translation-language switching in the detail panel.
- Chinese character structure lessons and runtime stroke-order animation with pause/resume, replay, previous/next stroke controls, and progress display.
- Saved words, Google sign-in, sign-out, and account-based cloud synchronization through Supabase.
- Responsive desktop and mobile interface.
- Existing dictionary lookup remains unlimited and is not counted against lesson, quiz, or flashcard allowances.

## Updating the existing GitHub Pages project

1. Back up the current repository before replacing files.
2. Replace `index.html`, `README.md`, and `feedback.html` with the corresponding files in this release.
3. Add `THIRD_PARTY_NOTICES.md`, `ARPHICPL.TXT`, and `RELEASE-QA.md` to the repository root.
4. **Keep your existing `supabase-config.js` unchanged.** This release intentionally does not contain your project-specific Supabase URL or public anon/publishable key. The application still loads `supabase-config.js` separately.
5. Keep the existing `banner.svg` at the same relative path used by `index.html`, plus any other existing project assets and repository files that are not replaced by this release.
6. The additive Update 2.1.0 Supabase migrations have already been applied to the connected SwiftDictionary project. Do not re-run them manually. If deploying to a different Supabase project, review and apply the migration SQL from the project migration record after backing up that database.
7. Do not deploy this release until the owner has completed the review and explicitly approved deployment.
8. Commit and push the changes, then wait for GitHub Pages to deploy.
9. Open the live site and hard-refresh it (`Ctrl + F5` on Windows) if the previous version remains cached.

The GitHub Pages publishing folder must contain `index.html` at its root. If Pages publishes from a subfolder, update that configured folder instead.

## Supabase and account safety

- Only a Supabase publishable/anon key belongs in the public browser configuration. Never place a `service_role` key or Google OAuth client secret in this repository.
- Keep Row Level Security enabled on the saved-word table, with policies that restrict each authenticated user to their own rows. Do not weaken or remove those policies.
- Signing out should clear the active account's saved words from the interface. Signing into another Google account should load that account's own saved words.
- The Google account chooser can ask Google to show account selection, but the browser may still remember Google accounts. On shared devices, users should verify which account they selected and sign out when finished.

## Update 2.1.0 Supabase data model and security

The connected Supabase project has received additive migrations for `languages`, `profiles`, `user_preferences`, `user_entitlements`, `learning_plan_limits`, and `learning_activity_log`. The existing `saved_words` table, rows, constraints, and policies were left unchanged.

- Row Level Security is enabled on all six new tables.
- Profiles and preferences are owner-scoped. Entitlements are readable by their owner but cannot be changed by browser clients.
- Learning activity is owner-scoped. Inserts require an authenticated user and are subject to database-side daily limits.
- Public/anonymous clients can read only active language and plan-limit reference rows; they cannot access user-owned profile, preference, entitlement, or activity records.
- Premium access is not self-assignable by a user. No billing provider is connected.
- The quota trigger uses invoker rights, validates IANA timezones, respects entitlement validity dates, uses a per-user transaction lock, and prevents timestamp backdating.
- The default entitlement for accounts without a valid entitlement record is Free.

The database migration history is recorded in Supabase. Keep a copy of the migration SQL with the project's source-control history before future schema changes. Never publish a Supabase `service_role` key or Google OAuth client secret.

## Privacy and legal preparation

Profile names, language preferences, timezone settings, entitlement status, and learning-activity timestamps are personal data when linked to an account. Before public deployment, update the privacy notice to explain the categories collected, purposes, retention, Supabase processing, account/data deletion route, and how daily allowances work. Collect only the fields needed for these features. The timezone field is an IANA timezone setting, not a precise location. No answers or detailed word-level learning history are collected by this foundation.

This is a product-risk checklist, not a legal compliance certification. The intended audience is 16+ and global, so age-related and privacy obligations vary by users' locations. Review applicable laws and obtain qualified advice before public launch, introducing payments, or marketing to younger users. No subscription or payment processing is included in this update.

## Stroke-order library and licensing

The application loads Hanzi Writer 3.7.3 from jsDelivr and requests character stroke data from `hanzi-writer-data@2.0.1` at runtime. The Hanzi Writer JavaScript library is MIT-licensed. The character data is separately licensed under the Arphic Public License; the upstream project identifies it as data derived from Make Me a Hanzi and Arphic fonts. The stroke-data JSON is not bundled in this release. The relevant attribution and license information is included in `THIRD_PARTY_NOTICES.md` and `ARPHICPL.TXT`.

This is a practical licensing check, not formal legal advice. Before bundling stroke data locally, modifying it, or introducing paid features that rely on it, review the current upstream license terms and the exact distribution arrangement again. The dictionary search remains available without a subscription; no subscription gating has been added in this release.

## Vocabulary and learning accuracy

Definitions, Chinese glosses, example sentences, and character notes are learner-oriented explanations, not certified translations or specialist references. Phrase pinyin was expanded using character-level readings and automated Han-Latin transliteration, with known context-sensitive readings corrected where identified. Automated transliteration is not a substitute for a full native-speaker linguistic review; polyphonic characters and unusual contexts should be checked during ongoing content QA. Do not rely on the content as the sole source for legal, medical, financial, or other high-stakes decisions.

## Release history

- **SwiftDictionary Update 2.1.0:** Adds shared navigation, signed-in Profile, preferences, progress overview, configurable learning limits, and Coming Soon placeholders; adds the Supabase learning/profile foundation while preserving dictionary, authentication, and saved-word behavior.
- **SwiftDictionary Update 1.1.0:** Adds 100 common English entries and 100 Chinese characters; expands per-sense examples and pinyin coverage; retains v19 authentication, saved-word, search, translation, and stroke-order functionality.
- **v19:** Consolidated the Chinese linguistic review and interactive stroke-order lesson, with 692 English entries and 106 Chinese entries.


## Update 2.1.0 interface refinements

- The Profile entry is accessed from the top-right account menu rather than the main navigation row.
- The account menu provides Sign in, Profile, Preferences, Switch account, and Sign out actions as appropriate to the current authentication state.
- Users can choose from the built-in profile icons. Signed-in users' icon choice is stored with their profile; signed-out users' choice is kept locally on that browser.
- Learning course and translation-language selections are remembered locally and, when signed in, synchronized to that account's `user_preferences` row immediately. This prevents page navigation from resetting the selectors. Preferences remain account-specific after sign-in.
- The account menu closes on outside click or Escape.

The avatar icon is a small profile preference, not an identity-verification feature. No additional activity tracking is introduced by these changes.


## Update 2.2.0 — English Lessons Foundation

- The permanent lesson library currently contains **15 lessons**: five each at Beginner, Intermediate, and Advanced. The catalogue can grow in later content updates; 15 is not a cap.
- The lessons cover grammar, vocabulary, word formation, conditionals, and precise word usage.
- The current catalogue contains **52 original practice questions**, with corresponding Simplified Chinese lesson content and practice prompts/options.
- Each difficulty has independent learning progress. Learners can browse the library while signed out; signing in is required to start and sync lessons.
- Lesson completion is automatic after every practice question is answered correctly and the completion update is successfully saved.
- Practice answer options are shuffled on lesson entry, with correct-answer mapping preserved. Changing translation language during practice preserves the learner's current answers and progress.
- Starting a lesson for the first time consumes one lesson-start allowance. Resuming an unfinished lesson and revisiting a completed lesson are free.
- Daily allowances reset at midnight in the user's configured IANA timezone. The database trigger remains the enforcement authority.
- The owner's personal testing exception is stored in a private database allowlist, is limited to lesson starts for that account, and does not affect other users or other activity categories. Its account UUID is not stored in this repository.
- Additive Supabase schema: `SUPABASE-MIGRATION-2.2.0.sql`. The private testing allowance setup is recorded in `supabase/migrations/202611090001_swiftdictionary_personal_lesson_testing_allowlist.sql`; the owner-approved allowlist row is seeded separately through a private database operation. Review migration history before applying SQL again.
- Quiz and Flashcards remain Coming Soon and are scheduled for their respective roadmap updates.
- Dictionary search remains free and unlimited. This update does not introduce subscription gating.

### Verification and release notes

- The owner reports browser testing passed for all lessons, Simplified Chinese translation switching, shuffled answer options, completion saves, and progress tracking.
- Static source checks passed for inline JavaScript syntax, unique lesson IDs, matching English/Chinese question coverage, and valid answer indexes.
- GitHub Pages deployment is a separate action and is not triggered merely by merging this branch.
- Keep `supabase-config.js` and `banner.svg` intact when preparing the Pages deployment.
