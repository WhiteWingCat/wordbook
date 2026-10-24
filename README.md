# SwiftDictionary v7 — Character-first Chinese learning

A static, GitHub Pages-compatible English and Simplified Chinese vocabulary dictionary.

## What's updated
- Removed multi-character Chinese terms from the Chinese grid: each Chinese grid tile is exactly one Han character.
- Multi-character vocabulary is attached to related-word lists for characters it contains.
- Expanded the Chinese single-character collection and added more English vocabulary.
- Increased expanded-detail typography and retained vertical scrolling for longer entries.
- Added pinyin lines beneath Chinese examples, related terms, and Chinese definitions where character readings are available.
- Chinese search accepts tone-marked or unmarked pinyin (for example, `shuǐ` or `shui`).
- Reframed character breakdowns around a learner-friendly method: identify the radical/semantic component, look for a possible phonetic component, then learn the character in words. Components are clues, not guaranteed definitions or exact pronunciation rules.

## Quality-and-structure update (v8)
- Corrected Chinese character tiles to use true grid-based centering; saved-star indicators sit in the corner and no longer push characters off-center.
- Hidden the English parts-of-speech filter row while the Simplified Chinese course is active. The filter remains available for English.
- Chinese filtering now explicitly ignores the English category state, preventing stale category selections from affecting Chinese results.
- Kept the Chinese grid character-first: only single Han characters are shown as tiles, while multi-character vocabulary stays in related-word content.

## Important learning note
Pinyin coverage in multi-character example text is based on the site's single-character pronunciation data and may be incomplete or incorrect for polyphonic characters and context-dependent readings. This release improves layout and course-filter behavior; it is not a complete expert linguistic audit. Verify pronunciations, definitions, example naturalness, and character-component explanations with trusted dictionaries or a qualified Mandarin reviewer before treating every entry as authoritative. Character etymology and component explanations are concise learner aids, not exhaustive historical claims.

## Publish on GitHub Pages
Keep `index.html`, `feedback.html`, `banner.svg`, and `README.md` in the same repository directory. Upload/replace the files and commit the changes. The site uses relative asset links and does not require a server.

## v9 update: learning details and account setup

- Chinese character tiles use strict grid centering; the save star is positioned independently.
- Chinese related words show the word/characters with pinyin on the line beneath, without repeating pinyin beside the word.
- Chinese character structure now uses a visual lesson panel with the character, a short explanation, and component/radical cues where the current data provides one. Treat these as learning aids, not a complete etymological analysis.
- English details hide Chinese-only sections. Verbs show Present, Past, and Future forms; non-verbs hide this section. Irregular forms are explicitly listed for common verbs; other verbs use a simple regular-form rule and should be reviewed for spelling exceptions.
- English definitions use contextual Chinese glosses for a reviewed subset of common words. Unreviewed entries fall back to the existing Chinese gloss or a clearly marked literal-context fallback. This is not yet a full professional translation of every entry or example sentence.

## Google account sign-in (requires owner setup)

This is a static GitHub Pages site, so account authentication and cross-device data sync need an external auth/database service. The account interface is scaffolded for Supabase Auth with Google OAuth; it is **not active until configured**.

1. Create a project at https://supabase.com/ and open **Project Settings → API**.
2. Copy the Project URL and the publishable/anon key into `supabase-config.js`. Never use a `service_role` key in this public site.
3. In Supabase **Authentication → Providers**, enable Google and follow Supabase's current Google provider setup guide to configure the Google OAuth client ID/secret.
4. Add your GitHub Pages site URL to Supabase's **Authentication → URL Configuration** allowed redirect URLs (including the repository path if the site is published from a project repository).
5. Test sign-in/sign-out on the deployed HTTPS site.

Important: this version includes the Google sign-in connection scaffold, but does not yet sync saved words or browsing history to a cloud database. Until cloud data sync and access policies are implemented and tested, saved words remain in this browser's local storage. Do not advertise cross-device saving as available yet. The next account milestone is a user-scoped table for saved words and learning history with Row Level Security policies, followed by tested migration from local storage.


## Cloud saving setup (after creating `public.saved_words`)

This release syncs saved words to Supabase for signed-in users and keeps local browser saving available. The table must have these columns: `id`, `user_id`, `word`, `course`, `created_at`; `course` must accept `en` and `zh`. Enable Row Level Security and add policies allowing authenticated users to select, insert, and delete only rows where `auth.uid() = user_id`. A unique constraint on `(user_id, course, word)` is required. Never add a service-role key to the public site.

To publish the update, replace `index.html` and `README.md` in the GitHub Pages repository with this release. Keep your already-configured `supabase-config.js` on GitHub unchanged; the copy in this ZIP contains placeholders for safety. Then hard-refresh the site and test saving/unsaving a word while signed in.
