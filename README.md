# SwiftDictionary Update 1.1.0

SwiftDictionary is a GitHub Pages-compatible vocabulary-learning website for English and Simplified Chinese. This update expands the everyday English vocabulary and single-character Chinese course while retaining the v19 learning interface, stroke-order lesson, account workflow, and saved-word synchronization.

## Release contents

- `index.html` — the application and vocabulary data.
- `feedback.html` — the feedback page.
- `THIRD_PARTY_NOTICES.md` — third-party attribution and license summary.
- `ARPHICPL.TXT` — the unmodified Arphic Public License text associated with the Hanzi Writer stroke-data project.
- `RELEASE-QA.md` — static review results and remaining live-site checks.

## What's new

- English course expanded from 692 to **792 entries**, including 100 additional common, practical words for greetings, everyday communication, actions, objects, places, and daily situations.
- The new English entries include IPA, Chinese glosses, distinct common senses, contextual examples, and usage notes.
- Simplified Chinese course expanded from 106 to **206 unique single-character entries**, adding 100 characters.
- Added character-level and phrase-level pinyin coverage for the new Chinese content, including a context-specific reading for `背` in the schoolbag example.
- Added examples to every individual English sense so meanings are illustrated separately.

## Retained features

- English word-only search; searching does not match definitions or Chinese translations.
- Chinese character search and pinyin search without tone marks.
- Translation-language switching in the detail panel.
- Chinese character structure lessons and runtime stroke-order animation with pause/resume, replay, previous/next stroke controls, and progress display.
- Saved words, Google sign-in, sign-out, and account-based cloud synchronization through Supabase.
- Responsive desktop and mobile interface.

## Updating the existing GitHub Pages project

1. Back up the current repository before replacing files.
2. Replace `index.html`, `README.md`, and `feedback.html` with the corresponding files in this release.
3. Add `THIRD_PARTY_NOTICES.md`, `ARPHICPL.TXT`, and `RELEASE-QA.md` to the repository root.
4. **Keep your existing `supabase-config.js` unchanged.** This release intentionally does not contain your project-specific Supabase URL or public anon/publishable key. The application still loads `supabase-config.js` separately.
5. Keep any other existing project assets and repository files that are not replaced by this release.
6. Commit and push the changes, then wait for GitHub Pages to deploy.
7. Open the live site and hard-refresh it (`Ctrl + F5` on Windows) if the previous version remains cached.

The GitHub Pages publishing folder must contain `index.html` at its root. If Pages publishes from a subfolder, update that configured folder instead.

## Supabase and account safety

- Only a Supabase publishable/anon key belongs in the public browser configuration. Never place a `service_role` key or Google OAuth client secret in this repository.
- Keep Row Level Security enabled on the saved-word table, with policies that restrict each authenticated user to their own rows. Do not weaken or remove those policies.
- Signing out should clear the active account's saved words from the interface. Signing into another Google account should load that account's own saved words.
- The Google account chooser can ask Google to show account selection, but the browser may still remember Google accounts. On shared devices, users should verify which account they selected and sign out when finished.

## Stroke-order library and licensing

The application loads Hanzi Writer 3.7.3 from jsDelivr and requests character stroke data from `hanzi-writer-data@2.0.1` at runtime. The Hanzi Writer JavaScript library is MIT-licensed. The character data is separately licensed under the Arphic Public License; the upstream project identifies it as data derived from Make Me a Hanzi and Arphic fonts. The stroke-data JSON is not bundled in this release. The relevant attribution and license information is included in `THIRD_PARTY_NOTICES.md` and `ARPHICPL.TXT`.

This is a practical licensing check, not formal legal advice. Before bundling stroke data locally, modifying it, or introducing paid features that rely on it, review the current upstream license terms and the exact distribution arrangement again. The dictionary search remains available without a subscription; no subscription gating has been added in this release.

## Vocabulary and learning accuracy

Definitions, Chinese glosses, example sentences, and character notes are learner-oriented explanations, not certified translations or specialist references. Phrase pinyin was expanded using character-level readings and automated Han-Latin transliteration, with known context-sensitive readings corrected where identified. Automated transliteration is not a substitute for a full native-speaker linguistic review; polyphonic characters and unusual contexts should be checked during ongoing content QA. Do not rely on the content as the sole source for legal, medical, financial, or other high-stakes decisions.

## Release history

- **SwiftDictionary Update 1.1.0:** Adds 100 common English entries and 100 Chinese characters; expands per-sense examples and pinyin coverage; retains v19 authentication, saved-word, search, translation, and stroke-order functionality.
- **v19:** Consolidated the Chinese linguistic review and interactive stroke-order lesson, with 692 English entries and 106 Chinese entries.
