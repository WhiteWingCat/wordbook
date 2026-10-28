# SwiftDictionary v14 — J, K, L, Q, X, Y, and Z Vocabulary Expansion

SwiftDictionary is a lightweight, GitHub Pages-compatible vocabulary-learning website for English and Simplified Chinese. This release expands the English course with less-common scientific, technical, historical, academic, and professional vocabulary. The Chinese character collection is intentionally unchanged in v14.

## What's new in v14

- Expanded the English dictionary from **631 to 692 entries** with 61 additional terms.
- Focused the new vocabulary on the underrepresented starting letters **J, K, L, Q, X, Y, and Z**, including terms from physics, biology, linguistics, ecology, computing, statistics, history, and professional communication.
- Added learner-oriented definitions, pronunciation guides, example sentences, usage tips, and Chinese glosses for the new entries.
- Kept the existing Chinese course and its **106 single-character entries** unchanged.
- Retained the existing search, course switching, word details, saved-word interface, and account features.
- Added a Google account chooser prompt at sign-in so people sharing a device can more easily select a different account.

## Main features

- English vocabulary grid with search and part-of-speech filters.
- Simplified Chinese character grid, with one Han character per tile and pinyin-aware search.
- Expanded entry details, examples, usage notes, and Chinese glosses where available.
- Saved words and account-based cloud synchronization when Supabase is correctly configured.
- Google sign-in and sign-out through Supabase Auth.
- Feedback page, if `feedback.html` is included in the repository.
- Responsive layout for desktop and mobile browsers.

## Publish or update on GitHub Pages

1. Back up the current `index.html` and `README.md` before replacing them.
2. Replace `index.html` with the one in this release.
3. Replace `README.md` with this file if you want the repository documentation updated.
4. **Keep your existing `supabase-config.js` unchanged.** It contains your project's public Supabase URL and publishable/anon key. Do not replace it with a placeholder configuration.
5. Keep the other existing site assets and pages, such as `feedback.html` and `banner.svg`, in their current locations.
6. Commit the changes and wait for GitHub Pages to finish deploying.
7. Open the published site and hard-refresh it (`Ctrl + F5` on Windows) if the old version remains cached.

The website's publishing folder must contain `index.html` at its root. If GitHub Pages is configured to publish from a subfolder, place the files in that configured folder instead.

## Supabase and account privacy

The site uses a public frontend, so only a Supabase **publishable/anon key** belongs in the browser configuration. Never put a Supabase `service_role` key or Google OAuth client secret in this repository.

For saved-word cloud sync, the Supabase table must have Row Level Security (RLS) enabled and policies that restrict each authenticated user to their own rows. Do not remove or weaken these policies. Signing out should clear the active account's words from the current interface; signing into another Google account should load that account's saved words, not the previous account's.

The Google account chooser asks Google to show an account-selection step during sign-in. Google may still remember accounts on the device; SwiftDictionary sign-out ends the SwiftDictionary session, not necessarily the Google browser session itself. Users should choose their own account on shared devices and sign out when finished.

## Vocabulary and learning accuracy

The English entries and example sentences in this expansion were written as learner-oriented explanations rather than copied from a proprietary dictionary. Specialized terminology can have different meanings depending on the discipline, and the included Chinese glosses are concise learning aids rather than certified translations. Verify high-stakes legal, medical, scientific, or professional usage against authoritative references before relying on it in formal work.

The Chinese character component explanations and pinyin aids in the existing course are also intended for learning support, not as a complete expert linguistic or etymological audit. Context-dependent readings and specialist definitions may require further review.

## Privacy and limitations

- GitHub Pages serves the public frontend; it does not itself provide private server-side storage.
- Account authentication and cross-device saved-word synchronization depend on the configured Supabase project and its access policies.
- Never place private credentials, service-role keys, or OAuth client secrets in public files.
- This project is an educational vocabulary resource, not a substitute for professional medical, legal, financial, or scientific advice.

## Legal and content notes

Vocabulary words and technical terms can generally be listed, but definitions, example sentences, translations, images, audio, and third-party datasets may be protected or licensed separately. Use independently written content or material with a license that permits the intended use, and retain attribution or license notices where required. Reassess licensing if the project later adds third-party datasets or paid learning features.

## Release history

- **v14:** Added 61 English vocabulary entries focused on J, K, L, Q, X, Y, and Z (692 English entries total); preserved the 106-entry Chinese character course and account features.
- **v13:** Added 81 advanced English vocabulary entries (631 English entries total); preserved the 106-entry Chinese character course; prompts Google sign-in users to choose an account.
- **v12:** Added 97 less-common English terms (550 English entries total); Chinese course unchanged.
- **Earlier releases:** Built the English and Simplified Chinese courses, character-first Chinese grid, pinyin-aware search, expanded entry details, saved words, and Supabase-based account support.
