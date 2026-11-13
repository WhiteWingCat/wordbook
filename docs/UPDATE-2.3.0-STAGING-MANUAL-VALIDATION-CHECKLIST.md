# Update 2.3.0 — Staging manual validation checklist

**Status:** Prepared; not yet executable against a real provider because the connected Supabase project is the production project and must remain untouched.

## Staging prerequisites

- [ ] Create or identify a separate Supabase staging project. Do not apply the 2.3.0 draft migrations to production for testing.
- [ ] Apply the approved baseline and 2.3.0 migration drafts to staging in the documented order, including content catalogue, saved-word privilege hardening, allowance, daily activity, private ledger and learning-history deletion.
- [ ] Configure a staging Google OAuth client (or a separately approved staging redirect) and the exact staging callback/allowed URLs in Google and Supabase.
- [ ] Use only the browser publishable/anon key. Never put a service-role key in `index.html`, browser configuration or a public GitHub branch.
- [ ] Create two disposable test accounts, A and B. Use separate browser profiles/devices. Do not use real personal learning data.
- [ ] Confirm the staging privacy notice clearly identifies the environment as a test.

## A. Authentication and account isolation

- [ ] Sign in as Account A using Google OAuth.
- [ ] Complete the OAuth callback and confirm the user returns to SwiftDictionary signed in.
- [ ] Refresh the page and confirm the session persists.
- [ ] Sign out and confirm protected Profile/Daily Learning views behave as designed.
- [ ] Sign in as Account B in a separate browser profile.
- [ ] Switch accounts on the same browser/device and confirm A's cached profile, saved words, preferences and progress are cleared before B is shown.
- [ ] Confirm A cannot read B's saved words, preferences, lesson progress, daily sessions or practice summaries through the application.
- [ ] Confirm sign-out/account switching does not delete the previous account's server-side data.

## B. Saved words and cross-device sync

- [ ] As A, save a word on desktop.
- [ ] Confirm it appears on a second device/browser signed in as A.
- [ ] Delete the saved word and confirm the deletion syncs.
- [ ] Sign in as B and confirm A's saved words are not visible.
- [ ] Confirm signed-out use does not write to Supabase as `anon`.
- [ ] Confirm authenticated saved-word operations are limited to SELECT, INSERT and DELETE; no direct UPDATE/TRUNCATE is available.

## C. Permanent lessons and allowances

- [ ] Start an approved lesson and confirm its ID/difficulty are accepted.
- [ ] Try an unknown lesson ID and confirm the database rejects it.
- [ ] Try a valid lesson ID with a mismatched topic at completion and confirm rejection.
- [ ] Complete a lesson and confirm progress, completion and allowance update atomically.
- [ ] Refresh and retry the same completion; confirm no duplicate allowance event.
- [ ] Verify Free and Premium daily permanent-lesson limits using the disposable test accounts.
- [ ] Verify the personal testing bypass applies only to the intended test account and does not affect another account.

## D. Daily Learning

- [ ] Start Daily Topic with approved content and exact topic/difficulty metadata.
- [ ] Try a forged content ID, topic, difficulty and source; confirm each is rejected.
- [ ] Abandon an activity and confirm no allowance is consumed.
- [ ] Complete an activity and confirm exactly one daily allowance is consumed.
- [ ] Try a duplicate completion request and confirm no second allowance/event is recorded.
- [ ] Complete Daily Application with an incorrect first attempt followed by a correct answer. Confirm the UI and stored aggregate first-try score behave as intended.
- [ ] Inspect the database: only aggregate correct/question counts and approved metadata are stored; no answer selections, typed answers or per-question response rows exist.
- [ ] Complete Daily Discovery and confirm mixed content selection and source metadata.
- [ ] Generate Daily Revision from a weak topic and confirm the generated revision ID resolves to an approved Daily Application source with matching topic/difficulty/language.
- [ ] Verify an unknown or mismatched revision source is rejected.
- [ ] Confirm Daily Learning remains disabled/rejected when the learning course is not English until a non-English catalogue is approved.

## E. Timezone and deletion

- [ ] Set the test account timezone to Asia/Kuala_Lumpur and confirm daily reset boundaries match local midnight.
- [ ] Change the timezone and confirm the reset cannot be shifted to obtain an extra allowance.
- [ ] Complete some daily activities and permanent lessons, then delete learning history.
- [ ] Confirm lesson progress, practice summaries, daily sessions and activity history are removed.
- [ ] Confirm the account, saved words, profile preferences and current-window allowance ledger remain.
- [ ] Confirm deleting history does not restore the day's allowance.
- [ ] Confirm a new day resets the allowance once according to the stored timezone.
- [ ] Test account deletion separately and verify its scope/retention behaviour; do not treat it as equivalent to learning-history deletion.

## F. Privacy and security checks

- [ ] Confirm the private content catalogue is not readable by anon or authenticated table queries.
- [ ] Confirm anonymous requests cannot read or write saved words.
- [ ] Confirm authenticated users can access only their own rows.
- [ ] Confirm direct INSERT into practice summaries is denied and the approved RPC is required.
- [ ] Confirm the public personal testing status RPC accepts no user ID and returns only the caller's own status.
- [ ] Confirm no service-role key or OAuth client secret is present in browser assets or repository history.
- [ ] Confirm the deployed privacy notice matches actual providers (GitHub Pages, Google OAuth, Supabase and jsDelivr), actual data categories, retention and transfer locations.
- [ ] Record results, browser/device, test account IDs (non-sensitive aliases only), timestamps and any defects. Do not include passwords, tokens, OAuth secrets or service-role keys in test evidence.

## Release gate

Do not mark Update 2.3.0 release-ready until:
- all critical staging checks pass;
- real Google OAuth and account isolation are verified;
- cross-device saved-word sync is verified;
- the owner has completed manual Daily Learning and deletion tests;
- the privacy notice and legal review have been resolved; and
- the owner explicitly approves production migration, merge and deployment.

CI passing against disposable PostgreSQL and local Supabase is necessary but not sufficient for this gate.
