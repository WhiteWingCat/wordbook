# SwiftDictionary Update 2.3.0 — Privacy and Learning-History Deletion Design

**Status:** Design proposal for review. No application code, production Supabase schema, user data, or live website has been changed by this document.

## 1. Objective and non-negotiable behaviour

Provide two distinct user actions:

1. **Delete learning history** — remove the user's learning records and derived learning insights while retaining the SwiftDictionary account, saved words, profile preferences, and authentication.
2. **Delete account** — permanently remove the SwiftDictionary account and its associated personal data, subject to narrowly defined backup/security retention and any legally required exceptions.

A learning-history deletion must never restore or increase the user's remaining daily allowance. The dictionary remains free and unlimited; no dictionary-search usage ledger is introduced.

The current `learning_activity_log` is both a user-visible activity source and the authoritative completion allowance source. Directly deleting its current-day rows would reset quota. The preferred design therefore separates the allowance ledger from the deletable learning-history tables before enabling self-service deletion.

## 2. Current data inventory

This inventory is based on the Update 2.3.0 draft schema and frontend reads. Before implementation, compare it with the exact live Supabase schema, foreign keys, triggers, RLS policies, storage buckets, and Auth configuration.

| Data | Purpose | History deletion | Account deletion |
|---|---|---|---|
| Supabase Auth user, Google identity/email and Auth metadata | Sign-in and account identity | Retain | Delete through server-side Auth Admin operation |
| `profiles` (display name, avatar icon) | Profile display | Retain | Delete |
| `user_preferences` (course, translation, timezone, daily activity toggles and allowance timezone transition fields) | Personalisation and allowance day | Retain | Delete |
| `user_entitlements` | Server-managed plan status | Retain; do not allow client edits | Delete or handle billing/legal records separately if billing is ever added |
| `saved_words` | User's saved dictionary items | Retain | Delete |
| `lesson_progress` | Lesson completion state and progress | Delete | Delete |
| `lesson_practice_results` | Aggregate correct/question counts and topic IDs | Delete | Delete |
| `daily_activity_sessions` | Daily assignment/session history and aggregate results | Delete | Delete |
| `learning_activity_log` | Activity history and, currently, quota enforcement | Delete after the allowance source has been separated | Delete |
| Private `learning_limit_exemptions` | Owner-only testing exception | Retain only while explicitly required; never expose | Delete |
| Browser-local preferences/avatar/cache | Convenience and display state | Clear learning-derived cache; preserve non-learning preferences | Clear all SwiftDictionary keys |
| Supabase/Auth/provider operational logs and backups | Security, reliability and disaster recovery | Not directly user-editable; apply provider retention/deletion terms | Retain only for provider-defined/legally justified periods |

The application currently stores aggregate first-attempt results, not individual answer selections, typed responses, keystrokes, or free-text answers. Do not add answer-level tracking as part of deletion support.

## 3. Recommended allowance/history separation

### 3.1 Why separation is necessary

Today, `public.enforce_learning_daily_limit()` counts `learning_activity_log` rows where `event_type = 'completed'` and the timestamp falls inside the effective local-day window. A history deletion that removes those rows before midnight would let the user complete more activities than their plan permits.

Keeping every event forever would preserve quota but unnecessarily retain personal learning history. The two purposes should not share the same long-term record.

### 3.2 Proposed minimal quota ledger

Introduce a server-owned `private.learning_allowance_usage` table (exact schema to be finalised during implementation), with at most one current-state row per user and activity category:

- `user_id`
- `activity_type`
- `window_start` and `window_end` (server-calculated UTC instants for the effective IANA allowance timezone)
- `used_count`
- `updated_at`

The ledger must not contain lesson IDs, content IDs, topic IDs, answer data, language text, or individual event timestamps. It is operational quota state, not a learning-history feature.

On every successful completion, inside the same transaction and under the existing per-user advisory lock:

1. Resolve the effective allowance timezone using the server-owned timezone transition fields.
2. Calculate the current allowance window on the server.
3. If the stored window is still current, enforce the plan limit and increment `used_count`.
4. If the previous window has expired, start the new window and set usage to one.
5. If the limit is already reached, raise the existing quota error so the completion and usage update both roll back.
6. Preserve the permanent-lesson testing exemption only for permanent lessons; it must never bypass Daily Learning limits.

All writes must be private/server-side. Revoke browser-role access to the ledger and do not expose a client RPC that can set, clear, or decrement usage. The existing completion RPCs remain the only valid route to record chargeable completions.

The exact window transition behaviour must be regression-tested against timezone changes, daylight-saving transitions, concurrent completions, repeated RPC calls, and the existing deferred timezone-switch boundary before migration approval.

### 3.3 Learning activity history

After the quota ledger is authoritative, keep `learning_activity_log` as a deletable history/summary source only. It can continue to record activity category, event type, language code and timestamp while the user retains history. It must no longer be the sole authority for quota enforcement.

Do not preserve per-completion log rows as a workaround once the new ledger exists. The quota ledger should retain only the current count/window, not a permanent event trail.

## 4. Learning-history deletion workflow

### 4.1 User experience

Add a clearly labelled action in signed-in Profile, under a separate **Privacy and data** section:

- Explain that learning progress, lesson completion records, Daily Learning session history and derived practice insights will be permanently erased.
- Explain that saved dictionary words, account sign-in, display name, language preferences and timezone preferences are not affected.
- Explain that completions already used in the current allowance day remain counted until the normal reset. Deleting history does not create additional allowance.
- Require re-authentication or an equivalent recent-authentication check, followed by an explicit confirmation naming the data being erased.
- Show a success/failure result. Do not optimistically claim deletion before the server confirms the transaction.

Do not use a browser-side sequence of DELETE requests. It is vulnerable to partial completion, can conflict with concurrent learning requests, and must not be able to edit the quota ledger.

### 4.2 Server-mediated operation

Implement a narrowly scoped authenticated database RPC or server-side Edge Function. The preferred first implementation is a single transactionally consistent database operation, with an authenticated user identity derived from `auth.uid()`; never accept an arbitrary target user ID from the browser.

The operation should:

1. Require a valid authenticated caller and verify the requested action.
2. Acquire the same per-user advisory transaction lock used by lesson and daily completion paths. This prevents a completion and deletion from racing.
3. Verify ownership for every affected row through the caller identity.
4. Delete the caller's rows from:
   - `lesson_progress`
   - `lesson_practice_results`
   - `daily_activity_sessions`
   - `learning_activity_log`
5. Leave `private.learning_allowance_usage` unchanged. It is the only retained learning-related state and contains only current allowance counts/windows.
6. Commit all deletions atomically. If any required deletion fails, roll back the whole operation.
7. Return a minimal success result, not deleted row contents.

The function must not be executable by `anon` or `PUBLIC`. If implemented as SECURITY DEFINER, place it in a non-exposed `private` schema, pin `search_path`, explicitly verify `auth.uid()`, revoke default PUBLIC execution, grant only the required role, and run Supabase security advisors. Prefer SECURITY INVOKER if the required atomic deletes can be safely performed under the existing RLS policies and grants.

### 4.3 Post-deletion client behaviour

After server confirmation:

- Clear lesson progress and completion badges in memory.
- Clear Daily Learning completed-history and adaptive-revision caches.
- Clear Profile accuracy, practice-summary and due-topic statistics.
- Clear any locally cached learning-history data for the active account.
- Refresh allowance displays from the server. The current day's remaining quota must be unchanged by deletion.
- Do not clear saved words, account preferences, avatar, course/translation selection, or account identity.
- Re-fetch server state before showing an empty-history state.

### 4.4 Concurrency and retry behaviour

- Deletion and every chargeable completion must use the same per-user lock.
- A deletion retry must be idempotent: already-absent history rows are treated as successfully deleted.
- A completion that commits before deletion remains counted in the allowance ledger; a completion that begins after deletion is evaluated against the unchanged ledger.
- A quota-rejected completion must not leave a partial progress row or increment.
- The deletion endpoint must not accept timestamps, timezone, window boundaries, or used-count values from the client.

## 5. Account deletion workflow

Account deletion is separate from learning-history deletion and should be implemented only after the full foreign-key and provider inventory is verified.

1. Require recent re-authentication and an explicit irreversible confirmation.
2. Mark the request as in progress and prevent new learning writes while deletion is processed.
3. Clear any user-owned Storage objects if any are introduced in future; Supabase Auth user deletion can fail while the user owns Storage objects.
4. Use a server-side Edge Function or trusted backend with the Supabase Auth Admin API to delete the Auth user. Never place a service-role/secret key in `index.html`, `supabase-config.js`, GitHub Pages, or any browser code.
5. Confirm all user-linked public/private rows are removed by `ON DELETE CASCADE` or explicit server-side deletion. Do not assume every existing table has the correct FK behaviour; inspect the live schema first.
6. Clear browser-local SwiftDictionary state and sign the user out.
7. Verify that the user cannot refresh a session or create new records. Supabase documents that already-issued access JWTs can remain valid until expiry; use short expiry and/or session validation for sensitive endpoints if immediate revocation is required.
8. Record only a minimal non-identifying operational completion marker if required to prevent duplicate processing; define its retention and access separately.

Deleting a SwiftDictionary account does not delete the person's Google account or Google data. No Google-account deletion should be implied.

## 6. Retention schedule proposal

These are proposed product defaults, not a statement of existing provider retention or a legal conclusion. Confirm them against operational needs, Supabase plan/provider settings, applicable law, and backup behaviour before publication.

| Data | Proposed retention |
|---|---|
| Profile and preferences | While the account is active; delete on account deletion |
| Saved words | Until user removes them or deletes the account |
| Lesson progress and practice summaries | Until user deletes learning history or the account |
| Daily activity sessions and activity history | Until user deletes learning history or the account |
| Minimal allowance usage state | Only for the active allowance window; replace/reset when the server determines the next valid window |
| Security/operational logs | Provider-controlled retention; disclose the verified period or link to provider terms |
| Backups | Provider-controlled expiry/rotation; disclose that residual encrypted backup copies may persist until scheduled expiry, if confirmed |
| Deletion-request operational record | Minimum fields and shortest period necessary to demonstrate processing and prevent replay; avoid retaining the deleted learning content |

Do not promise instant erasure from provider backups unless the relevant provider contract and configuration support that promise. The user-facing notice should distinguish deletion from active application databases from backup expiry.

## 7. Privacy Policy content requirements

The companion `PRIVACY-POLICY-DRAFT.md` is a plain-language starting point. Before publication, fill in the controller's legal name/contact address and privacy contact, verify the actual Supabase project region and subprocessors, confirm Google OAuth scopes, and confirm operational log/backup retention.

The notice should explain:

- What account, profile, preference, saved-word, learning-progress and aggregate practice data is processed.
- Why each category is needed (authentication, synchronisation, learner progress, adaptive revision, allowance enforcement, security).
- That individual answers and typed responses are not retained by the current learning design.
- That the timezone is an IANA timezone preference, not GPS or precise location.
- The use of Google for sign-in and Supabase for authentication/database hosting, including the verified processing locations and cross-border safeguards.
- Whether any analytics, advertising, payment or tracking tools are actually used. Do not claim they are absent until the deployed site and provider settings have been checked.
- Retention periods, user rights/request routes, correction/access/deletion handling, and backup limitations.
- Whether provision of particular data is required for sign-in/synchronisation and what happens if it is not provided.
- A contact route and effective/updated date.

## 8. Malaysia PDPA and broader legal review

SwiftDictionary is intended for a global audience and is operated from Malaysia. This is a practical product-risk review, not legal advice.

- Review the Personal Data Protection Act 2010 (Act 709), as amended by the Personal Data Protection (Amendment) Act 2024. The official Commissioner site publishes the Act, amendment, commencement material and current circulars/guidelines.
- Determine whether the operation falls within the PDPA's commercial-transaction scope; do not assume that a free-to-use service is automatically outside the Act. Obtain qualified advice on the operator's status and activities.
- Provide a clear written privacy notice and identify the actual data controller. The controller's legal identity and contact details must not be left as placeholders at launch. Where the PDPA applies, prepare the notice in both Bahasa Malaysia (the national language) and English, and make the choice/request route accessible in both languages.
- Assess the data protection principles, purpose limitation, notice/choice, security, retention, data integrity, access and correction processes against the actual implementation.
- Assess the enhanced cross-border transfer requirements and the Commissioner's Cross-Border Personal Data Transfer Guideline. Verify the live Supabase project region, Google processing, subprocessors, support access, backups and contractual terms; do not assume that selecting a Tokyo database region proves all processing remains in Japan.
- Assess the breach-notification obligations and the Commissioner's current Data Breach Notification Guideline/circular, including internal incident detection, decision ownership, records and notification timelines.
- Assess whether a DPO is required. The Commissioner's published FAQ identifies thresholds including more than 20,000 data subjects, more than 10,000 data subjects for specified sensitive/financial data, or regular and systematic monitoring of user behaviour. A small user count alone does not settle the monitoring criterion; review actual tracking and profiling practices.
- Assess whether a DPIA is appropriate, especially if adaptive learning insights evolve into systematic behavioural monitoring or materially affect users.
- The intended minimum age is 16+, but a stated age target is not age verification. Review obligations for younger users in every target market and avoid collecting date of birth unless there is a justified need.
- Do not describe aggregate learning performance as medical or mental-health data. Do not introduce sensitive profiling or infer protected traits.
- If paid subscriptions are introduced later, separately review consumer, tax, payment, cancellation/refund, billing-record retention and additional privacy obligations.

Official Malaysian sources:
- [Personal Data Protection Act 2010 and amendment materials](https://www.pdp.gov.my/en/akta/pdp-act-2010-en/)
- [Personal Data Protection (Amendment) Act 2024](https://www.pdp.gov.my/en/akta/personal-data-protection-amendment-act-2024/)
- [DPO Guidelines](https://www.pdp.gov.my/en/akta/personal-data-protection-guidelines-on-the-appointment-of-data-protection-officer-dpo/)
- [Data Breach Notification Guidelines](https://www.pdp.gov.my/en/akta/personal-data-protection-guidelines-on-data-breach-notification-dbn/)
- [Cross-Border Transfer Guidelines](https://www.pdp.gov.my/en/akta/personal-data-protection-guidelines-on-cross-border-transfer-of-personal-data-cbpdt/)
- [Commissioner's FAQ](https://www.pdp.gov.my/en/faq/)
- [Commissioner's Quick Guide to Privacy Notice](https://www.pdp.gov.my/ppdpv1/wp-content/uploads/2025/01/A-Quick-Guide-to-PRIVACY-NOTICE.pdf)

## 9. Implementation and release gates

Do not mark the 2.3.0 PR ready, merge it, apply production SQL, or deploy the website until all applicable gates pass:

- [ ] Verify the live schema, FK delete actions, triggers, grants, RLS policies, private schema objects, Storage usage and Auth configuration.
- [ ] Validate the private allowance ledger migration and all permanent-lesson/Daily Learning quota paths in CI and an isolated Supabase project; the implementation draft and disposable PostgreSQL assertions are now present.
- [ ] Validate the new authenticated, recent-authentication-gated history-deletion RPC (by checking the signed JWT session_id against auth.sessions.created_at) in CI and an isolated Supabase project; prove current-day usage remains unchanged for Free and Premium, including concurrent completion/deletion races.
- [ ] Prove the ledger rolls into the next valid effective-timezone window and does not allow client spoofing or timezone-change bypass.
- [ ] Test all history tables are deleted, all Profile/Daily Learning caches are cleared, and saved words/preferences/authentication remain intact.
- [ ] Test deletion as a normal authenticated user, a signed-out user, another user's session, and an owner with the personal testing exemption.
- [ ] Test account deletion separately, including FK cascades, Auth sessions, residual JWT handling, and any Storage objects.
- [ ] Complete automated idempotency, RLS, privilege, rollback and concurrency tests in the free PostgreSQL harness; deletion assertions have passed in CI run [#42800408769](https://github.com/WhiteWingCat/wordbook/actions/runs/42800408769); isolated Supabase integration remains outstanding.
- [ ] Complete live Supabase integration and browser tests in an isolated project before any production migration.
- [ ] Finalise the public privacy notice with accurate controller identity, contact, processing locations, subprocessor details, retention and request handling.
- [ ] Complete Malaysia PDPA review and target-market legal review with qualified advice where needed.



## 11. Read-only review of the connected Supabase project — 2026-11-10

The connected SwiftDictionary project was inspected using read-only project/table metadata and SELECT-only catalog queries. No database writes, migrations, user-row reads, or production changes were made.

### Observed live environment

- Supabase project status: active/healthy.
- Primary database region: `ap-northeast-1` (Tokyo, Japan).
- PostgreSQL version: `17.11.0.003`.
- The live project is still on the pre-2.3.0 database shape at the time of inspection:
  - `learning_activity_log` does **not** yet have the draft `event_type` column.
  - `daily_activity_sessions` does **not** yet exist.
  - `user_preferences` does not yet have the draft Daily Learning preference and allowance-timezone-transition fields.
  - `learning_plan_limits` still has the pre-2.3 activity-type constraint.
- The current live tables include `saved_words`, `profiles`, `user_preferences`, `user_entitlements`, `learning_activity_log`, `lesson_progress`, `lesson_practice_results`, and private `learning_limit_exemptions`.

### Foreign-key findings

Every inspected user-owned table currently has a foreign key to `auth.users(id)` with `ON DELETE CASCADE`: saved words, profiles, preferences, entitlements, learning activity, lesson progress, lesson practice results, and the private testing exemption. This supports account-level cascade deletion for the currently observed tables. It does **not** mean a learning-history-only deletion can delete the Auth user; doing so would also delete saved words, profile and preferences.

The new draft `daily_activity_sessions` table also declares an `ON DELETE CASCADE` reference to Auth users. Confirm this constraint after any approved migration.

### RLS and access findings

- RLS is enabled on the inspected public/private user-owned tables.
- Current live `learning_activity_log` has an owner-scoped SELECT policy and an authenticated owner-scoped INSERT policy.
- Current live `lesson_practice_results` has owner-scoped SELECT and INSERT policies.
- Current live `lesson_progress` has owner-scoped SELECT, INSERT and UPDATE policies.
- No direct browser DELETE policy was observed for these learning tables.
- The 2.3.0 draft intends to revoke direct browser INSERT paths for activity and practice results and use trusted database completion writers. Those changes are not yet live.

### Consequences for implementation

1. Treat the production database as pre-2.3.0. Never apply the history-deletion operation against a schema that does not first have the reviewed 2.3.0 completion/ledger architecture.
2. Account deletion can use the observed cascades only after the full live FK inventory is rechecked at release time. Any future Storage objects or new user-linked tables need separate handling.
3. Do not grant browser DELETE access to `learning_activity_log`, `lesson_progress` or `lesson_practice_results` as a shortcut.
4. The primary database is in Japan, so the privacy notice should identify Japan as the current primary database hosting location if that remains true at publication. This does not establish the location of Supabase Auth, backups, logs, support access, Google processing or every subprocessor. Verify those separately.
5. The observed PostgreSQL version is `17.11.0.003`, which meets the minimum version cited in the earlier Supabase timezone-data notice; still run timezone boundary tests against the live managed environment before release.


## 12. References

- Supabase [User Management and deleting users](https://supabase.com/docs/guides/auth/managing-user-data)
- Supabase [Auth Admin deleteUser](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)
- Supabase [Cascade Deletes](https://supabase.com/docs/guides/database/postgres/cascade-deletes)
- Malaysia Personal Data Protection Commissioner sources listed in Section 8


## Allowance ledger implementation progress — 2026-11-10

The proposed private current-window allowance ledger has now been added as a separate SQL migration draft, following the existing permanent-allowance and Daily Activity drafts. It is not applied to production.

The migration backfills the current local-day count from completed history, then makes the private ledger authoritative for new completions and Daily Activity start checks. It retains only one count/window row per user/activity category. Learning history can therefore be deleted later without resetting current-day usage. A scoped read helper verifies the caller's identity, and browser roles have no direct table access.

The migration and regression assertions are wired into the disposable PostgreSQL 17 CI workflow. The test cases cover legacy backfill, direct table access denial, quota preservation after deleting history, Daily Topic quota preservation, and next-window rollover. CI results are pending at the time this note was written.

This is not yet the history-deletion feature. The next work is to run and fix the compatibility suite, review security/performance behaviour, then test the exact migration sequence in an isolated Supabase project before implementing the deletion RPC.


## Learning-history deletion implementation status — 2026-11-10

A draft server-side RPC and Profile control have now been added to the feature branch. The RPC requires a recent signed JWT session_id matching an existing Auth session created within the previous 15 minutes, derives the target from `auth.uid()`, serializes with completion operations using the same advisory lock, and deletes only learning-history tables. It does not delete saved words, profile, preferences, entitlements, the Auth account, or the private allowance ledger.

The UI requires explicit confirmation and explains the retained data and unchanged current-day allowance. It asks the user to sign out and sign in again if recent authentication is required.

The preceding implementation passed in GitHub Actions run [#42799773985](https://github.com/WhiteWingCat/wordbook/actions/runs/42799773985). The recent-authentication guard validates the signed JWT session_id against an existing, non-expired auth.sessions row; that revised migration and its tests passed in CI run [#42800408769](https://github.com/WhiteWingCat/wordbook/actions/runs/42800408769). The work is not production-ready until isolated Supabase integration, Data API schema-exposure verification, and browser tests pass. The deletion RPC has not been installed in the live project. Account deletion remains a separate future implementation and must continue to use a trusted Auth Admin operation rather than browser credentials.
