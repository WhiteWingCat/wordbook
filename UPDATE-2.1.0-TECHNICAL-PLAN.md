# SwiftDictionary Update 2.1.0 — Technical Plan

## Agreed product scope

- Five primary pages in one-row navigation: Dictionary, Lessons, Quiz, Flashcards, Profile.
- Dictionary remains the default landing page and remains free with unlimited word-grid search.
- Learning-course and translation-language selectors remain at the top-right.
- Profile is available only while signed in. A signed-out visitor who opens Profile is redirected to Dictionary.
- Profile contains a progress overview with expandable detail sections and account preferences.
- Lessons, Quiz, and Flashcards show Coming Soon placeholders in 2.1.0; their functional releases are separate: 2.2, 2.3, and 2.4 respectively.
- Learning limits are configurable by plan and activity category. Daily reset follows the user's configured IANA timezone.
- The framework is language-independent; initial registered languages are English (`en`) and Simplified Chinese (`zh`).

## Read-only baseline inspection (2026-11-07)

- Supabase project: SwiftDictionary (`pzymiesazmpyvnfvsbsc`), ACTIVE_HEALTHY, PostgreSQL 17.11.0.003, region `ap-northeast-1`.
- Existing public application table: `saved_words` only.
- `saved_words` has RLS enabled, 9 rows, a unique constraint on `(user_id, course, word)`, a foreign key to `auth.users(id)` with cascade delete, and a course check for `en` / `zh`.
- Existing `saved_words` policies permit authenticated users to select, insert, and delete only their own rows. No update policy exists; do not change this table or its policies in 2.1.0.
- No custom public/private SQL functions were found. Supabase migration history currently lists no migrations.
- Security advisor baseline: leaked-password protection is disabled (warning); performance advisor returned no findings. This is a pre-existing Auth setting and is not changed by this release.
- Release baseline is extracted from `SwiftDictionary-Update-1.1.0.zip`; do not use older loose `index.html` copies.

## Proposed additive database schema — approval required

1. `languages`
   - `code` primary key (e.g. `en`, `zh`)
   - `name`, `native_name`, `is_active`, `created_at`
   - Seed English and Simplified Chinese; future language additions should not require schema changes.

2. `profiles`
   - `user_id` primary key / FK to `auth.users(id)` with cascade delete
   - optional `display_name`, `created_at`, `updated_at`
   - Do not duplicate email or other Auth-managed identity fields.

3. `user_preferences`
   - `user_id` primary key / FK to `auth.users(id)` with cascade delete
   - `learning_language`, `translation_language` referencing `languages(code)`
   - `timezone` as an IANA timezone identifier (not a geographic location)
   - timestamps

4. `user_entitlements`
   - `user_id` primary key / FK to `auth.users(id)` with cascade delete
   - `plan_code` (`free` / `premium`), `status`, optional validity timestamps, source and timestamps
   - Users can read their own entitlement but cannot grant themselves premium access.
   - No payment processor, subscription checkout, or billing is part of 2.1.0.

5. `learning_plan_limits`
   - keyed by `plan_code` and `activity_type` (`lesson`, `quiz`, `flashcard`)
   - configurable `daily_limit` and enabled state, per activity category
   - Proposed initial configuration for discussion: Free = 5/day per category; Premium = configurable 10–15/day per category. These are configuration values, not hard-coded UI rules.

6. `learning_activity_log`
   - user-owned activity rows containing only `activity_type`, `language_code`, and `created_at`
   - No answer content, question responses, word history, device fingerprint, or advertising analytics.
   - A database-side quota function serializes per-user checks and calculates the current local-day window using the IANA timezone in `user_preferences`.
   - Proposed quota semantics for approval: count one use when a lesson, quiz, or flashcard session starts; count limits per activity category across the user’s registered learning languages.

## Security and implementation rules

- Preserve `saved_words`, its data, constraints, and RLS policies unchanged.
- Enable RLS on every new table. Add explicit grants and owner-scoped policies; users must never read or alter another user's rows.
- `languages` and active plan limits may be readable as reference/configuration data; writes remain restricted to trusted administration.
- New public-schema tables require explicit Data API grants as well as RLS policies; do not assume automatic API exposure.
- Quota enforcement must happen in the database, not only in browser JavaScript. Do not trust user-editable metadata for entitlements.
- Use an invoker-rights database function where possible; do not add a public `SECURITY DEFINER` endpoint.
- Do not alter Supabase Auth settings or `supabase-config.js`.

## Frontend implementation plan after approval

- Add a shared five-page shell and one-row navigation without replacing the dictionary renderer.
- Keep the dictionary page as the default route and preserve the current course/translation selectors at top-right.
- Add the signed-in-only Profile route, overview, expandable progress panels, and preferences.
- Add Coming Soon pages for Lessons, Quiz, and Flashcards.
- Wire profile/preferences/progress reads and writes only after the database migration is approved and verified.
- Keep the banner asset (`banner.svg`) and `supabase-config.js` external; retain their existing deployment paths.

## Release and QA sequence

- Update 2.1.0: shared navigation, Profile/preferences/progress infrastructure, configurable limits, placeholders.
- Test 2.1.0 before starting 2.2. Lessons; test 2.2 before 2.3 Quiz; test 2.3 before 2.4 Flashcards.
- Do not deploy to GitHub Pages without explicit user approval.
