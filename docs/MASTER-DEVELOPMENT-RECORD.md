# SwiftDictionary — Master Development Record

> Durable project handover and source-of-truth summary for future development conversations.
>
> **Repository:** https://github.com/WhiteWingCat/wordbook  
> **Last consolidated:** 2026-11-14  
> **Current baseline:** Update 2.3.3 merged to main and GitHub Pages deployment succeeded on 2026-11-14 (merge commit `90dc73a9b65fc3af713fefab4955057026089b96`); six 2.3.0 Supabase migrations are applied to production  
> **Current work:** Owner live-testing Update 2.3.3 Daily Learning and Dashboard Favorite Words details; production Daily Learning schema is installed. Next roadmap feature remains Update 2.4.0 Quiz  
> **Record status:** Updated after the six approved production migrations were applied and verified, PR #7 merged, and main GitHub Pages deployment succeeded. No production user-content bulk operation was performed.

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
10. **Development-session records are mandatory.** For every meaningful SwiftDictionary conversation or development session, update the Master Development Record and create a dated, structured Markdown archive in `docs/conversation-archive/`. Record owner decisions, scope, implementation/files, branch/commit/PR references, test evidence (including failures and corrections), outstanding risks and the exact recovery point. Update the archive index. Archive only SwiftDictionary-relevant user-visible material; never include hidden reasoning, credentials, secrets or unrelated personal information. Treat GitHub repository content as potentially public. Keep the documentation branch for durable project records; keep application implementation on feature branches and production code on `main`.

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

### Future roadmap

- **Update 2.4.0 — Quiz:** dedicated Quiz experience, progress tracking and allowance integration.
- **Update 2.5.0 — Flashcards:** Flashcard learning experience, review progress and allowance integration.

These are roadmap targets, not implemented or released features. Preserve Coming Soon behaviour until each feature is ready.

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

## 9. Record maintenance protocol

Update this file at meaningful milestones:
- When a feature's design is confirmed.
- When implementation is completed and tested.
- When a PR is opened, retargeted, merged or closed.
- When migrations are applied to a specific environment.
- When a release is approved and deployed.
- When a bug is found, fixed and regression-tested.

Every update must distinguish:
- Planned
- Implemented on a branch
- Automated tests passed
- Manual browser tests passed
- Production database migrated
- Merged
- Deployed

Do not collapse these into a single “completed” status. Keep dates, commit hashes, PR numbers and test-run links where available. Never include secrets, service-role keys, private account identifiers or personal allowlist values.


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


## 14. Documentation continuity system — established 2026-11-13

**Authoritative documentation branch:** `docs/master-development-record`.

- The Master Development Record is the current concise handover and roadmap authority.
- Each meaningful SwiftDictionary development conversation/session is archived as a dated Markdown file under `docs/conversation-archive/`.
- `docs/conversation-archive/README.md` is the chronological archive index.
- Archives preserve the purpose, exact owner decisions, implementation/files, branches/commits/PRs, tests (including failures and fixes), legal/privacy considerations, outstanding work and recovery instructions.
- Archives are structured summaries of relevant user-visible project discussion, not unfiltered transcripts. Never store hidden reasoning, credentials, secrets or unrelated personal information. Assume repository contents may be public.
- Keep this branch documentation-only. Implement application changes on feature branches; `main` remains the production-code branch. Do not duplicate application implementation onto the documentation branch.
- At the end of each meaningful session, update both this record and the relevant dated archive/index entry. Record interruptions and the precise next recovery step.
- A future conversation should read this record and relevant archive(s), then independently verify live GitHub branch/PR/CI and deployment state before acting.

### Current handover — Update 2.3.1 mock testing (2026-11-13)

- **Feature branch:** `feature/update-2-3-1-bug-fix-and-changes`.
- **Pull request:** [#5](https://github.com/WhiteWingCat/wordbook/pull/5), base `main`, head feature branch, open and unmerged at the latest recorded check.
- **Latest recorded feature commit:** `c55d05fe196811903f2c358f090eebed6893b3ff`.
- **Owner-approved direction:** Option B — isolated browser-only mock testing with fictional Test User A and Test User B, explicitly entered only on the dedicated Cloudflare Pages preview.
- **Implementation:** `mock-testing.js`, loaded by `index.html`; mock-specific tests under `tests/update-2-3-1/`; browser smoke coverage under `tests/browser/`; CI updates in the existing workflow.
- **Isolation design:** namespaced session storage per fictional identity; mock adapter intercepts app Supabase client creation only when the preview-host guard and `?swiftMock=1` are both satisfied; Google OAuth is unavailable in mock mode; scoped reset/exit; visible mock-mode indicator; production/unknown hosts fail closed.
- **CI evidence:** workflow run [#456](https://github.com/WhiteWingCat/wordbook/actions/runs/43413625418) passed mock adapter syntax/unit tests, PostgreSQL 17 migration/allowance checks, Chromium browser regression and disposable local Supabase Auth compatibility checks.
- **Not yet verified:** actual Cloudflare preview-host manual test. Expected preview host is `feature-update-2-3-1-bug-fix-and-changes.swiftdictionary-testing.pages.dev`; append `/?swiftMock=1` to the actual preview URL. If the hostname differs, the exact-host guard will fail closed and must be reviewed before testing. Do not use a real account as a workaround.
- **Backend limitation:** the Cloudflare preview frontend still points to the production Supabase project. Do not run real-account or data-changing tests from preview until backend isolation is independently confirmed. Mock mode does not validate real OAuth/JWT/RLS/database functions/triggers or cross-device sync.
- **Production safety:** no production Supabase schema/data/settings/credentials were changed; no PR merge or production deployment was performed. Do not merge PR #5, apply migrations or deploy without explicit owner approval.
- **Next technical step:** verify the actual Cloudflare Pages preview hostname, then manually confirm the mock indicator, A/B identity isolation, scoped reset and exit, and absence of Supabase Auth/database/network calls while mock mode is active. Before claiming full app coverage, inspect every direct Supabase table/RPC/auth call and compare its query shape with the mock adapter.
- **Conversation archive:** see [2026-11-13 Update 2.3.1 mock testing and documentation continuity](conversation-archive/2026-11-13-update-2-3-1-mock-testing.md).



### 2026-11-13 preview-host correction

- The owner supplied the actual Cloudflare Pages preview URL: `https://feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev/#dictionary`.
- Investigation confirmed the mock adapter had allowlisted the wrong hostname: `feature-update-2-3-1-bug-fix-and-changes.swiftdictionary-testing.pages.dev`.
- Corrected `mock-testing.js` on the Update 2.3.1 feature branch to allow only the actual owner-supplied preview hostname `feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev`, still requiring the explicit `?swiftMock=1` parameter.
- Updated `tests/update-2-3-1/mock-testing.test.mjs` to activate on the corrected host and explicitly reject the former incorrect hostname as an unknown host. Production/root Pages/other-host fail-closed tests remain.
- Commits: adapter correction `ca30d3394dcde2057d11b698f2e66bb15b1e55b4`; regression-test correction `54c11c221fb3199a655d849444182077e4b53e95`.
- CI status for these new commits has not yet been confirmed. The earlier passing run #456 predates this hostname correction and is not evidence for these changes.
- Next step: wait for/check the latest branch CI, then the owner can open `https://feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev/?swiftMock=1` (or add `&swiftMock=1` if the URL already contains another query parameter). Confirm the mock warning panel appears. Do not sign in with a real account or use the preview for real data changes.
- The Cloudflare preview still shares the production Supabase project configuration. While mock mode is active, verify no Supabase requests are made; do not run real-account/data-changing tests until backend isolation is confirmed.


## 15. Update 2.3.1 — owner feedback and dashboard / Daily Learning refinements (2026-11-14)

### Owner-approved requirements from the latest live preview review

1. Active learning course recency must use relative elapsed time (for example, “Last active 3 days ago”) rather than a full date/time string.
2. Dashboard Activity overview must become a visual summary rather than a text-only list of counts.
3. When a daily activity allowance is exhausted, do not reveal the next activity's content preview during the cooldown period.
4. Daily Discovery is a globally shared daily subject: every user sees the same word on the same global day. Daily Topic, Daily Application and Daily Revision remain account-personalised.
5. Daily Discovery should focus on dictionary-style recognition of less-common English vocabulary. The previous mixed grammar/facts discovery collection is retained in source as a future backlog candidate, not used by the new selector.
6. Daily activity readers should open in a left-side slide-in panel following the Dictionary detail-panel interaction pattern.
7. Add more examples across relevant daily activity readers.

### Implementation now on the feature branch

- **Feature branch:** `feature/update-2-3-1-bug-fix-and-changes`.
- **PR:** [#5](https://github.com/WhiteWingCat/wordbook/pull/5), still intended to target `main`; no merge or production deployment authorised.
- **Latest recorded feature commit:** `c2f7ab612e1d3f773eb5322296b77240e8a36e24`.
- **Files changed:** `index.html` and `daily-learning.js`.
- Dashboard course recency now displays relative elapsed time in minutes, hours, days, weeks or months.
- Activity overview now displays a bar for each tracked activity category, with accessible text labels and completion counts. Bars are scaled against the largest category in the current account history; they are comparative counts, not a percentage-of-goal measure.
- Daily activity cards replace the next-content preview with a cooldown message when the next slot is blocked by an exhausted allowance. The already-completed content remains reviewable according to the existing free-replay rule.
- Daily Discovery now selects a deterministic vocabulary entry by UTC calendar date, so users see the same word regardless of account, preference or allowance timezone. The daily session remains per-user and existing per-user allowance enforcement is retained.
- The new shared-word pilot currently uses a curated set of 12 less-common words with original explanations/examples, translation text, part of speech and pronunciation. The UI explicitly says the frequency classification is curated, not a live conversational-corpus ranking. **Statistical spoken-frequency ranking is not yet implemented** and must not be claimed as complete.
- The prior mixed Daily Discovery array remains unused by the current selector and should be considered backlog material for possible future reuse in another activity.
- Daily activity readers now use a modal backdrop and left slide-in panel with back, close and backdrop-dismiss controls. The reader includes dictionary-style definition/part-of-speech/pronunciation presentation for Daily Discovery.
- Existing examples are expanded into individual examples where available; practice question blanks are also shown as completed example sentences. More authored examples can be added during content QA.
- Existing allowance semantics, adaptive revision, account preferences, aggregate-only practice summaries and daily local-time reset rules are intended to remain unchanged.

### Validation evidence and current limitation

- JavaScript syntax validation passed for `daily-learning.js` and the inline application script in `index.html` after the final JavaScript changes.
- Static assertions passed for relative timestamps, activity bars, UTC-shared discovery selection, cooldown preview suppression, drawer open/close controls, additional examples and dictionary-style discovery definition.
- An early syntax check caught an unescaped apostrophe in the cooldown message. It was corrected and syntax validation passed afterward.
- Latest GitHub Actions run observed: [run #486](https://github.com/WhiteWingCat/wordbook/actions/runs/43549929803), triggered from the latest feature commit and still queued at the time of this record update. It contains Chromium browser regression, PostgreSQL 17 migration/allowance and disposable local Supabase Auth compatibility jobs. Do not claim CI passed until all three finish successfully.
- Owner has not yet tested these new changes. Do not mark Update 2.3.1 complete until owner preview testing and CI both pass.

### Frequency-data research and legal/content notes

- A candidate source for a future statistical spoken-frequency ranking is the OANC-derived spoken frequency list published by Lingevo. Lingevo states that its spoken list is counted from about 3.1 million words of Switchboard and Charlotte telephone/face-to-face conversation transcripts, and offers the derived lists for unrestricted use including commercial use, with credit to Lingevo and the Open American National Corpus.
- Source references: [Lingevo English word lists and licensing](https://lingevo.com/resources/), [Open American National Corpus](https://anc.org/data/oanc/), [OANC spoken corpus composition](https://anc.org/OANC/index.html).
- The OANC spoken data is a limited American-English conversation sample, not a universal measure of all spoken English. Any future label should explain the corpus and avoid implying a globally representative ranking.
- The current 12-word pilot is curated, not derived from those frequency counts. Before claiming statistical selection, obtain the frequency file, validate its fields and counts, select a defensible frequency band, document attribution and add source notices. Do not redistribute any data until its actual terms and attribution are checked.
- No new personal-data category or table was introduced for global discovery. The shared word is selected client-side by UTC date; each user's session, completion and allowance remain private and account-scoped.
- Malaysia PDPA and global privacy review remains required for the wider project, but this change does not add new learner profiling or raw-answer collection. Preserve RLS, aggregate-only practice data and the existing account isolation. This is planning, not legal advice or a compliance certification.

### Exact recovery point

1. Continue from `feature/update-2-3-1-bug-fix-and-changes`; do not recreate it.
2. Latest application commit recorded here: `562f9ad6c594083ddef064d3764d791681341170`.
3. Check the latest run #486 and inspect any failed job logs before proceeding.
4. Verify Cloudflare has rebuilt the preview for the latest branch commit. The owner-confirmed preview host remains `feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev`; use `?swiftMock=1` and fictional Test User A/B only.
5. Test relative active timestamps, activity overview bars, free and Premium cooldown states, same global Daily Discovery word across mock identities, personalised Topic/Application/Revision, drawer open/close/backdrop behavior, translation, examples, completion, replay and abandon.
6. The statistical frequency ranking remains an explicit content-quality follow-up; do not describe the curated pilot as corpus-ranked.
7. Wait for the owner's testing feedback before further application changes. Do not merge PR #5, apply production migrations, change production data/settings or deploy without explicit approval.


### Follow-up validation and server-catalogue correction — 2026-11-14

- A first CI attempt failed because `tests/update-2-3-0/check-frontend.mjs` still expected the old `dailyDiscoveries` array. The test was updated to validate `dailyDiscoveryVocabulary` and its dictionary metadata.
- Further review found that dynamically generated global discovery IDs would be rejected by the server-side approved content catalogue. Corrected this before owner testing:
  - Each of the 12 vocabulary entries now has a stable approved base ID.
  - Session IDs use `approved-word-id:YYYY-MM-DD`, with the date based on the shared UTC day.
  - The private validator accepts only a valid date suffix whose base ID is active in the private catalogue, with null topic and difficulty.
  - The content-catalogue migration draft replaces the old 27 discovery rows with 12 approved vocabulary IDs.
  - Catalogue checker expectations now total 80 entries (28 Topic + 25 Application + 12 Discovery + 15 permanent lessons).
  - SQL assertions test valid date-scoped IDs, unknown IDs, malformed dates and forged topic metadata. The allowance test fixture was updated to use a date-scoped ID.
- Latest PR #5 head confirmed: `c2f7ab612e1d3f773eb5322296b77240e8a36e24`.
- Latest CI run [#499](https://github.com/WhiteWingCat/wordbook/actions/runs/43550190284) completed successfully: Chromium browser regression, PostgreSQL 17 migration/allowance tests and disposable local Supabase Auth compatibility all passed.
- The earlier run #495 failure was confined to the stale frontend checker expectation; run #499 includes the corrected checker, catalogue migration, date-scoped validator and updated allowance assertion.
- Static JavaScript syntax and catalogue matching checks also passed.
- This CI evidence does not replace owner preview testing. Cloudflare preview deployment for the latest commit has not been independently confirmed in this record.
- The current Daily Discovery set is still a curated pilot, not statistically ranked by spoken-corpus frequency. This remains a known content-quality limitation.


## 16. Update 2.3.1 — second owner preview review and refinement pass (2026-11-14)

### Owner's latest feedback and scope

The owner reviewed the prior Update 2.3.1 preview and requested:

1. Fix permanent-lesson translation refresh when changing translation language.
2. Improve Simplified Chinese translation coverage throughout Daily Learning while preserving English learning context (grammar prompts, example sentences and answer choices).
3. Remove the dark translucent backdrop behind the left-side activity panel and add sufficient inset spacing around the panel content.
4. Present Daily Discovery in dictionary-style detail layout, without previous/next navigation.
5. Make Daily Topic, Daily Application and Daily Revision more clearly personalised by account; switching mock identities must show distinct content, and resetting mock data must rotate the selections. Daily Discovery remains globally shared for the same UTC day.
6. Combine all relevant examples into one Examples box; remove the separate “More examples” treatment.
7. Open permanent lessons on a dedicated page instead of expanding the lesson reader inside the lesson library.

**Dashboard scope freeze:** the owner explicitly confirmed that the Dashboard is in a good place and requested no further Dashboard changes for now. No Dashboard layout, statistics or visualisation changes were made in this pass.

### Implementation on the existing feature branch

- **Branch:** `feature/update-2-3-1-bug-fix-and-changes`.
- **PR:** [#5](https://github.com/WhiteWingCat/wordbook/pull/5), still open and unmerged; base remains `main`.
- **Latest application commit:** `d1af4357fdbca0b86765ebba22750457eb9b62a5`.
- **Files changed in this pass:** `index.html`, `daily-learning.js`, `mock-testing.js`, `tests/browser/update-2-3-0-smoke.spec.js`, `tests/update-2-3-0/check-frontend.mjs`, and `tests/update-2-3-1/mock-testing.test.mjs`.

#### Translation and Daily Learning

- Added a shared translation-view refresh path. Changing the top translation selector now refreshes the open dictionary entry, permanent lesson, Daily Learning cards and an open Daily Activity reader. Saving Profile preferences uses the same refresh path.
- Fixed an activity-reader state-reference error found during browser regression testing so checked answers and their English/Chinese explanations remain visible after switching languages.
- Added Chinese translations for all 28 Daily Topic titles and all 25 Daily Application titles, plus Daily Learning headings, preference labels, card metadata, status messages, reader controls and Daily Discovery usage notes.
- English sentence prompts, answer options, grammar terms and examples remain in English as learning context. Chinese explanations are shown alongside the relevant material or after answer checking.
- Daily Discovery retains its English headword and examples, while showing the Chinese definition and Chinese usage note when Simplified Chinese is selected.
- Daily Discovery start RPC arguments now explicitly send null topic and difficulty metadata, matching the approved server catalogue's global-word contract.

#### Activity reader and examples

- The activity backdrop is transparent; the left-side panel itself remains interactive and dismissible.
- Added internal panel padding and separate inset spacing for the dictionary-style Daily Discovery content.
- Daily Discovery now uses dictionary-style headword, pronunciation, part-of-speech, definition, examples and usage-note sections, without previous/next controls.
- Relevant examples are combined into one Examples box. The separate “More examples” treatment has been removed.

#### Personalised activity selection and mock reset

- Daily Topic, Daily Application and Daily Revision now include a stable account-derived selection offset, while Daily Discovery is selected solely by the global UTC date and remains identical across accounts on that date.
- Adaptive revision still prioritises the best-ranked weakness group; account-derived selection chooses within equally ranked candidates, including unseen topics for new accounts.
- Mock mode exposes a session-storage selection-generation counter. Resetting mock data increments the generation while preserving unrelated session-storage keys, then clears the mock user stores. The new generation rotates the personalised Topic/Application/Revision selection after reload.
- The selection-generation counter is test-only and stays in the exact-host, explicit-opt-in mock environment. It is not a new production preference, table or account-data field.

#### Permanent lesson navigation

- Moved the permanent lesson reader to a separate `lessonDetailPage` page panel.
- Opening a lesson now navigates away from the lesson library; the dedicated back control returns to Lessons. Browser hash handling recognises the lesson-detail route and safely falls back to Lessons when no active lesson is loaded.
- Translation changes rerender the active lesson from its source record while preserving practice state.

### Validation and CI evidence

- Latest GitHub Actions run: [run #549](https://github.com/WhiteWingCat/wordbook/actions/runs/43553866219).
- **All three CI jobs passed**:
  - Chromium browser regression: 15 tests passed, including bilingual Daily Learning refresh, dictionary-style Discovery, transparent panel inset, and dedicated permanent lesson page.
  - PostgreSQL 17 migration and allowance tests passed, including frontend/RPC integration checks and mock-adapter unit tests.
  - Disposable local Supabase Auth compatibility and security-advisor checks passed.
- Earlier CI attempts exposed test/implementation issues which were corrected before run #549:
  - Mock reset tests now verify unrelated session-storage values remain intact while the generation counter advances.
  - Existing browser assertions were updated for Chinese UI text when the fixture preference is Simplified Chinese.
  - The translation-refresh feedback renderer now references the preserved reader state correctly.
  - Discovery padding assertions inspect the inner dictionary content panel, where the padding is applied.
  - The frontend timezone-helper test boundary was updated after adding the bilingual UI helpers.
- Static checks also confirmed all 28 Topic and 25 Application title translations exist, all 12 Discovery words have Chinese usage notes, mock A/B selection offsets differ for Topic/Application/Revision, and reset changes all three offsets.
- No production database migration, production data mutation, PR merge or production deployment was performed.

### Legal, privacy and data-safety review

- This pass adds no new production personal-data field, table, raw-answer collection or learner-profiling category.
- The account-derived offset is calculated client-side from the signed-in account identifier and is not persisted or sent as a new field. Keep it out of logs and analytics.
- The mock selection-generation counter is stored only in session storage within the explicitly enabled mock preview.
- Existing account isolation, RLS, aggregate-only practice results, allowance rules and global UTC Daily Discovery selection remain intact.
- The work is a UI/selection bug-fix pass, not a legal-compliance certification. Malaysia PDPA and global privacy/age obligations remain project-wide review requirements.

### Exact recovery and next testing point

1. Continue from `feature/update-2-3-1-bug-fix-and-changes`; do not recreate the branch.
2. Latest PR #5 head: `d1af4357fdbca0b86765ebba22750457eb9b62a5`.
3. CI run #549 passed all three jobs. The browser suite passed 15 tests.
4. The owner-confirmed Cloudflare preview host remains `feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev`. The latest Cloudflare deployment itself has not been independently confirmed; allow it to rebuild before owner testing.
5. Use `?swiftMock=1` and fictional Test User A/B only. The preview frontend still references the production Supabase configuration outside the mock adapter; do not use real accounts or real data-changing tests.
6. Owner retest priorities: switch translation while a permanent lesson is open; switch translation while a Daily Activity is open and after checking answers; verify English learning context remains English; inspect activity panel backdrop/insets; verify Discovery layout; compare A/B Topic/Application/Revision and shared Discovery; reset mock data and verify the personalised selections rotate; open/back from a permanent lesson page.
7. Dashboard is frozen unless the owner raises a new issue. Statistical spoken-frequency ranking for Daily Discovery remains future work; the current 12-word set is curated, not corpus-ranked.
8. Wait for owner testing feedback before any further app changes. Do not merge PR #5 or deploy without explicit approval.


## 17. Update 2.3.1 — final daily activity polish and rollover handling (2026-11-14)

### Owner feedback

The owner requested six final refinements before considering Update 2.3.1 ready for main: remove the activity reader outline; translate the Daily Learning reset/plan/context status when the translation language changes; remove duplicate cooldown text; improve definition contrast to white in Daily Discovery and lessons; ensure unfinished activities reset after the daily boundary; and close the reader after successful completion. The Dashboard remains explicitly out of scope.

### Implementation

All application work stayed on feature/update-2-3-1-bug-fix-and-changes, PR #5, targeting main.

- Removed the activity reader border while retaining its transparent backdrop, spacing, rounded outer corners and shadow.
- Added a shared renderDailyStatus() path. The reset timezone, plan, English-context note, deferred timezone-change notice and English-course guidance now refresh in the selected translation language whenever the global translation selector changes.
- Retained the cooldown preview and removed the second repeated allowance-exhaustion message.
- Set lesson definition text and Daily Discovery definition text to the primary foreground colour (var(--text)).
- After the server confirms complete_daily_activity_session, the reader closes immediately. The activity list and remaining allowance then refresh. Completion confirmation and refresh-error messages use the selected translation language.
- On Daily Learning load, each in-progress session's started_at timestamp is compared with the current allowance-day interval in the user's effective allowance timezone. Sessions outside that interval, including malformed timestamps, are marked abandoned through the existing abandon_daily_activity_session RPC before cards render. Only sessions started within the current allowance day remain resumable. Abandonment does not count as completion or consume allowance.

### Daily reset and allowance clarification

The reset is based on the configured allowance timezone, not on whether the learner completed the activity. At the next local midnight, a completed activity remains recorded as completed for its original day, while an unfinished session is marked abandoned on the next Daily Learning load. The user can then start the new day's activity without resuming yesterday's session. Only successful completion consumes the daily allowance.

This is a lazy rollover cleanup, not a background job at the exact stroke of midnight. If the user does not open Daily Learning, the old database row may remain in_progress until the next load; that load performs cleanup before rendering resumable sessions.

### Tests and validation

Latest application commit: 99dc69446ca56459c344915711ed2169c909b0c4.

Browser regression coverage now checks:
- Daily Learning status switching Chinese → English → Chinese while a reader is open.
- Reader border removal and primary-foreground definition colour.
- Reader closure after successful completion.
- Automatic abandonment of a previous-day unfinished session, followed by creation of a fresh session.

Latest GitHub Actions run: [run #557](https://github.com/WhiteWingCat/wordbook/actions/runs/43556612276).

- Chromium browser regression: 16 tests passed.
- PostgreSQL 17 migration and allowance tests passed.
- Disposable local Supabase Auth compatibility and security-advisor checks passed.
- All three CI jobs passed on commit 99dc69446ca56459c344915711ed2169c909b0c4.

An earlier browser attempt failed only because an existing test expected an English completion confirmation while the fixture selected Simplified Chinese. The implementation correctly returned the Chinese confirmation; the assertion was corrected and the subsequent full CI run passed.

### Legal, privacy and data-safety review

- No new personal-data fields, tables, raw-answer collection, tracking or learner-profile categories were added; no database migration was introduced.
- Rollover cleanup changes only the status of the signed-in user's existing expired activity session through the existing account-scoped server RPC and access controls.
- No additional learner data is collected, exposed or logged.
- This is not a legal-compliance certification. Malaysia PDPA and applicable global privacy/age obligations remain project-wide review requirements.

### Current branch and recovery point

1. Feature branch: feature/update-2-3-1-bug-fix-and-changes.
2. PR #5: https://github.com/WhiteWingCat/wordbook/pull/5 — open, targets main, not merged.
3. Latest feature head: 99dc69446ca56459c344915711ed2169c909b0c4.
4. CI run #557 passed all three jobs; browser suite passed 16 tests.
5. No production database migration, production data operation, PR merge or production deployment was performed.
6. The owner-confirmed Cloudflare preview host remains feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev. Confirm Cloudflare rebuilt the latest commit before testing. Use the explicit mock opt-in and fictional Test User A/B only; do not use real accounts or real data-changing tests.
7. Owner retest priorities: inspect the reader edge; switch translation while the Daily Learning status is visible; verify only one cooldown explanation; inspect definition contrast in Discovery and permanent lessons; leave an activity unfinished across local midnight and verify it is abandoned before a fresh session starts; complete an activity and confirm the reader closes.
8. Dashboard remains frozen unless the owner raises a new issue. Do not merge PR #5 or deploy without explicit owner approval.


## 18. Update 2.3.1 — Daily Discovery visibility and global rotation plan (2026-11-14)

### Owner decision

The owner explicitly selected **Option A** for Free-plan Daily Discovery visibility:

- The global schedule contains three distinct Daily Discovery entries per UTC day.
- Free users see and can complete only the first entry in that day's schedule.
- Premium users see and can complete all three entries.
- Do not show the second and third entries as locked cards or previews to Free users. They are not displayed in the Free experience.
- Existing completion allowances remain unchanged: Free = 1 completion/day; Premium = 3 completions/day.

### Global schedule and account isolation

- Daily Discovery remains globally shared: every user receives the same scheduled entries for a given UTC date, subject to plan visibility.
- The global schedule advances by UTC date, never according to any user's completion, account, timezone, or activity.
- A user's completion state and allowance remain account-scoped. One learner completing, abandoning, or skipping an entry must not change another learner's schedule or availability.
- Keep the existing allowance-day timezone behavior for per-user quota resets. Do not conflate the user's local allowance reset with the UTC global content assignment.
- Use stable approved content IDs and date-scoped session IDs. The server-side private catalogue validator must approve every scheduled entry.

### Backlog and rotation

- Expand the curated Daily Discovery vocabulary backlog from the current 12 entries to a target of at least 90 reviewed entries before enabling the full three-entry schedule.
- At three entries per UTC day, 90 entries provide a 30-day initial rotation without reusing an entry.
- Assign three distinct entries to each UTC date. Avoid repeats within a daily set and do not immediately repeat the previous rotation's final entries at the start of the next cycle.
- Rotation must be deterministic and versioned so that users opening the activity on different devices receive the same daily set.
- Adding or editing backlog content must not silently change assignments already published for a date. Any schedule revision must be explicit and versioned.
- If the approved backlog is temporarily insufficient, do not silently repeat or generate unapproved content. Keep the schedule within the available approved entries and surface an operational/content-readiness issue for review.
- The 90-entry target is a planning threshold, not a claim that the current 12-entry pilot already supports 30 days.

### Implementation sequence

1. Audit the current client-side UTC selector, daily Discovery rendering, stable IDs, allowance display, and server-side catalogue validation.
2. Prepare and editorially review the expanded vocabulary backlog, including accurate definitions, pronunciation, Chinese translations, examples, usage notes, and source/licensing review where external corpus data is used.
3. Implement a deterministic, UTC-date-based three-entry schedule with a versioned rotation and no per-user influence.
4. Update plan-aware rendering: Free receives only schedule position 1; Premium receives positions 1–3. Do not render locked placeholders for positions 2–3 to Free users.
5. Update the private approved-content catalogue and server validation so every scheduled stable ID is approved. Preserve null topic/difficulty metadata for Discovery and existing account-scoped completion RPCs.
6. Add automated tests for global schedule consistency across accounts, UTC date rollover, rotation uniqueness and boundary behavior, Free visibility of exactly one item, Premium visibility of exactly three items, per-user completion isolation, and allowance enforcement.
7. Run the existing browser, PostgreSQL and disposable local Supabase validation suites. Retest only with the explicit mock preview and fictional Test User A/B.
8. Update the Master Development Record and conversation archive with the final implementation, validation evidence, and any remaining content limitations.

### Non-regression and release boundaries

- Do not change Daily Topic, Daily Application, Daily Revision, the Dashboard, or the existing lesson experience as part of this work unless a directly related regression requires it and the owner approves the scope.
- Preserve aggregate-only practice outcomes, existing RLS/account isolation, and the privacy-first catalogue design. Do not introduce answer-level telemetry or a global user completion table.
- Do not claim statistically ranked spoken-frequency selection unless the corpus data, methodology, reuse terms and attribution have been verified. Curated content must continue to be labelled as curated.
- Perform the standing Malaysia and general legal/privacy review for any new data source, corpus reuse, or feature expansion. This planning decision does not constitute legal compliance certification.
- Continue on feature/update-2-3-1-bug-fix-and-changes and PR #5. The plan update does not authorize merging, production database changes, production data operations, or production deployment.


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
2. Latest application/code commit: 6bc0791116ca0a96410a84a3e3fe6953943b2ae3. Latest feature branch head after the handover-record update: e1039bed85ed6f65514699f30cda8a06d2df0214.
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

## 22. Update 2.3.1 — activity content quality, allowance enforcement and completed reviews (2026-11-14)

### Owner feedback and scope

The owner reported four issues during mock-preview testing:
1. Daily Application and Daily Revision reused the same examples and Q&A.
2. Users could still open new lessons after exhausting their daily allowance on either Free or Premium.
3. Completed content should remain available for review after the allowance is used.
4. Some strings displayed as examples were actually questions.

These corrections preserve the previously approved allowance values:
- Free: 5 permanent lesson completions per local day; 1 completion per day for each Daily Topic, Daily Application, Daily Discovery and Daily Revision category.
- Premium: 15 permanent lesson completions per local day; 3 completions per day for each daily category.
- Only successful completion consumes allowance. Reviewing completed content does not consume another completion. Existing in-progress sessions retain the existing free-resume behavior; their eventual completion remains subject to the server-side allowance.

### Implementation on the existing feature branch

**Content quality**
- Added two explicit, authored example sentences for each of the 25 Daily Application items.
- Added independent, topic-specific Daily Revision materials for all 13 revision topics, with separate examples and Q&A. Revision no longer borrows the Application question set.
- Updated `makeRevisionContent` to use the dedicated Revision material.
- Removed the renderer's conversion of practice prompts into examples. Only explicitly supplied example strings are rendered in the Examples section.
- Added checks for question-style examples, exact reuse between Application and Revision, and invalid question structures.

**Allowance enforcement**
- Daily activity start buttons are disabled when the current plan's category allowance is exhausted. Existing plan-specific visibility remains unchanged: Free sees only Discovery slot one; Premium sees slots one through three.
- Permanent Lessons now reads current usage from the server-side `get_my_learning_allowance_usage` RPC, disables unstarted lessons at zero remaining, and rechecks the allowance before creating a new progress row.
- Completed lesson progress remains accessible for free review. Existing in-progress lessons remain resumable under the established policy.
- The mock adapter now rejects new daily activity sessions after the plan allowance is exhausted, matching the server behavior.

**Completed-content review**
- Daily Topic, Daily Application and Daily Revision show completed items from the current local allowance day as review cards.
- Daily Discovery preserves completed review cards across a UTC schedule change that occurs before the user's local allowance day ends. These review cards do not count as additional scheduled entries or consume another allowance.
- `start_daily_activity_session` checks for an exact completed session before applying the current approved-content schedule/plan validator. A previously completed item can therefore be reopened after allowance exhaustion, UTC schedule rollover or a plan change. New sessions still pass the private approved-catalogue and plan-slot validator.
- The private catalogue, RLS boundaries, account-scoped completion state and aggregate-only practice-result design are unchanged.

### Validation

GitHub Actions run **#705** passed against code/test commit **8fb19e183f524277fc9b5c133e8860d79a4a975b**:
https://github.com/WhiteWingCat/wordbook/actions/runs/43565545461

All three jobs passed:
- **Chromium browser regression:** 21 tests passed. New coverage includes Free and Premium lesson limits, free completed-lesson review, distinct Application/Revision examples and Q&A, completed Daily Topic review after exhaustion, and Discovery review across UTC rollover. Existing translation, Daily Learning, Dashboard, sign-in and account-switching regressions also passed.
- **PostgreSQL 17 migration and allowance tests:** passed, including a new assertion that reopening an exact completed Daily Topic session after the Free allowance is exhausted returns the saved completed session without increasing usage. Existing catalogue, direct-RPC, ledger, concurrency and history-deletion assertions passed.
- **Supabase CLI local Auth compatibility:** passed against disposable local services, including Auth schema/roles/JWT helpers and security-advisor checks.

Intermediate test failures were corrected before run #705. They included question-form and duplicated examples, locale-specific test expectations, and a rollover fixture using a display word instead of the approved stable Discovery ID. An earlier Supabase CLI setup attempt hit a GitHub release API rate limit; the complete final run #705 succeeded.

### Legal, privacy and release boundaries

- New examples and Revision questions were authored for SwiftDictionary. No third-party dictionary corpus, question bank or external frequency dataset was imported.
- No new personal-data fields, tracking, answer-level telemetry or global learner-completion records were added.
- Completed and reviewable progress remains account-scoped; the content catalogue remains private and RLS-protected.
- The standing Malaysia PDPA and general privacy planning remains applicable. No new data-source or personal-data processing category was introduced. If Premium is commercialised later, subscription pricing, renewal, cancellation/refund and consumer disclosures still require separate review. This is not a legal-compliance certification.
- Dashboard remains frozen. The SQL migration is still a draft. No production Supabase migration, production data operation, merge or deployment was performed.

### Current recovery point and next actions

1. Continue on `feature/update-2-3-1-bug-fix-and-changes`; PR #5 remains open and unmerged.
2. Latest code/test commit validated by CI: `8fb19e183f524277fc9b5c133e8860d79a4a975b`. Subsequent commits on the feature branch update only the development record and archive.
3. Confirm Cloudflare Pages has rebuilt the latest feature head before owner retesting. Use only the mock preview with fictional Test User A (Free) and Test User B (Premium):
   `https://feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev/?swiftMock=1`
4. Retest the four reported issues: distinct Application/Revision examples and Q&A; examples are actual examples; new lessons/daily activities are blocked at exhausted Free/Premium limits; completed content remains reviewable without consuming allowance.
5. Specifically verify Discovery review across UTC rollover while the local allowance day remains active, and verify Chinese translation refresh still updates the reader in place.
6. Do not merge PR #5, apply production migrations, or deploy without explicit owner approval.

## 23. Update 2.3.1 — Daily Learning category tabs and plan-sized activity rows (2026-11-14)

### Owner feedback and scope

After reviewing the previous content-quality, allowance and completed-review fixes, the owner requested a final Daily Learning layout refinement:
- Replace the combined list of all daily activities with separate category tabs: Daily Topic, Daily Application, Daily Discovery and Daily Revision.
- Free sees one activity card per tab; Premium sees three cards in a row, following the permanent lesson-library layout.
- Place Start, Resume and Review completed content actions on the right side of each card row.
- When a category allowance is exhausted, place its midnight-reset explanation below that category title, not inside an additional locked lesson card.

No allowance amount, course, content-library or Dashboard scope decision was changed.

### Implementation on the feature branch

**Tabbed category navigation**
- Added four accessible tab buttons and one active tab panel.
- Selected category persists through rerenders caused by completion, preference updates and translation changes.
- Existing daily activity preference controls remain. A paused category retains its tab and shows the paused state within the panel.
- Tab labels update with the selected translation language.

**Plan-sized activity rows**
- Free renders one card per category; Premium renders three.
- Daily Topic and Daily Application use separate curated content per Premium slot.
- Daily Revision preserves the highest-priority adaptive topic in the first slot and uses different candidate topics for additional Premium slots.
- Daily Discovery retains the account-independent global UTC schedule: Free sees slot one and Premium sees up to three.
- Completed items and in-progress sessions remain available as review/resume cards. Once the allowance is exhausted, uncompleted Discovery schedule entries are not shown as locked lessons; completed Discovery items remain reviewable across UTC rollover.
- Premium cards use a three-column desktop grid, with responsive reduction at narrower widths. Free uses a single-column layout.
- Each card uses a horizontal row layout, with Start, Resume or Review completed content action aligned on the right.

**Allowance reset message**
- Removed the exhausted-allowance cooldown message from individual lesson cards.
- The active category panel shows its remaining allowance count and, once exhausted, the midnight-reset explanation directly below the category title.
- The message uses the effective allowance timezone for the account.
- Existing allowance amounts, local-midnight reset behavior, server-side enforcement and free review policy remain unchanged.

**Accessibility and responsive behavior**
- Tabs use tablist/tab/tabpanel semantics, selected-state attributes and focus handling.
- The card rows and actions adapt to mobile widths.
- Permanent lesson navigation and Dashboard remain unchanged.

### Validation

GitHub Actions run **#749** completed successfully against code/test commit **55ad7a12abaa462142a7c6e88b8466d11851040a**:
https://github.com/WhiteWingCat/wordbook/actions/runs/43568453615

All three jobs passed:
- **Chromium browser regression:** 22 tests passed. New coverage verifies all four tabs, Free one-card and Premium three-card rows for every category, right-side row actions, reset-message placement after Daily Topic completion, and Discovery review across UTC rollover. Existing content-quality, lesson/daily allowance, completed-review, translation, Dashboard, sign-in and account-switching tests passed.
- **PostgreSQL 17 migration and allowance tests:** passed. The layout change did not alter the database schema or allowance ledger. Frontend syntax/integration, catalogue validation, direct-RPC checks, completion/review, concurrency and deletion tests passed.
- **Supabase CLI local Auth compatibility:** passed, including local Auth contract and security-advisor checks.

### Legal, privacy and release boundaries

- This is a presentation/navigation change using existing plan limits, activity preferences, completed sessions and approved content. It adds no personal-data fields, tracking, analytics, answer-level telemetry or external content source.
- No new dictionary corpus, question bank or third-party licensed content was introduced.
- Malaysia PDPA and general privacy planning remains unchanged. If Premium is commercialised later, subscription pricing, renewal, cancellation/refund and consumer disclosures still need separate review. This is a planning note, not legal-compliance certification.
- Dashboard scope remains frozen.
- No production Supabase migration, production data operation, merge or deployment was performed.

### Current recovery point and next actions

1. Continue on `feature/update-2-3-1-bug-fix-and-changes`; PR #5 remains open and unmerged.
2. Latest application code/test commit validated by CI: `55ad7a12abaa462142a7c6e88b8466d11851040a`. Subsequent commits on the feature branch update only the Master Development Record, conversation archive and archive index.
3. Confirm Cloudflare Pages has rebuilt the latest feature branch before the final owner retest. Use only the mock preview with fictional Test User A (Free) and Test User B (Premium):
   `https://feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev/?swiftMock=1`
4. Owner retest checklist:
   - Confirm all four tabs appear and switch independently.
   - Confirm Free sees one card and Premium sees three in each category.
   - Confirm Start/Resume/Review actions are at the right side of each row.
   - Exhaust Daily Topic and confirm the reset description appears below the category title, with no locked cooldown card inserted into the lessons.
   - Confirm completed content remains reviewable without consuming another allowance.
   - Confirm Discovery still follows the global UTC schedule and local allowance day.
   - Confirm Chinese/English translation refresh works without navigating away.
5. Do not merge PR #5, apply production migrations or deploy until the owner explicitly approves.
6. The preceding Update 2.3.1 content-quality/allowance work remains in force and is recorded in the prior archive. This layout change does not reverse those fixes.



## 24. Update 2.3.1 — owner feedback: activity rows, allowance indicator and Premium mock allowance (2026-11-14)

### Owner feedback and final acceptance

The owner requested five final refinements to the Daily Learning category tabs:
1. Premium activity cards must each occupy one full-width row; three columns caused text crowding beside the Review completed content action.
2. Numeric allowance must appear only beside the category title, not inside activity cards.
3. The title-side allowance indicator should be clean, centered and color-coded according to remaining allowance.
4. Premium mock account must show the established 15 permanent lesson completions, not the Free limit of 5.
5. Category tabs should be slightly larger with white text.

The corrected preview was deployed for commit `8c4c4949be68f2b372def13ce75c8ec67b67405e`. The owner retested it and confirmed that all requested changes were present, then approved Update 2.3.1 for merge.

### Implementation confirmed in the final feature commit

- Premium continues to receive up to three activity cards per category, but the cards stack vertically in one full-width column. Free remains one card.
- Card actions remain right-aligned. Numeric remaining-allowance text was removed from unstarted activity cards; those cards use a neutral “New activity” label. In-progress and completed/review statuses remain.
- The category allowance count is displayed in a centered compact indicator beside the category title. The indicator uses green, amber and red states according to remaining allowance.
- Category tabs have increased padding/font size/weight and white text.
- Account refresh now reinitializes lesson progress and reloads allowance for the active identity, preventing a stale Free/Premium lesson allowance from remaining visible after account switching.
- Frontend regression assertions cover the layout, allowance presentation and account-refresh behavior. The isolated mock fixture records Free 5 and Premium 15; the earlier Premium completion-enforcement test was present in the preceding validation work.
- No database schema, allowance values or production data were changed by these presentation/account-refresh refinements.

### Correction to the earlier validation record

A source rollback incident was identified after the first attempted fix: a stale Git tree reference had caused older CSS and Daily Learning JavaScript to be restored, despite earlier commit-history inspection and a successful CI run. The earlier report that the five final visual changes were implemented was incorrect, and CI run #763 on commit `d1c9be67` did **not** validate the final five refinements.

The branch was corrected by updating the actual current file versions sequentially. The corrected implementation and regression assertions are in commit **`8c4c4949be68f2b372def13ce75c8ec67b67405e`**. Raw branch-file inspection confirmed the requested source changes before the owner was asked to retest.

### Final validation and merge

Both GitHub Actions runs below completed successfully against commit `8c4c4949be68f2b372def13ce75c8ec67b67405e`, with all three jobs passing in each run (Chromium browser regression, PostgreSQL 17 migration/allowance tests, and disposable local Supabase Auth compatibility):

- Run #771: https://github.com/WhiteWingCat/wordbook/actions/runs/43571579491
- Run #772: https://github.com/WhiteWingCat/wordbook/actions/runs/43571583586

Cloudflare's pull-request deployment status reported a successful preview deployment for commit `8c4c494`. The owner confirmed all five requested changes in the preview.

**PR #5 was merged into `main` on 2026-11-14 at 07:52:23 UTC.**
- PR: https://github.com/WhiteWingCat/wordbook/pull/5
- Feature head: `8c4c4949be68f2b372def13ce75c8ec67b67405e`
- Merge commit and verified `main` HEAD: `3ca194f908356f85aed1c143c647ebf488e9a353`

### Privacy and release boundaries

- The final changes are presentation, account-refresh and mock-test changes; they add no personal-data fields, analytics, tracking or third-party content.
- No production Supabase migration or production data operation was run as part of this merge.
- The merge itself is not proof that the production database has been migrated or that the main-branch site deployment has completed. Verify the main-branch deployment and production schema separately before treating the live production service as fully released.
- Malaysia PDPA and general privacy planning remains applicable to future feature expansion; this update does not constitute a legal-compliance certification.

## 25. Update 2.3.1 — final approval, merge and recovery point (2026-11-14)

### Current project state

- Update 2.3.1 is approved by the owner and merged to `main`.
- PR #5 is closed as merged.
- Verified `main` HEAD: `3ca194f908356f85aed1c143c647ebf488e9a353`.
- The final feature commit is `8c4c4949be68f2b372def13ce75c8ec67b67405e`.
- The feature branch preview was deployed successfully for the final commit and manually accepted by the owner.
- CI runs #771 and #772 passed all three jobs on the final feature commit.
- Do not repeat the earlier incorrect CI #763 claim as validation of the final five layout refinements.

### Next development milestone

The next planned milestone remains **Update 2.4.0 — Quiz**:
- Dedicated Quiz experience.
- Quiz progress tracking.
- Quiz allowance integration using the established completion-based allowance principles.
- Preserve free dictionary search and account isolation.
- Before planning or implementing any new feature, perform the standing Malaysia-specific and general legal/privacy review. Re-check content licensing and data minimisation if the Quiz introduces new question content, answer telemetry or analytics.

Update 2.5.0 — Flashcards remains planned after Quiz. Do not treat either roadmap item as implemented.

### Release safeguards

1. Verify the main-branch hosting deployment independently; merge confirmation alone is not deployment confirmation.
2. Confirm production Supabase migration state read-only before proposing any production migration. No production migration or production data operation was performed in this session.
3. Do not initiate a production migration, destructive operation or additional deployment without explicit owner approval.
4. Continue using isolated mock identities for future browser tests; never use real user accounts or production data in automated tests.


## 26. Update 2.3.2 — Favorite Words course isolation hotfix and Daily Learning database diagnosis (2026-11-14)

### Owner request

The owner reported that most Update 2.3.1 features were available on the live website, but Daily Learning was waiting for a server database update. The owner also observed English and Simplified Chinese saved words appearing in the wrong Favorite Words category on the Dashboard. The owner requested a quick Update 2.3.2 hotfix and explicitly authorised merging it to `main` after validation.

### Production Supabase diagnosis — read-only

The connected SwiftDictionary Supabase project was healthy and running PostgreSQL 17.11.0.003. Its migration history ended at `20261110041007` (`swiftdictionary_update_2_2_0_reconciliation_baseline`). The 2.3.0 server migrations had not been applied.

Read-only schema checks confirmed the following were absent:
- `public.daily_activity_sessions`
- `private.learning_content_catalog`
- `private.learning_allowance_usage`
- RPCs `public.start_daily_activity_session`, `public.complete_daily_activity_session` and `public.get_my_learning_allowance_usage()`

The 2.3.0 server-side fields were also missing: daily activity preference flags and allowance-timezone fields on `user_preferences`, completion event fields on `learning_activity_log`, and the Daily Learning category rows in `learning_plan_limits`. The live limits table still had only `lesson`, `quiz` and `flashcard`.

This is the direct reason the live website reports that Daily Learning is waiting for the matching server database update. It is a production schema/migration gap, not a browser cache problem.

### Pending production migration sequence

The repository currently contains these 2.3.0 SQL drafts under `docs/`; they are not yet timestamped deployment files under `supabase/migrations/`:
1. Saved-words least-privilege hardening (independent, review before applying).
2. Approved learning content catalogue.
3. Completion-based allowance foundation.
4. Daily activity session foundation.
5. Separate current-window allowance ledger.
6. Learning-history deletion implementation.

The dependency order is important: the content catalogue precedes the allowance foundation; Daily Activity follows the allowance foundation; the ledger follows both allowance and Daily Activity; learning-history deletion follows allowance, Daily Activity and ledger. The drafts have passed the repository's disposable PostgreSQL 17 and local Supabase CLI compatibility workflows, but this is not a production migration.

No production migration, production SQL write, or production saved-word bulk update was executed in this session. Before changing production, create proper timestamped migration files, review the exact SQL and historical data backfill, verify backups/rollback strategy and apply in order only after explicit owner approval. Afterward, verify migration history, schema objects, RLS/grants, allowance RPC results and Daily Learning start/complete/resume/review behavior with synthetic test identities.

### Favorite Words root cause and fix

The Dashboard grouped saved words by the database `course` field, but the dictionary's in-memory saved-state set was keyed only by the word text. This allowed identical text values to share saved state across English and Chinese. The live `saved_words` table already had a `course` column, a unique key on `(user_id, course, word)`, and owner-scoped RLS policies. Read-only inspection also found legacy rows whose stored course did not agree with the script/catalogue; no word contents or user IDs were copied into the development record.

The Update 2.3.2 hotfix:
- Keys in-memory favorites by both course and word.
- Persists signed-out local favorites as explicit course/word pairs while accepting legacy string-only local entries.
- On a signed-in user's Dashboard load, identifies clearly classifiable legacy mismatches using Han-script code points and exact dictionary-catalogue membership.
- Repairs only the authenticated user's own rows: insert the correctly classified `(user_id, course, word)` row first, then delete the old course row. If insertion fails, preserve the original. Unknown entries are not guessed or moved.
- Uses the existing authenticated INSERT/DELETE permissions and RLS; it does not require a new schema migration or a privileged cross-user operation.
- Adds browser regression coverage for legacy mixed-course rows and static checks that course and word are both part of saved-state identity.

### Branch, CI and merge

- Branch: `hotfix/update-2-3-2-favorite-words-course-isolation`
- PR #6: https://github.com/WhiteWingCat/wordbook/pull/6
- Final hotfix head: `b50f0cc7b6ec74b065342c1e953d2f6d85d44fcd`
- GitHub Actions run #774 passed all three jobs: 22 Chromium browser regression tests, PostgreSQL 17 migration/allowance tests, and disposable local Supabase Auth compatibility.
- An earlier run #773 exposed two test-harness issues (a strict locator assertion after adding multiple saved rows, and changed mock INSERT timing). Both were corrected; run #774 passed.
- PR #6 merged on 2026-11-14 at 08:10:27 UTC.
- Merge commit and verified `main` HEAD: `60904fb77fec0c3757e8aa1947439440954ae385`.
- Main GitHub Pages deployment workflow #43574533852 was queued immediately after merge. Verify its completion before describing the live site as updated.

### Privacy and legal-risk review

- No new personal-data fields, analytics, tracking, raw answer telemetry or third-party content were added.
- Favorite-word correction processes existing saved-word data within the authenticated user's own RLS scope. It does not collect additional information or inspect other users' word contents in the browser.
- Unknown saved entries are left unchanged rather than inferred. Insert-before-delete avoids losing a saved word if the first write fails.
- Malaysia PDPA and general privacy obligations remain applicable. The correction is a limited data-quality operation on existing user-owned records, not a new purpose or new data collection category. Review the privacy notice if future changes introduce broader profiling or analytics. This is planning guidance, not legal-compliance certification.
- Daily Learning's production migration remains separate and pending explicit owner approval. No production schema or data operation was performed here.

### Recovery point and next actions

1. Confirm GitHub Pages deployment #43574533852 completed successfully for merge commit `60904fb77fec0c3757e8aa1947439440954ae385`.
2. The Favorite Words hotfix is merged. After the new main deployment is live, the owner can refresh the site and open Dashboard; the signed-in account's clearly identifiable legacy saved-word course mismatches will be repaired on that Dashboard load.
3. Prepare the six Update 2.3.0 production migration files in the dependency order above, using proper Supabase-generated timestamps and preserving the tested SQL.
4. Before applying production migrations, present the exact migration list, data backfill effects, security/RLS changes and rollback/backup plan, then obtain explicit owner approval.
5. Verify production migration history and schema after approval; then retest Daily Learning start, resume, completion, review, timezone reset and Free/Premium allowance behavior.
6. Update 2.4.0 Quiz remains planned after the 2.3.0 server database rollout is complete.

## 27. Update 2.3.3 — production Daily Learning database rollout and Dashboard Favorite Words details (2026-11-14)

### Owner request and release scope

The owner authorised preparing and applying the reviewed 2.3.0 database migrations to the live Supabase project and requested that the combined work be tracked as **Update 2.3.3**. The additional interface change is that selecting a saved Favorite Word from the Dashboard must open its expanded details without navigating to Dictionary.

### Production Supabase migration rollout

All six reviewed migrations were applied successfully to the live SwiftDictionary Supabase project on 2026-11-14 using the connected Supabase integration, in this dependency order:

| Migration version | Migration |
|---|---|
| 20261114082303 | `swiftdictionary_update_2_3_0_saved_words_privilege_hardening` |
| 20261114082311 | `swiftdictionary_update_2_3_0_learning_content_catalog` |
| 20261114082324 | `swiftdictionary_update_2_3_0_completion_based_allowance` |
| 20261114082328 | `swiftdictionary_update_2_3_0_daily_activity_sessions` |
| 20261114082332 | `swiftdictionary_update_2_3_0_current_window_allowance_ledger` |
| 20261114082335 | `swiftdictionary_update_2_3_0_learning_history_deletion` |

The exact SQL bodies are now recorded under `supabase/migrations/` with the same timestamp versions as the live migration history. Their statements match the reviewed drafts applied to production; migration-file headers identify them as applied source, not pending drafts. The six original review drafts remain in `docs/` as historical review artifacts.

### Preflight and post-migration verification

Before applying the migrations, read-only checks confirmed:
- Historical `lesson_progress` and lesson `learning_activity_log` rows reconciled one-to-one (13 rows in each project-wide relation at the time of preflight).
- No per-user historical count mismatches.
- No historical start-timestamp mismatches beyond the five-second tolerance.
- No duplicate practice-summary groups that would block the new uniqueness/summary rules.
- Required Supabase Auth session columns were present.

After applying the migrations, the production migration history listed all six versions. Schema verification confirmed:
- `public.daily_activity_sessions`, `private.learning_content_catalog` and `private.learning_allowance_usage` exist.
- Daily start, complete, allowance-usage and learning-history-deletion RPCs exist.
- Free permanent lessons = 5/day; proposed Premium permanent lessons = 15/day.
- Free daily Topic/Application/Discovery/Revision = 1 each/day; proposed Premium = 3 each/day.
- 161 approved catalogue rows are active.
- Historical completion reconciliation remains represented as 13 completed events.
- The migrations themselves created no daily sessions or current-window ledger rows.

Security/grant verification confirmed:
- `public.saved_words` retains RLS and its three existing owner-scoped policies.
- Anonymous SELECT is denied; authenticated SELECT/INSERT/DELETE are allowed; authenticated UPDATE is denied.
- Authenticated users cannot directly SELECT the private catalogue or allowance ledger.
- Authenticated users can execute the intended Daily Activity, allowance read and own-history deletion RPCs.

The post-migration Security Advisor reported INFO findings for private tables with RLS enabled and no policies (intentional deny-by-default private tables), WARN findings for authenticated execution of two SECURITY DEFINER RPCs (including the new authenticated practice-summary RPC, which checks `auth.uid()` and is intentionally exposed to signed-in callers), and the existing Auth leaked-password-protection setting. These notices were not silently expanded into unrelated changes. Review the advisor again if the security model changes.

No production test account, synthetic user, or test session was inserted. No personal saved-word contents were copied into the development record. The current-window ledger remains private and stores category-level counts, not per-word or answer-level telemetry.

### Update 2.3.3 Dashboard Favorite Words detail behavior

- Branch: `feature/update-2-3-3-dashboard-favorite-details`.
- PR #7: https://github.com/WhiteWingCat/wordbook/pull/7.
- Current recorded feature head at archive time: `b09f10aa1fa22ea3ba4209408758cb2325eba4ae`.
- Selecting an English or Chinese saved word opens the existing expanded detail drawer while the Dashboard page remains visible.
- Previous/next dictionary navigation controls and arrow-key navigation are suppressed while a Dashboard favorite is open; normal dictionary modal behavior is restored after closing.
- Closing the drawer returns focus to the originating Dashboard favorite when it remains in the document.
- A legacy saved row absent from the current dictionary catalogue remains on the Dashboard and receives a status message; it is not silently redirected to Dictionary or guessed.
- A new Chromium browser regression covers both English and Simplified Chinese favorites and verifies Dashboard remains visible.

### Validation and deployment state

- GitHub Actions run #775 passed PostgreSQL 17 migration/allowance tests, Chromium browser regression tests (including the new Dashboard favorite detail test), and disposable local Supabase Auth compatibility.
- GitHub Actions run #780 passed all three jobs on final branch head `b09f10aa1fa22ea3ba4209408758cb2325eba4ae`: PostgreSQL 17 migration/allowance tests, Chromium browser regression and disposable local Supabase Auth compatibility.
- Cloudflare Pages reported a successful branch preview build for final PR head `b09f10a`: https://feature-update-2-3-3-dashboa.swiftdictionary-testing.pages.dev.
- PR #7 was squash-merged into `main` as commit `90dc73a9b65fc3af713fefab4955057026089b96` on 2026-11-14 at 08:38:54 UTC. Main GitHub Pages deployment run #79 (`43576812434`) completed successfully at 08:39:35 UTC. Update 2.3.3 frontend and the six database migrations are now live. The owner should refresh the live site and test Daily Learning start/resume/completion/allowance behavior and Dashboard favorite details.

### Privacy and legal-risk review

The rollout uses the already reviewed data model: stable approved content identifiers, completion event metadata, per-category allowance counts and user-owned daily sessions. The catalogue does not store question text or answers; the allowance ledger does not store word IDs or answer-level events. No new tracking, third-party content or payment functionality was introduced. Saved-word least-privilege grants were tightened without removing owner-scoped RLS.

Malaysia PDPA and general international privacy obligations remain relevant to account-linked preferences and learning records. The current change does not add new personal-data categories. Review privacy notices and cross-border processing disclosures before future monetisation or broader analytics. This is planning guidance, not legal advice or a compliance certification.

### Recovery point and next actions

1. Owner refreshes the live website and tests Daily Learning start/resume/completion/allowance behaviour.
2. Owner tests English and Simplified Chinese Dashboard Favorite Word details, including close/return focus, on desktop and mobile.
3. Record any production-only bugs as a small 2.3.3 follow-up patch if needed.
4. Continue to Update 2.4.0 Quiz after the 2.3.3 rollout is accepted.

