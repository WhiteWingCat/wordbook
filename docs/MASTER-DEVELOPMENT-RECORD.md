# SwiftDictionary — Master Development Record

> Durable project handover and source-of-truth summary for future development conversations.
>
> **Repository:** https://github.com/WhiteWingCat/wordbook  
> **Last consolidated:** 2026-11-13  
> **Current baseline:** Update 2.3.0 merged to main on 2026-11-13  
> **Current work:** Update 2.3.1 bug fixes and dashboard/navigation improvements on feature/update-2-3-1-bug-fix-and-changes  
> **Record status:** Updated after the 2.3.0 merge and live-site owner testing; re-check repository, Supabase and deployment state before further changes.

This record combines confirmed owner decisions, repository evidence and the latest development handover. It is not proof that the live application or production database matches a draft branch.

---

## 1. Project identity and goals

SwiftDictionary is a personal vocabulary-learning project intended to be freely accessible to a global audience, with an intended age group of 16+. It currently supports English and Simplified Chinese dictionary and learning content.

- Repository: WhiteWingCat/wordbook.
- Hosting: GitHub Pages.
- Application: Static, GitHub Pages-compatible web application; main application file is index.html.
- Backend: Supabase for authentication, account data, saved-word synchronisation and learning-related data.
- Authentication: Google sign-in through Supabase.
- Intended operating model: Personal project. Future revenue model remains undecided. A possible Premium plan is being explored, not treated as an established business commitment.
- Core principle: Dictionary word-grid search remains free and unlimited. Never put dictionary search behind a subscription.
- Tracking preference: Minimise personal data collection. Avoid raw practice answers and unnecessary word-level activity.

Prefer workflows that respect free-plan/service constraints and avoid unnecessary paid services.

## 2. Standing development rules

1. **Legal and privacy review is mandatory for planned expansions.** For every new feature or expansion, include a Malaysia-specific and general legal-risk check. Consider Malaysia's Personal Data Protection Act (PDPA) where applicable, international users, age-related obligations, cross-border processing, content licensing and consumer/payment rules as relevant. This is a planning safeguard, not legal advice or a compliance certification.
2. **Protect existing functionality.** Do not regress Supabase Google sign-in, sign-out, account switching, account-isolated saved words, cross-device synchronisation, language preferences, dictionary search or stroke-order functionality.
3. **Dictionary search remains free and unlimited.** Subscription allowances must not restrict dictionary word-grid lookup.
4. **Small, sequential analysis.** If a task requires heavy data analysis, divide it into manageable sequential steps and validate each step.
5. **One consolidated deliverable per phase.** Do not provide intermediate downloadable ZIPs after each small batch. Accumulate changes, complete the phase, validate the consolidated result, then provide one final package when requested.
6. **Respect free-plan constraints.** Prefer safe, low-cost or free workflows. Do not assume paid Supabase branching or paid infrastructure is available.
7. **No production deployment or destructive database action without explicit owner approval.** Review migrations and live schema first. Never expose Supabase service-role credentials or OAuth client secrets in browser code or repository files.
8. **Verify before claiming completion.** Separate static checks, automated tests, mocked browser tests, real browser tests, live Supabase validation and production deployment. Passing one does not imply the others passed.
9. **Release naming:** After existing v19, release ZIP names use “SwiftDictionary Update X.Y.Z”: X = major feature, Y = additions, Z = emergency quick patch. Existing v19 naming remains unchanged.

## 3. Product and interface baseline

### Main navigation and pages

Five main pages: Dictionary, Lessons, Quiz, Flashcards and Profile. Dictionary is the default landing page. Direct hash routes include #dictionary, #lessons, #quiz, #flashcards and #profile.

### Dictionary

- English search matches words, not definitions or Chinese translations.
- Chinese search supports characters and pinyin, including pinyin without tone marks.
- Chinese word-grid cards display one character per square; multi-character terms belong in related-word/detail content.
- Pinyin appears beneath Chinese characters, not beside them.
- Detail panel supports translation-language switching.
- English details should not show Chinese pinyin, Chinese character-structure lessons or Chinese related-word sections.
- English definitions should cover common contextual meanings, with multiple senses where appropriate.
- Everyday-conversation example sentences were removed by owner preference.
- Dictionary search remains free and unlimited.

### Chinese learning and stroke order

- Chinese character structure and interactive stroke-order lessons are retained.
- Runtime stroke animation supports pause/resume, replay, previous/next stroke controls and progress display.
- Stroke-order interaction and checker were previously tested successfully.
- Review Hanzi Writer and stroke-data licensing before changing distribution or using content commercially. Consult the repository's third-party notices and Arphic licence materials.

### Account menu, Profile and preferences

- Top-right account menu provides relevant Sign in, Profile, Preferences, Switch account and Sign out actions.
- Account switching must remain available on shared devices.
- Signed-in Profile includes learning progress overview and expandable details.
- Preferences are managed in Profile.
- Signed-out users who select or directly open Profile are redirected to Dictionary.
- Learning course and translation language selections persist locally and, when signed in, synchronise to that account's preferences.
- Avatar selection is a preference, not identity verification.
- Account data and saved words must remain isolated between accounts.

## 4. Authentication, data and hosting safeguards

- Supabase Google authentication is enabled.
- Saved words synchronise through Supabase and are isolated by authenticated account.
- Signing out clears the active account's saved words from the interface; signing into another account loads that account's own words.
- Row Level Security must remain enabled and owner-scoped on user-owned tables.
- Only a Supabase publishable/anon key belongs in public browser configuration. Never expose a service-role key or Google OAuth client secret.
- Keep project-specific supabase-config.js and banner.svg intact when preparing website updates unless a separately reviewed change requires otherwise.
- GitHub Pages deployment is a separate action. A branch merge or archive creation is not a deployment unless deployment was performed and verified.
- Shared-device users must be able to switch accounts and sign out.

### Update 2.1.0 data foundation

The 2.1.0 foundation introduced tables for languages, profiles, preferences, entitlements, plan limits and learning activity. Existing saved_words data and policies were intended to remain unchanged. The quota enforcement foundation used database-side checks, user/category concurrency protection, validated IANA timezones and protection against client timestamp backdating.

Consult the repository README and Supabase migration history before re-applying any migration. Do not infer migration state from a local file alone.

## 5. Release history and confirmed decisions

### v19 and Update 1.1.0

- v19 consolidated Chinese linguistic review and interactive stroke-order lessons.
- At that stage the content baseline was recorded as 692 English entries and 106 Chinese entries.
- Update 1.1.0 expanded common English vocabulary by 100 entries and Chinese characters by 100, with expanded senses/examples and pinyin coverage.
- Later content QA prioritised common everyday English (for example greetings and gestures, places and school subjects) over excessive technical/scientific/historical vocabulary.
- Chinese content expansion and accuracy checks were part of the earlier content work.

### Update 2.1.0 — Profile and learning foundation

Introduced the five-page structure, signed-in Profile, preferences, progress overview, learning allowances and Coming Soon placeholders for unreleased learning experiences. Daily reset is based on each user's configured timezone, at local midnight.

### Update 2.2.0 — English Lessons Foundation

**Status: merged to main according to the November 10 development handover; the current main README also documents the 2.2.0 feature set.**

Recorded merge commit prefix: dd26e746.

Confirmed decisions and implementation:
- Beginner, Intermediate and Advanced difficulty levels.
- Permanent course library with independent progress for each difficulty.
- Grammar and combined-vocabulary lessons.
- Guided lesson reader and interactive practice.
- Selected translation language is used in lessons.
- Difficulty progress is remembered.
- Daily Learning structure decision for the 2.2 design was “all”.
- Daily Revision behaviour in the 2.2 design was “weak”.
- No timer or time pressure; a typical lesson may take around 5–10 minutes.
- Learners can choose their difficulty.
- Lesson completion is automatic only after practice is successfully completed and the completion update is saved.
- Answer options are shuffled while correct-answer mapping remains valid.
- Translation switching during practice should preserve current answers/progress.
- Starting a new lesson consumes an allowance; resuming an unfinished lesson and revisiting a completed lesson are free.
- Current catalogue recorded in README: 15 lessons (five per difficulty) and 52 original practice questions, with Simplified Chinese lesson content and practice prompts/options.
- Owner tested all lessons and reported Chinese translation switching, shuffled answers, completion saving and progress tracking behaving as intended.
- Quiz and Flashcards remained Coming Soon after 2.2.0.

### Update 2.3.0 — Daily Learning Expansion

**Status: COMPLETED as a development milestone and merged into main on 2026-11-13.** The owner subsequently tested the live website and reported follow-up issues now tracked under Update 2.3.1. See Section 13 for authoritative merge and follow-up details.

Owner-confirmed product decisions:
- Daily activities: **all four** categories are enabled for new accounts.
- Daily Revision: **adaptive**.
- Daily Discovery: **mixed**.
- Daily Learning includes Daily Topic, Daily Application, Daily Discovery and Daily Revision.
- New accounts must always have all four Daily Learning activities enabled. This was explicitly added to planning.
- Daily activities and preferences should synchronise with the account.
- Daily Revision prioritises weak topics using learning evidence, recognises improvement and adapts content.
- Daily Discovery uses mixed content.
- Daily Topic and Daily Application provide daily refreshed activities; Daily Revision helps avoid dependence on a finite permanent lesson library.
- Profile progress statistics should be expanded.

#### Latest approved allowance values

| Activity | Free | Premium (proposed) |
|---|---:|---:|
| Permanent lesson completions | 5 per local day | 15 per local day |
| Daily Topic completions | 1 per local day | 3 per local day |
| Daily Application completions | 1 per local day | 3 per local day |
| Daily Discovery completions | 1 per local day | 3 per local day |
| Daily Revision completions | 1 per local day | 3 per local day |
| Dictionary search | Unlimited | Unlimited |

- Only successful completion consumes an allowance.
- Starting, resuming or abandoning an activity is free.
- Daily reset follows the user's configured local timezone.
- A personal testing exemption exists in private database configuration and is lesson-only. Do not put its account identifier or private allowlist data in source control.
- Premium is a proposed entitlement tier; no payment/checkout flow should be assumed to exist.

#### Update 2.3.0 implementation and validation recorded in the November 10 handover

- Daily content expansion committed on the draft branch: Topic content 5 → 28; Application 5 → 25 sets; Discovery 6 → 27.
- Adaptive Revision covers 13 existing lesson topic identifiers and rotates through unused Application sets.
- Allowance timezone changes are deferred until the prior allowance day ends, preventing repeated timezone changes from moving the reset boundary.
- A private current-window allowance ledger backfills current-day completion counts and becomes the quota authority independently of deletable learning history.
- Learning-history deletion design uses a private SECURITY DEFINER implementation behind a SECURITY INVOKER public RPC wrapper. It derives the target user from auth.uid(), validates the JWT session against a recent existing non-expired auth.sessions row, serialises with completion operations and deletes only learning-history tables.
- Profile deletion UI requires explicit confirmation and explains that account data, saved words, preferences and current-day allowance usage remain.
- Aggregate first-attempt practice summaries are stored without raw answers.
- Privacy/deletion design and an English privacy-policy draft were prepared for review; the policy is not approved for publication.
- Latest reported CI run on commit 19967ad3c0df82866933c92359dcd5d516496068 passed PostgreSQL 17 and disposable local Supabase checks.
- A later reported GitHub Actions run 42954964345 passed Chromium, PostgreSQL 17 and disposable local Supabase Auth/migration/history-deletion checks.
- Six Playwright/Chromium tests passed against the local static app with a deterministic mocked Supabase client: dictionary search, lesson library/difficulty navigation, signed-out Daily Learning access, signed-out Profile redirect, Google OAuth request options/account-selection prompt, and account-switch state isolation.
- Mocked OAuth tests do not prove real Google OAuth callback handling. Real Google OAuth and cross-device saved-word synchronisation remain manual regression checks.

#### Current GitHub work observed during record creation

Repository branches observed:
- main
- feature/update-2-2-0-lessons
- feature/update-2-3-0-planning
- feature/update-2-3-0-allowance-foundation

Open pull requests observed:
- PR #2: **SwiftDictionary Update 2.3.0 — Daily Learning Expansion (Planning)**. It records the technical design, allowance rules, privacy-minimised practice tracking, schema findings, security and implementation order.
- PR #3: **SwiftDictionary Update 2.3.0 — Completion-Based Allowance Foundation (Draft)**. It targets feature/update-2-3-0-planning, not main. Its description records the completion-based allowance foundation, Daily Learning frontend, privacy/deletion work and validation.

Historical note: the PR state above describes the repository at the time of the earlier record consolidation. PR #3 was later retargeted to main and merged with explicit owner approval on 2026-11-13. See Section 13.

#### Remaining 2.3.0 release gates

1. Finish Adaptive Revision strengthening and test coverage.
2. Complete full browser regression for lessons, Daily Learning, account switching, saved-word isolation, translation switching, timezone handling, history deletion and quota preservation.
3. Review the live Supabase Auth/session structure and production migration prerequisites read-only before deployment.
4. Do not apply production migrations without explicit owner approval.
5. Decide whether account deletion is in scope for 2.3.0 or a later milestone. Learning-history deletion is not account deletion. If account deletion is implemented, it must use a trusted server-side Auth Admin operation; never expose a service-role key in browser code.
6. Finalise privacy notices only after confirming controller identity/contact, providers/subprocessors and their locations, retention, cross-border transfer safeguards and applicable Malaysia PDPA obligations. Prepare Bahasa Malaysia and English notices if PDPA applies.
7. Verify third-party content/source terms before any future commercial use.
8. Confirm whether a separate Simplified Chinese learning curriculum is in scope. Current lesson content is English learning with Chinese translations.
9. Complete real Google OAuth callback and cross-device/account saved-word sync manual tests.
10. Consolidate, review and explicitly approve the release candidate before production migration or Pages deployment.

### Current roadmap

- **Update 2.3.1 — Bug Fix & Changes:** **In progress on the feature branch.** Scope and acceptance criteria are recorded above. Includes Lessons/Daily Learning integration, Dashboard and Preferences separation, allowance visualisation, saved-word panels and practice insights. Isolated mock testing mode (Option B) is implemented on this branch and passed automated CI run #456; real preview-host manual verification remains pending. Do not merge or deploy without owner approval.
- **Update 2.4.0 — Quiz:** **Planned.** Dedicated Quiz experience, progress tracking and allowance integration.
- **Update 2.5.0 — Flashcards:** **Planned.** Flashcard learning experience, review progress and allowance integration.

These roadmap statuses must be refreshed whenever work changes. Planned features are not implemented or released; preserve Coming Soon behaviour until each feature is ready.

## 6. Privacy, legal and content licensing checklist

For each new feature and before public launch or monetisation, revisit:
- Malaysia PDPA applicability and obligations, including notice/consent, purpose limitation, security, retention, access/correction, processors and cross-border transfers where relevant.
- International privacy and child/teen requirements for a global audience aged 16+; do not assume one age threshold satisfies every jurisdiction.
- Whether collected data is necessary for the learning purpose. Prefer aggregate performance signals over raw answers or detailed behavioural logs.
- Clear user-facing explanation of allowances, reset timezone and Premium entitlements.
- Account-data and learning-history deletion semantics. Do not confuse deleting learning history with deleting an account.
- Third-party content, dictionary data, translation and stroke-data licences, attribution and restrictions on commercial use.
- Payment, subscription, tax, refund and consumer-protection obligations if Premium is introduced.
- Privacy notices should not be published as final until controller, provider, contact, retention and transfer details are verified.

## 7. Current known repository and deployment facts

- The default main README fetched during this record's preparation describes **SwiftDictionary Update 2.2.0 — English Lessons Foundation**.
- README states that supabase-config.js and banner.svg are external project files and must be retained when preparing the Pages deployment.
- README instructs that deployment must wait for owner review and explicit approval.
- The 2.3.0 implementation was later merged into main; the owner has since reported live-site testing and identified follow-up improvements for Update 2.3.1.
- The live website and live Supabase schema were not inspected as part of creating this record. Re-check them before release actions.

## 8. How to resume work in a new ChatGPT conversation

Use this opening instruction:

> Continue SwiftDictionary development. First read the repository's docs/MASTER-DEVELOPMENT-RECORD.md and inspect the current GitHub branches, open pull requests and relevant source files. Treat the record as a handover, not proof that the current repository or production system has not changed. Confirm the current branch/PR and deployment status before editing. Preserve all standing rules and existing working features. Do not merge, deploy or apply production Supabase migrations without my explicit approval.

For detailed historical reasoning, refer to the original ChatGPT conversations by title when available:
- **Continue SwiftDictionary Development** — 2.3.0 implementation, technical validation, branches and PR handover (November 10, 2026).
- **Continue SwiftDictionary Lessons** — 2.2.0 lesson design, testing and readiness.
- **SwiftDictionary Learning Structure** — 2.1.0 architecture and implementation decisions.
- **Website Creation Guide** — earlier project setup, repository and hosting context.

A conversation title is a useful locator, but does not guarantee access to every historical message. If a decision is not present in this record or retrievable from the referenced conversation, verify it from repository history or ask the owner rather than guessing.

## 9. Mandatory Master Development Record maintenance protocol

**This is a standing, mandatory development rule: every meaningful SwiftDictionary development action must be reflected in this file. The Master Development Record is the project's living source of truth and must be kept current throughout development, not only at release or handover time.**

Update this record:
- **Before or at the start of a new milestone/task:** record the approved scope, roadmap impact, branch and relevant safety constraints when they are known.
- **After every meaningful implementation step:** record what changed, which files/modules were affected, and the branch/commit containing the work. Do not wait until an entire feature is finished.
- **Whenever the roadmap changes:** update the relevant milestone status, dependencies, scope, priority, blockers and next steps immediately.
- When a design or owner decision is confirmed, changed or superseded.
- When a bug is discovered, diagnosed, fixed, deferred or regression-tested.
- When automated, local, mocked, manual-browser, staging or production tests are run; record exact results and limitations.
- When a branch or pull request is created, updated, retargeted, reviewed, merged or closed.
- When a migration or configuration change is prepared, applied, rolled back or verified, identifying the environment precisely.
- When deployment is started, succeeds, fails or is rolled back.
- At the end of each development session, record the last known good state, unfinished work, blockers and the exact next action. If an error interrupts work, record the error and recovery point as soon as possible.

For every roadmap milestone, keep a clear status such as **Planned**, **Design approved**, **In progress**, **Implemented on branch**, **Automated tests passed**, **Manual tests passed**, **Blocked**, **Merged**, or **Deployed**. These are distinct states: never imply that one proves another. Record dates, commit hashes, PR numbers, test-run links and deployment environment/URL where available.

Keep a concise chronological progress log under the active milestone so a future conversation can resume without reconstructing the entire Git history. Update the top-level current-work summary and roadmap whenever the active milestone or its status changes. If repository access or a tool error prevents an update, explicitly report that the record could not be updated and make it the first recovery task; do not silently continue as though the record is current.

Never include secrets, service-role keys, OAuth secrets, private account identifiers, personal allowlist values or real user data. Record only the minimum technical detail needed for continuity.


## 10. Audit and privacy-first decision addendum — 13 November 2026

### Owner decision

The owner selected **privacy-first practice-result integrity** for Update 2.3.0:
- Keep aggregate correct/question counts only; do not persist individual answers, answer selections or per-question event logs.
- Validate content IDs, topics, difficulty, learning language and activity source against an approved server-side catalogue.
- Treat accuracy as self-reported practice performance, not tamper-proof proof of mastery.
- Use these signals for personal progress and adaptive revision only; not for certification, billing or other high-stakes decisions.

See `docs/UPDATE-2.3.0-PRIVACY-FIRST-CATALOGUE-DECISION.md`.

### Implementation and validation

- Fixed a race between `record_completed_lesson_practice_result()` and learning-history deletion by taking the same per-user transaction advisory lock.
- Added `tests/update-2-3-0/test-history-replay-deletion-concurrency.sh`.
- Added `docs/UPDATE-2.3.0-CONTENT-CATALOG-MIGRATION-DRAFT.sql`, a private catalogue of 95 English IDs: 28 Daily Topics, 25 Daily Applications, 27 Daily Discoveries and 15 permanent lessons. It contains IDs and topic/difficulty/language metadata only, no question or answer content.
- Daily session start and permanent lesson completion/replay RPCs validate catalogue mappings. Lesson progress insertion is guarded against unknown lesson IDs.
- Added a frontend-to-SQL catalogue consistency checker, SQL security/mapping assertions and signed-in Daily Topic/Daily Application browser tests.
- GitHub Actions run [#346](https://github.com/WhiteWingCat/wordbook/actions/runs/43382607103) passed all 3 jobs on the implementation branch: PostgreSQL 17 migrations/assertions/concurrency, disposable local Supabase Auth compatibility, and Chromium browser tests (8/8).
- Browser tests use a mocked Supabase client. They do not prove real Google OAuth callbacks, hosted account switching or cross-device sync.
- PR #3 remains **open and draft**, with base `feature/update-2-3-0-planning` and head `feature/update-2-3-0-allowance-foundation`. No merge, rebase, deployment or production migration was performed.

### Read-only production Supabase review

- Project is active and its primary database region is Tokyo, Japan.
- The production schema does not yet contain the Update 2.3.0 Daily Learning session table or the new private content catalogue. The 2.3.0 migration drafts remain unapplied.
- Existing application tables reviewed have RLS enabled and user-scoped policies. A full penetration test and independent Data API exposed-schema review remain outstanding.
- Production `lesson_practice_results` currently allows authenticated users to insert their own rows under an owner-scoped policy. This permits self-reported aggregate results to be fabricated by that user; it does not expose another user's rows. The 2.3.0 draft narrows direct writes through an RPC and validates lesson/topic identity, but deliberately does not claim to verify each answer.
- The security advisor flags `public.is_personal_learning_test_access()` as an authenticated-callable SECURITY DEFINER function. It returns only whether the caller's own UID has the personal test exemption; anonymous execution is denied. Review whether it should remain a public RPC or be moved to the private schema during a future hardening pass.
- The private learning-limit exemption table has RLS enabled and no client policies; this is intentional.
- The advisor also reports leaked-password protection disabled. The app's current sign-in flow uses Google OAuth; verify whether password-based sign-in is enabled or intended before changing this setting.
- No production settings, schema or data were modified.

### Legal and privacy planning

- Added `docs/SWIFTDICTIONARY-LEGAL-PRIVACY-REVIEW-2026-11.md`.
- The Malaysia PDPA scope is fact-specific: Act 709 regulates personal data in commercial transactions, and the statutory definition includes matters relating to the supply or exchange of goods/services. A free service is not automatically exempt. Obtain Malaysian legal advice on the project's actual status and activity.
- Screen the DPO criterion for regular/systematic monitoring because adaptive revision uses accumulated learner performance. Also complete DPIA screening, bilingual privacy notice, retention, rights/export/deletion procedures, processor inventory and cross-border transfer assessment.
- Because the intended audience is global, decide whether EU residents are intentionally included and complete GDPR applicability screening. The 16+ product threshold is not a blanket exemption from child-data obligations.
- This review is planning guidance, not legal advice. No final privacy notice has been approved.

### Remaining gates

1. Complete authenticated real-provider testing, especially Google OAuth callback, account switching and cross-device saved-word sync.
2. Complete the remaining read-only Supabase configuration/exposure review and decide how to address the exposed self-status SECURITY DEFINER RPC and unnecessary anonymous table grants.
3. Obtain legal review of PDPA scope, DPO/systematic-monitoring status, GDPR targeting, cross-border transfer basis and any registration class.
4. Finalise the bilingual privacy notice, retention schedule, deletion/export request handling and incident-response procedure.
5. Complete Update 2.3.0 release-candidate review and owner manual testing.

All production safeguards remain in force: no merge, deployment or production Supabase migration without explicit owner approval.


## 11. Saved-word least-privilege review — 13 November 2026

A further read-only production review found that `public.saved_words` and its identity sequence grant `anon` and `authenticated` more privileges than the browser uses. The table is protected by owner-scoped RLS, but anonymous table privileges (including TRUNCATE) and authenticated UPDATE/TRUNCATE/REFERENCES/TRIGGER plus excess sequence privileges are unnecessary.

A draft-only hardening migration now:
- Revokes all PUBLIC, anon and authenticated grants on the saved-word table and identity sequence.
- Grants authenticated users only table SELECT, INSERT and DELETE.
- Grants authenticated users sequence USAGE only.
- Preserves existing owner-scoped RLS policies.

The app was checked and uses only SELECT, INSERT/upsert with ignore-duplicates, and DELETE for saved words. No production grant was changed.

Validation: GitHub Actions run [#354](https://github.com/WhiteWingCat/wordbook/actions/runs/43383331625) passed all 3 jobs, including the new saved-word table/sequence privilege assertions, catalogue-to-frontend consistency (95 entries), PostgreSQL 17 migration and concurrency tests, disposable local Supabase compatibility, and Chromium browser tests (8/8).

The 13 November legal review was refined to clarify the PDPA personal/household exemption and breach-notification thresholds. Those changes were documentation-only. The implementation remains draft on PR #3; PR #3 and PR #4 remain unmerged. No production Supabase changes, merge or deployment have occurred.


## 12. Staging and privacy-notice follow-up — 13 November 2026

- Added `docs/UPDATE-2.3.0-STAGING-MANUAL-VALIDATION-CHECKLIST.md` for real Google OAuth, account switching, cross-device saved-word sync, Daily Learning, aggregate-only data, timezone, deletion, RLS and privacy checks.
- The connected Supabase workspace currently exposes only the production SwiftDictionary project; no separate staging project was available. Real hosted OAuth and cross-device validation are therefore blocked pending a separate staging project. Production will not be used for Update 2.3.0 migration testing.
- Updated `PRIVACY-POLICY-DRAFT.md` to list GitHub Pages/GitHub and jsDelivr in addition to Google and Supabase. The app loads Supabase JS and Hanzi Writer from jsDelivr and requests per-character stroke-order JSON; the character appears in the CDN asset path. This is not an account identifier, but it is a third-party request and should be disclosed and considered for self-hosting.
- The privacy notice remains English-only draft with placeholders for controller identity, monitored contact, address, exact provider locations, subprocessors and retention. Prepare a Bahasa Malaysia version before publication if PDPA applies.
- Current validation baseline remains GitHub Actions run #354 (3/3 jobs, browser 8/8); subsequent changes in this section are documentation only.
- No staging project was created, no production data/settings were changed, and no merge or deployment was performed.

## 13. Update 2.3.0 completion and Update 2.3.1 handover — 13 November 2026

### Update 2.3.0 — completion record

- **Status:** Completed as a development milestone; merged to main on 2026-11-13.
- **Pull request:** [#3 — SwiftDictionary Update 2.3.0 — Completion-Based Allowance Foundation](https://github.com/WhiteWingCat/wordbook/pull/3).
- **Merge commit:** 090f5f47ef7e596d987b8ab2f5a1eb996c8f22e6 (squash merge).
- **Main branch head confirmed:** 090f5f47ef7e596d987b8ab2f5a1eb996c8f22e6.
- **Automated validation before merge:** GitHub Actions runs [#398](https://github.com/WhiteWingCat/wordbook/actions/runs/43386713881) and [#399](https://github.com/WhiteWingCat/wordbook/actions/runs/43386720980) passed. They covered PostgreSQL 17 allowance/migration/concurrency checks, disposable local Supabase Auth/migration/deletion checks, Chromium browser regression tests and the local Supabase security advisor check.
- **Owner live testing:** the owner reports testing the live website after merge and identified follow-up issues now tracked under Update 2.3.1. These are post-merge findings, not evidence that the 2.3.0 merge failed.
- **Deployment:** a GitHub Pages workflow was observed starting after the merge. The owner subsequently confirmed live-site testing. Do not infer that every hosted integration check passed without checking current Actions status.
- **Production database:** no production Supabase migration or production data modification was performed as part of the merge. A read-only audit on 2026-11-13 later confirmed that the live project migration history still ends at the 2.2.0 reconciliation baseline (20261110041007).
- **Production schema finding:** the live project has no `public.daily_activity_sessions`, no `private.learning_allowance_usage`, no `event_type` column on `public.learning_activity_log`, no daily-activity preference fields, and none of the Daily Activity / allowance-ledger RPCs. Its `learning_plan_limits` table still contains only lesson, quiz and flashcard categories. A read-only function lookup returned no Daily Activity or allowance usage RPCs. This confirms that the merged 2.3.0 frontend and production database are currently out of sync.
- **Separate release gates:** hosted Google OAuth callback and cross-device sync verification, privacy-notice/legal finalisation, and real-account staging checks remain separate from the completed source-control milestone.

### Update 2.3.1 — Bug Fix & Changes

**Status:** New development branch created; implementation and validation in progress. No merge or deployment is authorised by this record.

- **Release label:** SwiftDictionary Update 2.3.1 — Bug Fix & Changes.
- **Branch:** feature/update-2-3-1-bug-fix-and-changes.
- **Base:** main at merge commit 090f5f47ef7e596d987b8ab2f5a1eb996c8f22e6.
- The requested display name contains spaces and an ampersand, which Git branch refs do not permit; the branch uses a valid slug while retaining the requested release label.

#### Owner-requested scope

1. **Integrate Daily Learning into Lessons.** Remove the separate top-level Daily Learning navigation destination. Show the daily activity section within Lessons, above Beginner / Intermediate / Advanced difficulty navigation. Audit and correct activity flows, content rotation, allowance display, start/resume/replay, completion, abandonment, adaptive revision and language compatibility. Daily activities must behave as part of Lessons, not as a detached page.
2. **Rename Profile to Dashboard.** Change user-facing labels and headings to Dashboard / Your Dashboard. Keep signed-in-only access and account isolation.
3. **Separate Preferences.** Move Account Preferences and Privacy and Data controls into a dedicated Preferences destination. The account-menu Preferences action must open that destination directly. It must not route to Dashboard or depend on scrolling inside Dashboard. Preserve display name, avatar, learning language, translation language and timezone settings; preserve learning-history deletion semantics.
4. **Visualise allowances on Dashboard.** Replace the plain text daily allowance summary with visual progress indicators consistent with the allowance presentation on Lessons. Show usage/remaining amounts per activity and plan, respecting local timezone and the server-side allowance source.
5. **Favorite words on Dashboard.** Add a Favorite words panel with expandable English and Chinese rows. Each row expands to show the signed-in user's saved words in the same card/grid presentation and course-specific ordering/format as the Dictionary. Reuse existing saved-word records; do not duplicate or weaken the saved-word data model. Keep content scoped to the authenticated user and ensure account switching/sign-out clears the view.
6. **Dashboard avatar and heading.** Place the selected large profile icon to the left of Your Dashboard, using the existing account profile avatar selection.
7. **Practice insights visualisation.** Improve visual prominence with a chart (bar or pie where semantically appropriate) based only on existing aggregate correct/question counts. Clearly identify specific topic(s) needing review and explain why they are recommended. Avoid inventing data or treating self-reported aggregate scores as verified mastery.

#### Technical and UX acceptance criteria

- Daily activities appear inside Lessons above difficulty tabs, with a clear way to switch between daily activity cards and the permanent lesson library without navigating away from Lessons.
- Daily activity preferences remain account-specific, persist through Supabase, and are editable in the integrated Lessons section.
- All enabled activities remain visible; disabled activities remain hidden; no enabled activities produces an understandable empty state.
- A successful completion consumes exactly one applicable allowance; starting, resuming or abandoning does not. Replays of completed content do not consume a second daily allowance. When today's allowance is exhausted, the UI must explain this and must not offer a misleading new-start action.
- Daily Topic / Discovery completion and scored Application / Revision completion are correctly distinguished. Aggregate practice results remain the only stored performance detail; no raw answer selections are persisted.
- Daily Revision uses actual available learning evidence and a defensible minimum-evidence threshold, avoids repeatedly serving the same topic on the same local day, and visibly explains the recommended topic/reason. New users with no practice history receive a clearly labelled introductory review, not a fabricated weak-topic diagnosis.
- Language availability is explicit. If Daily Learning content is English-only, show that limitation clearly and do not silently disable activities because the course selector differs. If bilingual content is implemented, ensure course language and translation language are handled separately and consistently.
- Dashboard allowance bars match the allowance totals used by the Lessons allowance UI and server-side completion ledger; no inconsistent client-only calculation.
- Favorite words use the existing saved_words table and owner-scoped RLS. English and Chinese lists are independently expandable, empty states are clear, and selecting a saved word opens the matching dictionary detail or equivalent accessible detail.
- The large avatar is read from the signed-in profile and updates when the avatar selection changes.
- Active learning languages are derived from real learning activity records and sorted by most recent activity. Do not use the saved preference as a proxy for actual activity. Show last active date/time with course language and account timezone where possible.
- Practice charts have accessible text equivalents, labels and denominators. Topic recommendations are derived from available practice data and explained. Empty/insufficient data is handled without misleading charts.
- Existing dictionary search, word-grid layout, saved-word sync, Google authentication, account switching, lessons, translation switching, stroke-order functionality and unlimited free dictionary search must pass regression testing.
- No raw answers, new tracking categories or unnecessary personal data are added.

#### Investigation findings at branch creation

- The current index.html has a separate top-level Daily Learning navigation button and a standalone dailyLearningPage; its route key is daily-learning.
- The current Profile page contains Learning progress, Practice insights, Account preferences, Privacy and data, and Account sections. The Preferences menu currently routes to Profile and scrolls to a nested card.
- daily-learning.js loads English daily content only and disables activity start when either the saved learning language or global course selector is not English. This is a likely source of confusing UX and must be resolved explicitly; do not claim Chinese daily activity support unless content is actually supplied.
- Current daily content selection rotates based on completed activity log events and session records. Inspect content reuse, current-day completion handling, allowance exhaustion, interrupted sessions and replay semantics before changing.
- The Dashboard currently derives Learning languages from distinct language_code values in completed activity rows, but does not show recency. Update it to show each actually active language ordered by latest activity.
- Practice insights currently aggregate up to 10 recent practice summaries and calculate due topics using a simplified threshold. Improve explainability and presentation without storing raw answers.
- The app's saved-word system already uses Supabase saved_words for signed-in accounts and has account-isolation protections. Reuse that source rather than copying saved words into a new table or shared local storage.

#### Legal, privacy and content review for 2.3.1

- Malaysia PDPA applicability remains fact-specific; a free public service is not automatically outside the Act. Obtain Malaysian legal advice on controller status, the commercial-transaction scope, notice/consent, retention, user rights and cross-border transfers.
- The new Dashboard is a more visible presentation of existing account-linked learning history, preferences and saved words. Keep it private to the authenticated owner; do not expose it through public URLs, shared caches, analytics or another account's session.
- Reuse existing aggregate practice data only. Do not introduce raw answer logging, new behavioural tracking, or a more intrusive profiling model. Explain adaptive-review recommendations in the interface.
- Saved words and language activity remain personal data when linked to an account. Preserve RLS and least-privilege grants; verify account switching and sign-out clearing.
- Charts and weak-topic displays must not be presented as certification, a formal assessment or proof of ability. They are learner-facing summaries based on self-reported aggregate practice outcomes.
- The intended audience remains 16+ and global. Screen relevant child/teen and international privacy obligations, including GDPR applicability if EU users are deliberately targeted.
- Review existing content and third-party source licences if Daily Learning content is expanded or reused. Do not copy protected exercises or source material without permission.
- No new user-data table is planned. The implementation does add an authenticated, read-only public RPC for current allowance counts because the underlying ledger is intentionally private. Its migration must be documented, tested locally, reviewed for RLS/grants/rollback, and separately approved before production application.

#### Implementation progress after initial branch review — 13 November 2026

- The requested branch was already present when this work resumed, with three initial commits based on the merged 2.3.0 main commit. Work has continued on that branch; no duplicate branch was created.
- Daily Learning is now embedded in the Lessons page above the permanent lesson difficulty navigation. The separate top-level Daily Learning navigation button has been removed. The existing route is retained as an alias to Lessons for backward compatibility.
- The Daily Learning loader no longer derives allowance usage from `learning_activity_log`. It reads the current-window counters from `public.get_my_learning_allowance_usage()`, then uses the server count to rotate daily content and calculate remaining allowance. Card states distinguish unavailable allowance data from an exhausted allowance; active sessions and free replays remain resumable.
- The Dashboard allowance bars use the same owner-scoped RPC and the existing `private.learning_allowance_usage` ledger. This is intentional: deleting learning history must not restore allowance. If the RPC is unavailable, the Dashboard reports usage as unavailable rather than displaying a false zero.
- The new RPC is added to the existing allowance-ledger migration draft. It is `SECURITY INVOKER`, revokes execution from `PUBLIC` and `anon`, grants execution to `authenticated`, and delegates each count to the existing private helper, which verifies `auth.uid()`. It does not expose direct browser access to the private ledger.
- Dashboard course recency is derived from completed activity records, ordered newest-first, and displayed in the user's preferred account timezone. The exact total activity count uses the database count result; the latest activity rows are used to determine each language's last-active timestamp.
- The Dashboard and Preferences pages, expandable English / Simplified Chinese Favorite words, large avatar heading, visual allowance bars, practice chart and topic-review list are present in the current branch implementation.
- The Dashboard now degrades gracefully against the live 2.2.0 schema: it retries the legacy `user_preferences` and `learning_activity_log` shapes, tolerates the not-yet-created `daily_activity_sessions` table, and shows allowance usage as unavailable rather than inventing zero usage. Daily Learning displays a clear “waiting for a server update” message when its required columns, tables or RPCs are missing. A browser regression test simulates this exact legacy database state.
- Additional browser coverage verifies that adaptive Daily Revision selects a weak topic from aggregate practice history, abandoning an activity consumes no allowance, Daily Discovery completes without a score, and completion/abandonment feedback remains visible after refreshing the cards.
- Regression coverage has been updated for the integrated Lessons navigation, signed-out access, Daily Topic / Application RPC flows, Dashboard favorite words, course recency, ledger-based allowances, practice insights and Preferences navigation. The frontend mock now applies the same row filters as Supabase so completed sessions are not incorrectly treated as active sessions.
- The branch-specific CI workflow now runs on pushes to this feature branch as well as the original 2.3.0 foundation branch. Several early runs exposed stale test selectors and fixtures; those test issues have been corrected. Do not mark validation complete until the latest run for the current head passes all three jobs.
- **Production database remains untouched.** The read-only audit confirms the live database is still at the 2.2.0 baseline and is missing the 2.3.0 Daily Learning / allowance schema and RPCs as well as the new 2.3.1 allowance-read RPC. The hosted Daily Learning and Dashboard allowance paths cannot be considered production-ready until the full, ordered 2.3.0 database migrations plus the 2.3.1 read RPC are reviewed, applied with explicit approval, and verified against the hosted site. Do not apply them without explicit approval.

#### Malaysia and global privacy-risk review for Update 2.3.1

- The Dashboard surfaces account-linked saved words, learning-language codes and last-completed timestamps, topic identifiers, and aggregate first-attempt correct/question counts. These records can identify a learner when linked to their account and should be treated as personal data. No raw answer choices, free-text answers, or third-party analytics are introduced by this update.
- Malaysia's PDPA 2010 is framed around personal data processed in respect of commercial transactions. SwiftDictionary is currently intended as a free personal learning project, while a Premium plan remains undecided; the operator, actual service model and commercial context must be reviewed before monetisation or broader launch. Do not assume that the free label alone resolves applicability.
- The 2024 PDPA amendments commenced in phases on 1 January, 1 April and 1 June 2025; the amended provisions are therefore in force as of this record date. The review must cover notice and choice, purpose limitation, data minimisation, security, retention, data integrity, access/correction, breach response and any applicable data-controller obligations.
- The connected Supabase project is hosted in `ap-northeast-1` (Tokyo). Review the Malaysia PDPA cross-border-transfer requirements and the processor/vendor arrangements for this hosting location. The Privacy Notice should identify relevant data categories, purposes, processors/recipients, transfer locations, retention, user rights and the learning-history deletion behaviour.
- The Act requires a written privacy notice in Bahasa Malaysia and English. A final notice should be prepared in both languages before public release; a Chinese course does not remove this statutory-language review.
- JPDP's published FAQ identifies regular and systematic monitoring (including online user-behaviour tracking) as a possible DPO-appointment trigger. Because course recency and practice performance are now tracked, assess DPO applicability against the actual scale and processing pattern rather than assuming it is or is not required. Also document a breach-notification process.
- The intended audience is 16+. Review treatment of 16–17-year-old users and any relevant guardian/representative requirements, plus child-privacy rules in other target jurisdictions. Global availability may trigger laws beyond Malaysia's PDPA.
- Keep the privacy design minimal: use aggregate practice counts, do not persist individual answer choices, keep allowance records separate from deletable learning history, enforce account-scoped RLS, and explain the retention exception for allowance usage. This is a planning review, not a legal opinion or compliance certification; obtain Malaysian legal advice before launch or monetisation.
- Official references: [Malaysia PDPA 2010 and 2026 reprint](https://pdp.gov.my/wp-content/uploads/2026/10/Akta-709-cetakan-semula-2026-BI.pdf), [PDPA Amendment Act 2024 commencement notice](https://www.pdp.gov.my/en/akta/personal-data-protection-amendment-act-2024-appointment-of-date-of-coming-into-operation/), [JPDP FAQ](https://www.pdp.gov.my/en/faq/).

#### Validation and release discipline

- Implement on this feature branch only. Do not edit main.
- Use incremental analysis and consolidated validation; do not create intermediate ZIPs.
- Add regression tests for the seven requested areas and retained functionality.
- Distinguish static checks, automated browser tests, mocked Supabase tests, real hosted OAuth tests and owner live-site tests.
- No production Supabase writes/migrations, PR merge or GitHub Pages deployment without explicit owner approval.
- After implementation, prepare one consolidated Update 2.3.1 candidate and update this record with exact commit, PR, CI and test evidence.


---

## 14. Free-first development, hosting and testing policy

**Owner preference:** SwiftDictionary should be developed, hosted, tested and maintained using free alternatives wherever reasonably practical. Avoid recurring payments, paid tiers, paid domains, paid developer tools and unnecessary infrastructure. Do not recommend a paid upgrade as the default solution. If a paid service appears necessary, first investigate a genuinely free alternative or a lower-cost workflow, explain the trade-offs and obtain the owner's approval before any commitment.

This is a standing project constraint, not a guarantee that every free service will remain free or have sufficient quotas. Check current provider pricing, free-tier limits, usage caps, project sleep/pause rules, storage/egress limits and terms at the time of use. Never enable billing, add a payment method, purchase a domain or upgrade a plan without explicit approval.

### Preferred free-first choices and alternatives

- **Source control:** Continue using the existing GitHub repository and branches. Prefer GitHub's free features and ordinary pull requests; do not assume paid team or enterprise features.
- **Production hosting:** Keep the existing GitHub Pages deployment unless the owner explicitly approves a migration. Do not disrupt the live URL or its integrations in order to experiment.
- **Testing/preview hosting:** Use the existing Cloudflare Pages project `swiftdictionary-testing` and its automatically generated branch preview URLs. The project is connected to `WhiteWingCat/wordbook`; production branch is `main`; preview branches are configured for all non-production branches. This is a separate test host and does not replace GitHub Pages.
- **Free preview URLs:** Prefer the supplied `.pages.dev` and `.github.io` hostnames. A custom domain generally requires domain registration/renewal fees; do not buy one just to remove a username or use a branded URL until free options have been assessed.
- **Build and CI:** Prefer static hosting with no build step where suitable, and free GitHub Actions allowances. Keep workflows efficient and check current minutes/concurrency quotas. Do not introduce paid build services without approval.
- **Database/authentication:** Prefer the existing Supabase setup while protecting production data. For isolated integration tests, investigate a separate free Supabase project if the current free-plan project allowance and quotas permit, or use a local Supabase stack through the CLI/Docker where practical. Do not assume paid Supabase Branching or paid compute is available.
- **Local testing:** Prefer browser automation, local static hosting, deterministic fixtures, mock service adapters and local database tests before using live services. Use existing tools and free/open-source tooling where practical.
- **Secrets and configuration:** Never copy production service-role keys, OAuth client secrets or private credentials into source control, browser bundles, test fixtures or public preview settings. Use separate test credentials and redirect URLs for an isolated environment.
- **Alternatives review:** Before proposing a new paid dependency, compare at least one free/open-source, local, or existing-provider alternative. Record why it is sufficient or why it does not meet the requirement.

### Testing levels and what a “mock account” means

A mock account can mean two different things; do not conflate them:

1. **Frontend mock user (no real Supabase account):** A deterministic test fixture or mocked Supabase client returns a synthetic user/session and simulated profile, preferences, saved words and activity data. This is suitable for testing UI states, navigation, account-menu behaviour, empty/loading/error states and basic account-isolation logic. It does **not** prove real Google OAuth, Supabase Auth, JWT/session handling, Row Level Security (RLS), database triggers, RPC permissions or cross-device synchronisation. Label these tests as mocked.
2. **Real test user in an isolated backend:** Create a dedicated test identity in a separate local or staging Supabase project. This can exercise real authentication, database policies, migrations, RPCs and account data without touching production. Prefer this for end-to-end integration testing. Use synthetic data only and keep test credentials separate from production.

**Do not create a mock/test user in the production Supabase project as a substitute for an isolated test environment.** A real Auth user in production is still a production account; its records, quotas, logs, email/identity provider behaviour and cleanup may affect the live project. A separate email/password test identity in production would not isolate database changes or prove the preview is using a separate backend.

### Current Cloudflare preview / Supabase separation status (13 November 2026)

- Cloudflare Pages project `swiftdictionary-testing` has successfully deployed the `main` production branch and the non-production feature-branch preview for `feature/update-2-3-1-bug-fix-and-changes`. The owner confirmed the preview deployment updated and the `.pages.dev` preview website opens.
- The feature branch preview is a separate frontend deployment only. It must **not** be assumed to have a separate Supabase database or Auth tenant.
- The application configuration may still point to the existing production Supabase project. This must be checked read-only before testing sign-in, account switching, saved-word writes, preferences, learning completions, allowance usage, history deletion or any other data-changing flow.
- Until backend separation is confirmed, limit preview testing to static layout, navigation and safe read-only checks. Do not use real user accounts or submit test activity that could alter production data.
- Next environment audit: inspect the branch's Supabase URL/public key configuration and Cloudflare environment-variable settings without exposing secrets; identify the exact Supabase project reference used by the preview; inspect Auth URL allowlists and redirect configuration read-only. Do not change production Site URL, redirect URLs, database schema or data as part of this audit.
- If the preview currently points to production, choose between (a) a separate free staging Supabase project, subject to current free-tier availability/limits, or (b) a local Supabase stack for isolated integration tests. A frontend mock can be used in parallel for fast UI tests, but is not a replacement for backend integration tests.
- Before configuring a separate backend, inventory the minimum schema/migrations, Auth provider setup, OAuth redirect URLs, RLS policies, RPCs and synthetic seed data needed. Do not copy production personal data into staging. Do not expose or duplicate production secrets.
- No production Supabase configuration, production data, GitHub Pages deployment or PR merge was changed merely by creating the Cloudflare Pages preview or by adding this record section.

### Free-first decision checklist

Before adopting any service or workflow, record:
- What exact capability is needed?
- Can the existing GitHub, Cloudflare Pages, Supabase, browser or local development setup already provide it?
- Is there a free/open-source/local alternative?
- What are the current free-tier quotas, limitations, data-retention and inactivity rules?
- Does the option require a payment method, billing activation, domain purchase or future recurring payment?
- Could it affect production data, user privacy, account isolation, security or legal obligations?
- What is the migration/exit path if the free tier changes or is discontinued?

Default decision: choose the safest adequate free option; keep production isolated; document limitations; ask before incurring any cost.


### Read-only Supabase environment audit — 13 November 2026

- Connected Supabase organization: `SwiftDictionary Indie`.
- Connected project: `SwiftDictionary`, project reference `pzymiesazmpyvnfvsbsc`, region `ap-northeast-1` (Tokyo), status reported as healthy.
- Read-only inspection of `supabase-config.js` on both `main` and `feature/update-2-3-1-bug-fix-and-changes` found the exact same file blob and the same Supabase project URL/reference. Therefore, the feature-branch frontend is configured for the **same production Supabase project**, not an isolated test backend. The public publishable key is also configured in this static file; no secret/service-role key was intentionally exposed or added.
- The live project's migration history currently ends at `20261110041007` (`swiftdictionary_update_2_2_0_reconciliation_baseline`). The 2.3.0 Daily Learning and allowance migrations and 2.3.1 read RPC are not present in the recorded migration history.
- The public schema currently lists saved words, languages, profiles, preferences, entitlements, plan limits, learning activity, lesson progress and practice results; RLS is enabled on the listed tables. Row counts were inspected only as a structural check and should not be treated as a full security audit.
- This inspection was read-only. No Auth users, rows, schema, migrations, project settings or credentials were changed.
- The connected Supabase tools did not expose the project's Auth URL-configuration settings or Cloudflare Pages environment-variable settings. These still require a manual dashboard inspection. The source configuration finding is already sufficient to treat the preview as production-backend-connected unless a verified Cloudflare runtime override is found.
- **Immediate safety rule:** do not use the preview for real sign-in, account switching, saved-word writes, learning completions, allowance consumption or deletion testing until a separate backend is configured and verified. Use deterministic frontend mocks for UI-only testing in the meantime.


### Owner decision: isolated mock testing mode (13 November 2026)

The owner selected **Option B: a separate testing mode that simulates multiple users without changing the normal sign-in interface**.

Implementation requirements for the feature branch:

- Activate only through an explicit testing-mode entry mechanism (for example a dedicated preview-only query parameter or local test launcher); never show a mock-mode switch in the normal sign-in/account interface.
- Only enable on the Cloudflare Pages preview host and the feature branch. Fail closed on GitHub Pages, the production hostname, and unknown hosts. Do not rely on a query parameter alone as a security boundary.
- Use clearly fictional identities (for example Test User A and Test User B), with switch-user controls in a separate test panel.
- Simulated user data must be isolated per mock identity and stored only in a clearly namespaced browser test store (prefer session-scoped storage for the initial version). Switching identities must not leak saved words, preferences, progress, or activity between them.
- In mock mode, route all supported account/data operations to the mock adapter and prevent Supabase Auth, database, RPC, and storage network requests. Do not merely replace the displayed email while leaving production writes enabled.
- Show a persistent, unmistakable “MOCK TEST MODE — no real account / no cloud sync” indicator while active. Mock mode must never claim that data is synced to Supabase.
- Provide reset/clear test data controls, scoped only to the mock store. Do not clear browser-wide storage or real Supabase sessions.
- Keep the real Google sign-in flow unchanged and inaccessible as an action while mock mode is active; provide a safe exit back to normal mode.
- Mock mode is for frontend and client-side workflow validation only. It does not validate real Google OAuth, Supabase JWT/session behaviour, RLS, SQL functions, database triggers, or cross-device sync. Those require a separately isolated backend or local Supabase stack.
- Add automated checks proving (a) mock mode is disabled on production hosts, (b) the mock adapter makes no Supabase network/auth calls, (c) switching between at least two mock users isolates state, and (d) exit/reset does not modify production session/storage.
- Do not modify production Supabase settings, data or migrations. Do not add test-mode code to `main` until the owner approves the eventual PR merge.
- Before coding, map all Supabase calls used by `index.html` and `daily-learning.js`; the current app uses tables `user_preferences`, `saved_words`, `profiles`, `lesson_progress`, `user_entitlements`, `learning_plan_limits`, `learning_activity_log`, `lesson_practice_results`, `daily_activity_sessions` and RPCs `record_completed_lesson_practice_result`, `complete_permanent_lesson`, `delete_my_learning_history`, `is_personal_learning_test_access`, `get_my_learning_allowance_usage`, `start_daily_activity_session`, `abandon_daily_activity_session`, `complete_daily_activity_session`. The adapter must support only the subset actually needed for the intended UI tests and return explicit unsupported-operation errors for anything else; do not silently fake unimplemented server guarantees.
- Legal/privacy check: keep mock identities fictional, avoid real personal data, keep the mock store local to the browser session, and ensure test-mode controls cannot be enabled on production. This is a development tool, not a user-facing account feature.
- This is an approved design direction, not yet an implementation or validation claim. Record implementation commit and test evidence after the work is completed.


### Development progress log — isolated mock testing mode — 13 November 2026

**Current status: implemented on the 2.3.1 feature branch; automated CI passed; real Cloudflare preview-host manual verification is pending.**

- Updated this record's maintenance protocol to make it mandatory to update the Master Development Record after every meaningful development step, roadmap change, bug/test result, branch/PR change and at the end of each development session. It now explicitly requires recording interruptions/errors and a recovery point. Commit: `877c2ed778db8f1b1510ef9f8059c60607a6332d`.
- Added `mock-testing.js` as a separate, isolated mock adapter rather than placing the test framework inside the large `index.html`. It activates only when the explicit `?swiftMock=1` opt-in is present on the exact feature-branch preview hostname `feature-update-2-3-1-bug-fix-and-changes.swiftdictionary-testing.pages.dev`. Other hosts, including the Pages project root, GitHub Pages and unknown branch previews, fail closed.
- The adapter replaces the app's Supabase `createClient` only while this guarded mode is active. It provides fictional Test User A and B identities, a namespaced sessionStorage data store, separate saved words/preferences/progress per identity, simulated supported table operations and the required lesson/daily-learning RPC subset. Unsupported RPCs return an explicit mock error.
- The separate panel is visibly labelled **MOCK TEST MODE — NO REAL ACCOUNT / NO CLOUD SYNC**. It provides mock identity switching, scoped reset and exit. Google OAuth is disabled while mock mode is active. The app's legacy saved-word localStorage key is intercepted while mock mode is active so mock favourites are not written into the real browser-local favourites store.
- `index.html` loads `mock-testing.js` after `supabase-config.js` and before the main application script, so the mock client is selected before account initialisation.
- Added `tests/update-2-3-1/mock-testing.test.mjs` covering exact-host opt-in, production/unknown-host fail-closed behaviour, two-user data isolation, session-only storage, mock OAuth blocking, daily session completion and allowance counting.
- Added a browser smoke test proving that the explicit query parameter does not activate mock mode on the local test server.
- Added the isolated mock unit tests and JavaScript syntax check to the existing branch-scoped GitHub Actions workflow. No new paid service, package or backend project was introduced.
- CI run #446 (workflow run ID 43413175601) found a test assertion issue caused by cross-realm arrays. CI run #450 (workflow run ID 43413358201) found the headless test document lacked a DOM lookup method; the adapter's panel renderer was guarded for headless contexts. CI run #452 (workflow run ID 43413462404) then exposed two remaining cross-realm array assertions in the second-user checks; all matching assertions were normalised to host-realm arrays. These were test-harness compatibility issues, not evidence of a production app failure. Latest CI run #456 (workflow run ID 43413625418) is running against the corrected commit; obtain a passing result before calling the adapter validated.
- Latest CI run #456 (workflow run ID 43413625418) completed successfully: the mock adapter syntax check and all 5 mock unit tests passed; the PostgreSQL 17 migration/allowance job passed; the Chromium browser regression job passed, including the local-host fail-closed check; and the disposable local Supabase Auth compatibility job passed. This is CI evidence only. Real Cloudflare preview-host interaction has not yet been manually tested.
- The mock adapter does not test Google OAuth, JWT/session security, RLS, real SQL/RPC behaviour, database triggers or cross-device sync. It does not remove the need for an isolated Supabase staging project or local Supabase integration tests.
- No Supabase project, Auth user, production data, schema, migration, setting, GitHub Pages production deployment or PR merge was changed by this implementation. PR #5 remains open and unmerged.

### Repository tidiness review — 13 November 2026

The repository was reviewed at the root and within the main `docs`, `tests` and `.github/workflows` areas. **No existing files were deleted or moved.** The current non-Master-Record files have distinct purposes:

- Keep application/runtime files such as `index.html`, `daily-learning.js`, `supabase-config.js`, `mock-testing.js`, `banner.svg` and `feedback.html`.
- Keep `tests/`, `playwright.config.js` and `.github/workflows/`: they provide automated regression, browser checks and local database validation. The new mock test is intentionally separate from the production app code.
- Keep `README.md`, `RELEASE-QA.md`, `THIRD_PARTY_NOTICES.md`, `ARPHICPL.TXT` and `PRIVACY-POLICY-DRAFT.md`: these serve setup/release, licensing, attribution and privacy-review purposes.
- Keep the `docs/` design decisions, technical notes, legal/privacy review, manual staging checklist and SQL migration drafts. They document different decisions, environments and migration layers; a SQL draft is not equivalent to an applied migration.
- Keep the older `UPDATE-2.1.0-TECHNICAL-PLAN.md`, `UPDATE-2.3.0-PLANNING.md` and 2.2.0 migration files as historical/release traceability until their references and relevance have been checked. Do not delete or relocate them merely because a newer Master Development Record exists.

**Tidy-up conclusion:** the branch needs supporting source, tests, workflows and technical/legal records in addition to the Master Development Record. The Master Development Record should be the single current roadmap and handover authority; specialised files remain as supporting detail. Revisit consolidation only after checking all internal links, workflow references and historical migration evidence.

## 19. Update 2.3.1 — Daily Discovery three-slot global schedule implementation (2026-11-14)

### Owner decision

The owner selected **Option A**:
- Free sees only the first globally scheduled Discovery entry for the UTC day.
- Premium sees all three scheduled entries.
- Free does not see locked placeholders or previews for entries two and three.
- The existing completion allowance remains Free = 1 and Premium = 3 per allowance day.

### Implementation on the existing feature branch

- Expanded the active Discovery vocabulary from 12 to **93 unique, curated English words**. Each entry includes an original definition, Simplified Chinese definition, pronunciation, part of speech, explanatory note, two or more examples, and an English usage note with Chinese translation.
- The 93-entry pool provides **31 days at three distinct entries per UTC day**.
- Added schedule version 1, fixed UTC epoch 2026-11-15, and a fixed pool size of 93. Each date receives three consecutive entries from the ordered pool. The schedule is deterministic and independent of user ID, account completion, local timezone, and mock selection offsets.
- The pool size is pinned. Appending/reordering content must not silently change published assignments; a future expansion requires an explicit schedule-version change and reviewed catalogue migration.
- The frontend now renders three separate Discovery cards for Premium and only the first card for Free. It does not render locked cards for Free. Each card opens its own scheduled word and preserves the existing dictionary-style reader.
- Discovery usage notes now display the selected translation language where a Chinese translation is available.
- Added private rotation_order metadata (1–93) to the approved content catalogue. The server validator checks the UTC date, approved base ID, scheduled rotation slot and active plan allowance. start_daily_activity_session now calls the approved-content validator before creating a new session, preventing a Free user from bypassing the hidden second/third entries through a direct RPC call.
- The catalogue remains server-only with RLS and no client SELECT access. It stores IDs and schedule metadata, not vocabulary text or learner answers.

### Tests and source-level validation

- Updated the frontend catalogue checker and SQL catalogue draft to match all **161** approved content records: 28 Daily Topic, 25 Daily Application, 93 Daily Discovery, and 15 permanent lessons.
- Added browser coverage for Free one-card visibility, Premium three-card visibility, identical schedules across separate accounts, and uniqueness within a daily set.
- Added SQL assertions for contiguous rotation order, Free slot-one-only validation, Premium slots one through three, rejection of an unscheduled fourth entry, stale/impossible UTC dates, and direct-RPC bypass attempts.
- Updated frontend schedule tests for deterministic same-date assignments, no repeats on adjacent days, no repeat across the 31-day rotation boundary, and use of all 93 entries exactly once per cycle.
- Source-level checks performed during implementation: JavaScript syntax compilation passed; all 93 entries have unique IDs and words and complete required fields; frontend IDs/metadata and SQL catalogue rows match exactly (161 records); the schedule helper returned three entries per date and passed the 31-day uniqueness and boundary checks; test source files passed syntax compilation after module imports were stripped for the check.
- **Full CI, Playwright browser execution and disposable PostgreSQL/Supabase SQL assertions have not yet been run for this implementation.** No new GitHub Actions run is associated with the latest feature head yet. Source-level checks must not be described as full CI validation.
- The Cloudflare preview has not yet been owner-tested with Free and Premium mock accounts.

### Legal, privacy and release boundaries

- The new word definitions, explanations, translations and examples were authored for this project; no third-party dictionary text or external spoken-corpus data was imported for this expansion.
- No new personal-data field, user tracking, answer-level telemetry, or global learner-completion record was added. Per-user completion and allowance remain account-scoped.
- This is a planning and engineering review, not a legal-compliance certification. Malaysia PDPA and applicable global privacy/age obligations remain project-wide requirements. If Premium is later commercialised, review subscription terms, price/renewal/cancellation disclosures and applicable consumer obligations before launch.
- No production Supabase migration, production data operation, merge or deployment was performed. Dashboard remains frozen.

### Current recovery point and next actions

1. Continue on feature/update-2-3-1-bug-fix-and-changes; PR #5 remains open and unmerged.
2. Latest implementation commit at this record update: 6bc0791116ca0a96410a84a3e3fe6953943b2ae3.
3. Obtain full CI execution and inspect any failures before owner preview testing.
4. Confirm Cloudflare Pages has rebuilt the current head. Use only ?swiftMock=1 and fictional Free/Premium Test User accounts; do not use real accounts or production data-changing tests.
5. Verify Free sees exactly one Discovery card; Premium sees exactly three; both accounts share the same words for the UTC date; complete/abandon flows consume allowances correctly; translation switching updates definitions and usage notes; UTC rollover and local allowance reset remain understandable.
6. Do not merge PR #5 or deploy without explicit owner approval.


## 20. Update 2.3.1 — Daily Discovery implementation CI validation (2026-11-14)

### Full CI result

GitHub Actions run **#632** completed successfully against feature head **0531dfaea4903630eb147a75fdbbc122fbf8871d**:
https://github.com/WhiteWingCat/wordbook/actions/runs/43561897142

All three jobs passed:

- **Chromium browser regression:** 17 tests passed. The new plan-visibility test confirmed Free sees exactly one Discovery entry, Premium sees three, and two separate Premium accounts receive the same three scheduled words. Existing Daily Learning, translation, lesson, Dashboard non-regression, sign-in and account-switching tests also passed.
- **PostgreSQL 17 migration and allowance tests:** passed. This includes catalogue order and approved-ID validation, Free/Premium slot enforcement, direct-RPC bypass rejection, allowance-ledger assertions, learning-history deletion, and concurrency tests.
- **Supabase CLI local Auth compatibility:** passed. The private catalogue, allowance and Daily Learning migrations/assertions ran against disposable local Supabase services; security-advisor checks passed.

The CI run follows two corrected test-fixture issues: SQL exception-message quoting, then replacement of obsolete synthetic content IDs with approved catalogue entries. The final run #632 includes those corrections.

### Release status

1. PR #5 remains open, targets main and is not merged.
2. Latest validated code/test commit: 0531dfaea4903630eb147a75fdbbc122fbf8871d. Subsequent commits only updated this development record; no application or test files changed after run #632.
3. CI success does not replace owner preview testing. The latest Cloudflare preview build has not yet been independently confirmed or tested by the owner.
4. Continue using only the explicit mock preview and fictional Free/Premium accounts. Do not use real accounts or production data-changing tests.
5. No production Supabase migration, production data operation, merge or deployment was performed.
6. The next gate is owner preview testing of the Free/Premium Discovery experience and the existing Update 2.3.1 regression checklist. Do not merge or deploy without explicit owner approval.


## 21. Update 2.3.1 — Free/Premium mock accounts and final CI revalidation (2026-11-14)

### Mock preview plan fixtures

To make the owner preview testable without real accounts:
- Test User A is now a Free mock identity (1 Daily Discovery completion/day).
- Test User B is now a Premium mock identity (3 Daily Discovery completions/day).
- The mock control panel labels each identity with its plan.
- The mock adapter now returns matching plan entitlements and plan-limit rows, including Free/Premium lesson and daily-activity limits. Existing sessionStorage isolation and no-cloud/no-real-OAuth boundaries remain unchanged.
- Added mock unit coverage confirming the two plan fixtures and Premium's three-completion Daily Discovery allowance.

### Final CI revalidation

GitHub Actions run **#647** completed successfully against code/test commit **308138b72917161d14ba5c5ed028a293509423b9**:
https://github.com/WhiteWingCat/wordbook/actions/runs/43562295504

All three jobs passed again:
- Chromium browser regression: 17 tests passed.
- PostgreSQL 17 migration and allowance tests: passed.
- Supabase CLI local Auth compatibility and security-advisor checks: passed.

The mock-adapter unit test step also passed with the Free/Premium plan fixtures. The browser and database suites continued to pass after those changes.

### Owner preview handoff

Use the existing feature preview only after confirming Cloudflare Pages has rebuilt the latest feature branch:
- Test User A — Free: exactly one Discovery card, no locked placeholders.
- Test User B — Premium: exactly three Discovery cards.
- Compare the UTC-day words between both accounts; the Free card must match Premium's first card, and two Premium accounts must match all three.
- Complete Discovery entries and check the remaining allowance: Free 0 after one; Premium 2 after one and 0 after three. Abandoning must not consume a completion.
- Switch translation while the reader is open and confirm the definition and usage note update without changing the English learning context.
- Refresh/reopen on the same UTC date and confirm the three scheduled words remain unchanged.

No owner preview test has yet been recorded. PR #5 remains open/unmerged; no production database migration, production data operation or deployment was performed. Do not merge or deploy without explicit owner approval.
