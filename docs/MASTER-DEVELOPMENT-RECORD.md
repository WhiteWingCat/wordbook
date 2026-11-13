# SwiftDictionary — Master Development Record

> Durable project handover and source-of-truth summary for future development conversations.
>
> **Repository:** https://github.com/WhiteWingCat/wordbook  
> **Last consolidated:** 2026-11-13  
> **Current baseline:** Update 2.2.0 on main  
> **Current work:** Update 2.3.0 planning and draft implementation; not merged or deployed  
> **Record status:** Initial consolidated edition. Re-check repository, Supabase and deployment state before making changes.

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

**Status as of 2026-11-13: planning and implementation are in draft branches / open draft pull requests. Not merged to main, not deployed to GitHub Pages, and no production Supabase migration or production data write has been performed as part of the draft work.**

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

**Do not change PR #3's target branch or merge either PR without the owner's explicit approval.** The PR #3 description states that no production Supabase migration, production data write, GitHub Pages deployment or merge has been performed.

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
- The current 2.3.0 implementation described in PR #3 is still draft work on branches / pull requests. It must not be represented as production functionality.
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
