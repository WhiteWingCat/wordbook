# SwiftDictionary v16 — English IPA Correction

SwiftDictionary is a lightweight, GitHub Pages-compatible vocabulary-learning website for English and Simplified Chinese. This release expands the English course with less-common scientific, technical, historical, academic, and professional vocabulary. The Chinese character collection is intentionally unchanged in v14.

## What's new in v16 (Step 2: English pronunciation)

- Step 1: preserved supplied pinyin in related-word strings and expanded Chinese pinyin coverage for definitions and examples.
- Step 2: filled the six previously blank English pronunciation fields: interpret, pattern, precise, process, relevant, and strategy.
- Cross-checked those six additions and corrected five clearly inconsistent existing IPA fields: ability, accurate, actually, achievable, and adaptable.
- Kept the 692 English entries and 106 Chinese entries unchanged.
- Retained existing search, course switching, saved-word interface, Supabase authentication, and account features.

## Main features

- English vocabulary grid with search and part-of-speech filters.
- Simplified Chinese character grid, with one Han character per tile and pinyin-aware search.
- Expanded entry details, examples, usage notes, and Chinese glosses where available.
- Pinyin is generated offline with ICU Han-Latin transliteration for lines that do not already supply pinyin. This improves coverage, but automated transliteration is not a substitute for a full linguistic review of every tone, polyphonic reading, or spacing choice; that review remains a separate quality-control task.
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

- **v16:** Filled six missing English IPA fields and corrected five existing transcriptions after a focused Cambridge Dictionary check; includes the v15 pinyin-rendering correction.

- **v14:** Added 61 English vocabulary entries focused on J, K, L, Q, X, Y, and Z (692 English entries total); preserved the 106-entry Chinese character course and account features.
- **v13:** Added 81 advanced English vocabulary entries (631 English entries total); preserved the 106-entry Chinese character course; prompts Google sign-in users to choose an account.
- **v12:** Added 97 less-common English terms (550 English entries total); Chinese course unchanged.
- **Earlier releases:** Built the English and Simplified Chinese courses, character-first Chinese grid, pinyin-aware search, expanded entry details, saved words, and Supabase-based account support.
