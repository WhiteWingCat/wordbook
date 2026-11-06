# SwiftDictionary v19 — Chinese Learning Review & Stroke Order

SwiftDictionary is a GitHub Pages-compatible vocabulary-learning website for English and Simplified Chinese. This release consolidates the Chinese pinyin and character-structure review, adds interactive stroke-order lessons, and retains the existing English vocabulary, dictionary search, saved words, and Supabase account workflow.

## What is included in this release

- `index.html` — the updated application.
- `feedback.html` — the feedback page.
- `THIRD_PARTY_NOTICES.md` — third-party attribution and license summary.
- `ARPHICPL.TXT` — the unmodified Arphic Public License text associated with the Hanzi Writer stroke-data project.
- `RELEASE-QA.md` — the review scope, test results, and items that still need live-site verification.

## Main learning features

- English vocabulary course with 692 entries, IPA/pronunciation fields, Chinese glosses, examples, and word-only search.
- Simplified Chinese course with 106 single-character entries, pinyin-aware search, contextual phrase pinyin, related words, and character-structure explanations.
- Chinese stroke-order lesson with animated playback, pause/resume, replay, previous/next stroke controls, and a stroke progress indicator.
- Translation-language switching in the entry detail panel.
- Saved words, Google sign-in, sign-out, and account-based cloud synchronization through Supabase.
- Responsive interface for desktop and mobile browsers.

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

Definitions, Chinese glosses, example sentences, and character notes are learner-oriented explanations, not certified translations or specialist references. Context-dependent readings and specialized terminology can require further review. Do not rely on the content as the sole source for legal, medical, financial, or other high-stakes decisions.

## Release history

- **v19:** Consolidates the Step 4 Chinese linguistic review and interactive stroke-order lesson; retains the 692-entry English course and 106-entry Chinese course; includes pinyin phrase corrections and third-party notices.
- **v18 and earlier:** Earlier vocabulary, pronunciation, gloss, account, and synchronization improvements are retained as the baseline for this release.
