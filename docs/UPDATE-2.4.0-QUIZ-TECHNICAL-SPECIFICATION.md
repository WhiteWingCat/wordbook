# SwiftDictionary Update 2.4.0 — Quiz Technical Specification

**Date:** 2026-11-14  
**Status:** Final product decisions confirmed; technical specification ready for implementation  
**Repository baseline:** \`main\`, Update 2.3.3  
**Production baseline:** GitHub Pages Update 2.3.3; Supabase Postgres 17.11  
**Owner approval required before implementation, migrations, allowance changes or deployment.**

## 1. Purpose and scope

Update 2.4.0 adds a dedicated multiple-choice Quiz experience that assesses approved English-learning curriculum knowledge. It must integrate with existing account isolation, learning progress, Daily Revision, Dashboard insights, translation preferences and completion-based allowances.

The Quiz is an assessment feature, not a copy of Lesson practice. It must have its own approved question bank, wording, answer choices and distractors.

### Included

- Beginner, Intermediate and Advanced quiz sessions.
- Fixed session lengths: 10, 15 and 20 questions respectively.
- Mixed curriculum topics, with no user-facing category filter.
- Multiple-choice questions only.
- Question and answer randomisation fixed for the lifetime of a session.
- Previous/next navigation and answer changes before submission.
- Autosaved unfinished progress, resume and explicit abandonment.
- One active Quiz session per account.
- Server-side evaluation and completion-based allowance charging.
- Score, percentage, per-question review and topic-level learning insights.
- Dashboard and Daily Revision integration.
- English learning with supported translation-language pairs only.
- Responsive, accessible desktop and mobile interface.

### Excluded from 2.4.0

- Fill-in-the-blank or free-text answer evaluation.
- Timers, countdowns, speed scoring or time pressure.
- Pass/fail thresholds.
- Retaking a completed session.
- User-facing topic/category selection.
- A Chinese-learning Quiz curriculum before a reviewed Chinese learning curriculum exists.
- Payment, checkout or subscription purchase flows.
- Changes to unlimited Dictionary search.

## 2. Owner-confirmed product requirements

### Difficulty, length and curriculum eligibility

| Selected difficulty | Questions | Eligible source difficulty |
|---|---:|---|
| Beginner | 10 | Beginner only |
| Intermediate | 15 | Intermediate and Beginner, using one of the two approved mixes below |
| Advanced | 20 | Advanced, Intermediate and optionally Beginner |

Questions may be drawn from every approved lesson in the eligible curriculum, whether or not the learner has personally completed that lesson. Unapproved or out-of-scope content is never eligible.

### Approved difficulty composition

| Quiz difficulty | Composition |
|---|---|
| Beginner | 100% Beginner |
| Intermediate | Either 50% Intermediate / 50% Beginner, or 80% Intermediate / 20% Beginner |
| Advanced | 60–80% Advanced, exactly 20% Intermediate, and 0–20% Beginner |

All proportions must total 100%.

Whole-question mapping:

- Beginner: 10 Beginner questions.
- Intermediate 80/20: 12 Intermediate and 3 Beginner.
- Intermediate 50/50: 8/7 or 7/8. Alternate which source difficulty receives 8 across sessions to avoid systematic rounding bias.
- Advanced: exactly 4 Intermediate; 0–4 Beginner; 16–12 Advanced, respectively.

The question selector must not silently substitute an unapproved difficulty or violate these ratios. The exact Advanced distribution within the approved range should be rotated or sampled in a way that does not systematically exclude Beginner reinforcement.

### Session and answer behaviour

- No timer or countdown.
- Answer choices are shuffled at session creation and remain in the same order after navigation, refresh, sign-out/sign-in or resume.
- Learners may move between questions and change selections until submission.
- Correctness feedback, correct answers and results remain hidden until submission.
- Submission requires every question to have an answer. The interface should identify unanswered questions before final submission.
- Submission locks all answers and produces an immutable result.
- Completed review is read-only and shows every question, selected answer, correct answer and explanation.
- A completed quiz cannot be retaken. A new distinct session may be started if allowance and session rules permit.
- Unfinished progress persists until completion or explicit abandonment. Midnight does not expire an active session.
- One active session per account, regardless of difficulty.
- Explicit abandonment releases the active-session slot and consumes no allowance.
- Start, resume, abandonment and completed review are free. Only successful submission consumes a Quiz allowance.

### Results

- Show raw score and percentage, for example 12/15 and 80%.
- Do not display pass/fail or a passing threshold.
- Include per-question review and explanations.
- Use topic-level results to inform Dashboard and Daily Revision, but do not treat one incorrect answer or one quiz as definitive proof of mastery.
- Completed results remain reviewable after question-bank updates by using versioned snapshots.

## 3. Current repository and content inspection

Read-only inspection of the current \`main\` branch found:

- The app is a static GitHub Pages website. The main UI, dictionary data and much of the application logic are in \`index.html\` (approximately 932 KB and 18,530 lines at inspection).
- Daily Learning logic is separated into \`daily-learning.js\`.
- There is no root \`package.json\`; the repository includes a Playwright configuration, mock testing and browser/SQL regression tests.
- The Quiz route and navigation already exist, but the Quiz page is still a Coming Soon placeholder.
- The existing course selector offers English and Simplified Chinese. The current permanent Lessons curriculum is English learning with Simplified Chinese translations; a complete Chinese-learning curriculum is not present in the current Lessons foundation.
- The existing 15 lessons are distributed evenly across difficulty, with 52 original Lesson practice questions:

| Lesson difficulty | Lessons | Existing Lesson practice questions |
|---|---:|---:|
| Beginner | 5 | 18 |
| Intermediate | 5 | 17 |
| Advanced | 5 | 17 |
| Total | 15 | 52 |

The 52 Lesson practice questions are not a Quiz bank. Quiz content must be independently authored/adapted and reviewed; do not copy those practice questions one-to-one.

**Question-bank finding:** No Quiz-specific question bank, Quiz session table or Quiz RPC exists in the inspected production schema. There are currently zero approved Quiz questions. All Quiz difficulties must therefore remain unavailable until the new bank is populated and passes the availability gate.

## 4. Current Supabase architecture and findings

The connected SwiftDictionary project is healthy and uses PostgreSQL 17.11 in the Tokyo region (\`ap-northeast-1\`). Read-only inspection confirmed 18 applied migrations, including the six Update 2.3.0 migrations.

### Existing structures that can be reused

- \`public.user_preferences\`: learning language, translation language, timezone and Daily Learning preferences.
- \`public.user_entitlements\`: Free/Premium entitlement state.
- \`public.learning_plan_limits\`: per-plan and per-activity daily limits.
- \`public.learning_activity_log\`: activity category, language, timestamp and started/completed event type. Its activity constraint already includes \`quiz\`.
- \`private.learning_allowance_usage\`: private current-window completion counts. Its activity constraint already includes \`quiz\`.
- \`public.get_my_learning_allowance_usage()\`: owner-scoped allowance read.
- \`public.complete_permanent_lesson()\` and the existing completion trigger: established completion-based pattern.
- \`public.delete_my_learning_history()\` and its private implementation: existing history-deletion path that must be extended to include Quiz records.

The current \`learning_activity_log\` insert trigger charges only \`completed\` events. It sets the event timestamp on the server, serialises completion checks per user, reads the effective server-owned IANA timezone and plan, and increments the private allowance ledger in the same transaction. The personal testing exemption is explicitly limited to \`lesson\` completions; Quiz must not inherit it.

### Allowance mismatch — do not silently preserve

The live \`learning_plan_limits\` table currently contains:

| Plan | Live Quiz limit | Planned 2.4.0 target |
|---|---:|---:|
| Free | 5/day | 1/day |
| Premium | 12/day | 3/day (proposed Premium tier) |

The live values do not match the Quiz planning values recorded in the Master Development Record. No live setting was changed during this inspection. A reviewed migration must reconcile the values before Quiz is enabled. Premium remains a proposed entitlement tier; there is no checkout or payment flow.

### Existing Daily Learning sessions are not a direct Quiz fit

\`public.daily_activity_sessions\` has a partial unique index for one active session per user and activity category. Daily Learning has start, complete and abandon RPCs and has its own daily-session rollover behaviour.

Quiz needs one active session per account across all difficulties, indefinite unfinished-session persistence, a versioned question/answer snapshot and delayed answer-key disclosure. Do not reuse the Daily Learning session table or its rollover/abandonment policy as-is.

### Deletion integration

The current learning-history deletion implementation removes Daily Learning sessions, Lesson practice summaries, Lesson progress and activity history, while retaining the separate allowance ledger. The Quiz migration must extend the deletion implementation to remove the user's Quiz session, answer and review history without resetting the current-day allowance ledger.

### Security baseline

- Existing exposed user-data tables have RLS enabled and owner-scoped policies.
- Existing private catalogue and allowance tables are in a non-exposed schema with no client-facing read policy.
- Keep Quiz question-bank answer keys and session snapshots in a non-exposed private schema. Do not make correct answers available through public tables, browser bundles or client-readable APIs.
- Existing Supabase Advisor notices were observed during this read-only review. They are baseline findings, not Quiz changes; do not expand this feature into unrelated security-setting changes without a separate review.
- The Quiz design must use explicit \`auth.uid()\` ownership checks, empty/fixed search paths, schema-qualified SQL, least-privilege grants and server-side validation. Avoid broad public \`SECURITY DEFINER\` endpoints.

## 5. Proposed technical architecture

This is the recommended architecture for implementation review. It is not yet an approved migration or deployed schema.

### 5.1 Private, versioned question bank

Create a server-only question bank in the existing private schema. Each approved question version should include:

- Stable question ID and version.
- Learning-course language and translation language.
- Source difficulty, lesson ID and internal topic ID.
- Question type (for example definition, context/usage, grammar or translation assessment).
- Prompt and option content for the supported language pair.
- Correct option ID, explanation and approval status.
- Active/retired state and review metadata.

Keep the correct option key separate from the sanitised question payload returned to the browser. A question's version must be immutable once referenced by a session. Corrections should create a new version rather than rewrite history.

The question bank must have a clear authoring/review process. Every question must have one unambiguous correct answer, plausible but incorrect distractors, a curriculum mapping, context for ambiguous words and reviewed translations. Do not use unlicensed third-party question banks or copy Lesson practice prompts one-to-one.

### 5.2 Private Quiz session and question snapshots

Keep session state and answer keys in private server-side tables. A session should capture:

- Owner user ID.
- Selected difficulty and fixed question count.
- Learning-course and translation language pair.
- Selected composition and source-difficulty counts.
- Session status: in progress, completed or abandoned.
- Started/submitted timestamps and the effective timezone/window metadata needed for audit.
- Stable question IDs and versions, lesson/topic IDs and immutable question snapshots.
- Fixed question order and fixed option order.
- Selected option IDs, stored as the learner answers.
- Final score, percentage and completion metadata.

The session snapshot must preserve enough prompt, option, correct-answer and explanation content to reconstruct review after the live question bank changes or a question is retired. Avoid storing typed free text, keystrokes, device fingerprints or unrelated telemetry.

Enforce one active session per user at the database level with a unique partial index on the owner for sessions whose status is in progress. Do not rely on browser state or a frontend query alone.

### 5.3 Server RPC contract

Use narrow authenticated RPC operations, following the existing public-wrapper/private-implementation pattern after validating the required grants and schema access:

1. **Quiz availability:** returns whether each difficulty is enabled for the selected language pair, the reason if unavailable, and the user's allowance state. It returns no answer key.
2. **Start Quiz:** checks authentication, one-active-session rule, supported language pair, question-bank availability and current ability to complete under the applicable allowance. It selects questions, randomises question and option order, creates immutable snapshots and returns sanitised prompts/options.
3. **Get/resume active session:** returns the caller's own active session and sanitised questions/selected answers, without correctness data.
4. **Save answer:** validates session ownership/status, question membership and option membership; saves the selected option and current position. It rejects changes after completion.
5. **Submit Quiz:** locks the session, verifies ownership and that every question is answered, evaluates all answers server-side, calculates score/percentage, marks the session completed and records one completed \`quiz\` activity event in the same transaction. The existing completion trigger then enforces the server-side daily allowance and increments the private ledger atomically. If any step fails, the transaction must roll back.
6. **Abandon Quiz:** locks and marks only the caller's active session abandoned; no allowance is charged.
7. **Completed review:** returns the caller's completed snapshot including selected/correct answers and explanations. It is read-only.

The exact RPC names and table layout are to be finalised during implementation. Public RPC wrappers must not accept a caller-supplied user ID as authority. Derive ownership from \`auth.uid()\`; use idempotent submission so duplicate requests cannot create a second completion or allowance charge.

### 5.4 Allowance timing

- Starting and saving answers never write a completed activity event.
- Successful final submission is the only event that charges the Quiz allowance.
- Charge against the effective timezone and allowance window at the time of submission, not the session's start date. This matches the existing completion trigger and means a session started before midnight but submitted after midnight is charged to the new local day.
- A session that crosses midnight remains resumable. It does not reserve or consume the previous day's allowance.
- If the allowance is exhausted at start time, the UI should not invite the user to start a session that cannot be completed under the current rules. The server must still re-check the limit atomically at submission.
- Free target is one completed Quiz per local day. Premium target is three per local day, subject to final Premium approval and a reviewed database configuration change.
- Reviewing completed quizzes and abandoning unfinished sessions are free.
- Do not extend the personal Lesson testing exemption to Quiz.

### 5.5 Language and refresh behaviour

For 2.4.0, support only the English learning curriculum and language pairs for which Quiz prompts, options, explanations and feedback have been authored and reviewed. The current Lesson curriculum provides English learning content with Simplified Chinese translations; it does not establish a Chinese-learning curriculum. A Chinese-learning Quiz remains unavailable until that curriculum is separately approved and authored.

- The learning-course language determines the knowledge and curriculum being tested.
- The selected translation language controls translations, explanations and feedback.
- Translation-assessment questions may ask in English and use selected-translation-language answer options.
- Normal knowledge/definition questions use English prompts and options; explanations and feedback use the selected translation language.
- Store the language pair on the session at creation. A preference change affects a new session, not the content of an active session.
- When either selector changes, rerender the current Quiz page and all dependent UI immediately. No navigation away/back should be needed.
- Regression-test both selectors, switching back and forth, new sessions, active-session resume and completed review. Verify actual translation accuracy and completeness, not merely labels.

### 5.6 Dashboard and Daily Revision

Use completed Quiz question/topic mappings and correctness outcomes as additional evidence for topic-level revision. Prefer aggregating from the completed session snapshots rather than storing duplicate answer telemetry. A single wrong answer must not automatically label a topic as weak; combine Quiz evidence with existing Lesson and Daily Learning evidence and use recency/repeated performance.

Dashboard should show Quiz completion count and recent score/percentage. Topic recommendations should explain that they are learning suggestions, not formal proficiency certification.

### 5.7 Frontend integration

- Prefer a dedicated \`quiz.js\` file for Quiz rendering, navigation and client-side session interaction rather than adding another large feature block to the already large \`index.html\`.
- Because the current inline application script owns lexical state such as the Supabase client, signed-in user and language preferences, expose only a narrow, explicit application bridge for Quiz. The bridge should provide the authenticated client context, current user identity, current course/translation pair, route/refresh callbacks and a way to report UI status. Do not expose service-role credentials or private server data.
- Keep all authoritative decisions in database RPCs. The browser may hold the sanitised question payload and current UI selection, but it must not calculate or submit a trusted score.
- Initialise Quiz only after authentication and preference state are ready. On account switch/sign-out, clear the previous account's in-memory Quiz state before loading the newly active account's own session.
- Keep the integration compatible with the existing static GitHub Pages deployment; no bundler or paid runtime is required for this feature.
- Reuse the existing Playwright setup and add a dedicated Quiz browser suite. Do not refactor unrelated Dictionary/Lessons/Daily Learning code as part of the Quiz feature unless a narrowly scoped integration fix is required.

## 6. Question-bank availability, same-day uniqueness and sampling

**Observed inventory:** zero approved Quiz questions. All difficulties are unavailable at the start of this feature.

The availability gate is evaluated independently for the supported course/translation pair and selected difficulty. It must verify the complete session can be generated from approved, active, distinct questions and exact source-difficulty ratios. Every question must map to an approved lesson/topic, have four reviewed answer options with one unambiguous correct answer, a useful explanation, and complete reviewed language-pair content. The recommended topic-diversity gate remains at least three distinct topic IDs per session and no single topic supplying more than 40% of questions.

### Confirmed two-session minimum and three-session target

The owner approved a hard minimum capacity for two complete sessions and a target capacity for three complete sessions. Counts below are per selected difficulty and source-difficulty pool. They are sized to the largest permitted whole-question source count for that difficulty.

| Selected difficulty | Two-session minimum | Three-session target |
|---|---|---|
| Beginner | 20 Beginner | 30 Beginner |
| Intermediate | 24 Intermediate + 16 Beginner | 36 Intermediate + 24 Beginner |
| Advanced | 32 Advanced + 8 Intermediate + 8 Beginner | 48 Advanced + 12 Intermediate + 12 Beginner |

The counts support two or three sessions of the same selected difficulty without repeating a question, across the approved composition choices. Because lower-level questions may also appear in higher-difficulty quizzes, source-difficulty pools are shared. The selector must exclude questions already issued to the same account during its current local allowance day, across all Quiz difficulties.

### Same-day uniqueness

- Do not issue the same question more than once to the same account during one effective local allowance day, regardless of selected Quiz difficulty.
- A started session reserves all question IDs issued in that session for the remainder of that local day. This includes a session later abandoned: abandonment does not charge the Quiz allowance, but questions already delivered to the learner still count as seen.
- Do not repeat the same complete quiz. Preventing any individual question from repeating within the same local day also prevents an identical question sequence.
- Randomise both question order and the four answer-option order at session creation. Persist both orders for the lifetime of the session.
- Use the server-owned effective allowance timezone and date. The uniqueness window resets at that user's local midnight, not UTC midnight.
- If remaining unseen eligible content cannot satisfy a complete session with exact ratios and topic coverage, prevent the new session and explain that fresh questions are unavailable until the next reset or additional approved content is added. Never repeat questions to fill a shortfall.

The two-session minimum is the hard content gate. The three-session target is the preferred capacity aligned with the confirmed Premium allowance of three completed quizzes per local day. The question bank may be larger; these are minimum capacity requirements, not maximum bank sizes.

If a difficulty fails the hard gate, it must remain unavailable. Never shorten a quiz, relax a ratio, duplicate a question within a session or substitute out-of-scope material.
## 7. User interface proposal

### Quiz landing page

- Keep the existing Quiz navigation route.
- Show Beginner, Intermediate and Advanced difficulty cards with question count, availability and progress.
- If a session is active, make **Resume Quiz** the primary action and prevent starting another difficulty.
- Show a clear unavailable state and reason where the question bank or language pair is not ready.
- Show completed quizzes with date, difficulty, score and percentage; provide a free read-only review action.
- Do not show topic/category filters.

### Active session

- Show difficulty, question number and overall progress.
- Present one question at a time with accessible answer cards.
- Clearly distinguish selected from unselected options without revealing correctness.
- Provide Previous and Next navigation.
- Save each answer and navigation position reliably; show a subtle save state if network latency requires it.
- Provide a final submission review that identifies unanswered questions and requires confirmation before submission.
- No timer, countdown or time-pressure text.

### Result and review

- Display score and percentage only; no pass/fail.
- Provide a topic summary and suggested revision where sufficient evidence exists.
- Show every question with the selected answer, correct answer and explanation.
- Disable answer controls and all editing in completed review.

## 8. Privacy, legal and content-risk review

This section is product-risk planning, not legal advice or a compliance certification.

### New personal-data processing

Unlike current Lesson practice, Quiz requires storing selected answer IDs and enough question/answer snapshots to support unfinished-session recovery and completed review. These are account-linked learning records. Store only the selected option identifier and necessary session/question metadata; do not store typed responses or keystrokes. Explain in the privacy notice that answers, scores and topic-level performance are retained for session recovery, results, progress and revision recommendations.

The current privacy-policy draft says individual selected answers are not stored. That statement will become inaccurate if Quiz stores selected options. Update the English and Bahasa Malaysia notices before public release, including purpose, retention, access/correction/deletion, recipients, cross-border processing and the distinction between deleting history and resetting an allowance.

### Malaysia

The Personal Data Protection Act 2010 (Act 709), as amended in 2024, may apply to processing in respect of commercial transactions. A free, individually operated public learning service is not automatically outside scope; the controller's actual activities and the narrow personal/family/household exemption require legal assessment. The 2024 amendments commenced in stages on 1 January, 1 April and 1 June 2025.

Before public release:

- Obtain Malaysian legal advice on the Act's applicability and identify the data controller and privacy contact.
- Review the 2026 reprint, privacy notice, security, retention, access/correction, deletion and breach-response requirements.
- Complete DPIA screening for account-linked quiz answers, scores, topic-level performance and adaptive revision.
- Assess whether regular/systematic monitoring triggers the DPO appointment requirement. JPDP's published criteria include processing more than 20,000 data subjects, more than 10,000 sensitive-data subjects, or regular and systematic monitoring. Do not assume the project is exempt solely because it is small.
- Assess cross-border transfers and processor arrangements. The primary database is in Tokyo, Japan; this does not establish the locations of Auth, backups, logs, support access or all subprocessors.
- Keep the breach-response process aligned with current JPDP notification guidance.

### International users and age suitability

- GDPR Article 3 may apply where a non-EU controller intentionally offers services to people in the EU or monitors their behaviour there. Mere accessibility alone is not sufficient; targeting and actual service design matter.
- GDPR Article 8's parental-consent age for information-society services varies by Member State between 13 and 16. A 16+ intended audience does not remove all other child-data duties.
- COPPA in the United States concerns services directed to children under 13 or actual knowledge of collecting their personal information. Keep the 16+ audience statement accurate and do not collect date of birth unless there is a defined legal/product need.
- Conduct a country-by-country applicability screen before broad international promotion or monetisation.

### Content and intellectual property

Author original Quiz questions, options and explanations. Do not copy existing Lesson practice questions one-to-one or import third-party question banks without documented rights. Review dictionary/translation sources and any third-party assets used in explanations. Keep attribution and licence records with content.

### Primary legal sources reviewed

- Malaysia JPDP, Personal Data Protection (Amendment) Act 2024: https://www.pdp.gov.my/en/akta/personal-data-protection-amendment-act-2024/
- Malaysia JPDP, commencement notice: https://www.pdp.gov.my/ppdpv1/wp-content/uploads/2024/12/PENETAPAN-TARIKH-PERMULAAN-KUAT-KUASA-1.pdf
- Malaysia JPDP, Act 709 2026 reprint: https://pdp.gov.my/wp-content/uploads/2026/10/Akta-709-cetakan-semula-2026-BI.pdf
- Malaysia JPDP, Cross Border Personal Data Transfer Guideline No. 3/2025: https://www.pdp.gov.my/ppdpv1/wp-content/uploads/2025/08/GP_CBPDT_EN.pdf
- Malaysia JPDP, DPO appointment FAQ: https://www.pdp.gov.my/ppdpv1/wp-content/uploads/2025/05/FAQ-Soalan-Mengenai-DPO-1.pdf
- Malaysia JPDP, DPIA Guideline: https://www.pdp.gov.my/en/akta/data-protection-impact-assessment-guideline-dpia/
- EU GDPR, Regulation (EU) 2016/679: https://eur-lex.europa.eu/eli/reg/2016/679
- US FTC, COPPA FAQs: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions

## 9. Test and release strategy

Do not test against production by creating synthetic user sessions or modifying live user data. Use the existing PostgreSQL/Playwright CI approach and disposable local Supabase environment where practical.

### Content validation

- Stable unique question IDs and versions.
- Exact difficulty composition and whole-question counts.
- At least the required number of distinct questions and topic coverage.
- Exactly one correct option per question.
- No duplicate options or ambiguous correct answers.
- Every option ID maps to the intended displayed text after shuffle.
- All question and explanation content is complete for each supported language pair.
- Quiz wording is independent from Lesson practice wording.
- Difficulty is appropriate for the mapped curriculum.

### Database/security validation

- Anonymous users cannot start, read or modify sessions.
- Authenticated users can access only their own sessions.
- One active session per account is enforced under concurrent start requests.
- Correct answer keys are never returned before submission.
- Client cannot alter score, completion status, question order or correct answers.
- Save-answer calls reject invalid question/option IDs and completed/abandoned sessions.
- Concurrent submissions are idempotent and charge at most once.
- Completion and allowance increment succeed or roll back together.
- Start/resume/abandon/review consume no allowance.
- Completion uses the server-owned timezone and plan; midnight rollover charges the submission day.
- Lesson-only personal test exemption cannot bypass Quiz allowance.
- Learning-history deletion removes Quiz history but preserves the allowance ledger.
- Account switching and shared-device sessions remain isolated.

### Browser and interaction regression

- Desktop and mobile layouts, keyboard navigation and accessible selected-state indicators.
- Begin/resume/abandon and one-active-session handling.
- Previous/next navigation and answer changes before submission.
- Refresh, browser close/reopen, network interruption and cross-device resume.
- No answer/correctness reveal before submission.
- Submit confirmation and unanswered-question handling.
- Result score, percentage, per-question review and read-only behaviour.
- Translation/course selector refresh without navigating away/back.
- Active session retains its captured language pair; new session uses new preferences.
- Dashboard and Daily Revision consume Quiz evidence without over-weighting a single mistake.
- Regression of Dictionary, Lessons, Daily Learning, Profile, Google sign-in, account switching and saved-word isolation.

### Release gates

1. Owner approves this specification and the remaining open product choices.
2. Quiz bank is authored, linguistically reviewed and passes the availability thresholds.
3. Feature branch is created from current \`main\`; production remains unchanged.
4. Read-only Supabase inspection is repeated immediately before migration design.
5. Migrations are reviewed and tested in disposable/local environments.
6. CI, browser tests, security checks and translation QA pass.
7. Owner reviews the preview and explicitly approves any production migration and deployment.
8. Update privacy notices and operational procedures before public release.

## 10. Final owner-confirmed decisions (2026-11-14)

All remaining product-level decisions from the pre-development review are confirmed:

1. **Answer options:** exactly four multiple-choice options per question. Content authors must write three plausible, defensible distractors; do not publish a question with weak, duplicate or ambiguous options. A question that cannot meet this quality bar is not approved for the bank.
2. **Same-day uniqueness:** no question may repeat for the same account within the same effective local day, across separate sessions and across all Quiz difficulties. No complete quiz sequence may repeat. Issued questions remain reserved for that day even if the session is abandoned.
3. **Question-bank capacity:** each difficulty requires at least two complete sessions' worth of distinct approved questions. The preferred target is three complete sessions' worth. See Section 6 for the exact source-difficulty counts.
4. **Daily allowance:** Free = 1 completed Quiz per local day; Premium = 3 completed Quizzes per local day. This is the confirmed 1:3 ratio. It supersedes the earlier conceptual example. Production currently has Free 5/day and Premium 12/day; a reviewed migration is required before enabling Quiz.
5. **Percentage rounding:** display the percentage rounded to the nearest whole percent, calculated from the exact score and question count. Retain the integer numerator and denominator as the source of truth.

The following previously approved requirements remain unchanged: Beginner 10 questions, Intermediate 15, Advanced 20; the approved difficulty compositions; curriculum-wide eligibility within the selected difficulty scope; no timer; score and percentage without pass/fail; answer changes until submission; unfinished sessions persist until completion or explicit abandonment; one active session per account; only successful submission consumes allowance; and completed review is read-only.

### Implementation clarifications

- Same-day question reservation must be server-authoritative and account-scoped. Do not rely on localStorage or browser state.
- An abandoned session consumes no Quiz completion allowance but does not make already delivered questions eligible again on that local day.
- If repeated abandoned sessions exhaust the remaining eligible question pool, the system may block further starts until reset. Explain this separately from allowance exhaustion.
- The 3-session pool target is capacity per selected difficulty, not a promise that every possible combination of three different difficulty sessions can always be started if shared lower-level pools have already been used. The availability RPC must calculate remaining eligible inventory before creating each session.

## 11. Preparation outcome and recovery point

- Production remains Update 2.3.3; merge commit \`90dc73a9b65fc3af713fefab4955057026089b96\`.
- Quiz remains Coming Soon.
- No application source, question bank, database schema, migration, live allowance setting, production data or deployment was changed during this preparation.
- Documentation is maintained on \`docs/master-development-record\`.
- The owner has approved the remaining product decisions. Implementation may proceed on a dedicated feature branch from current `main` after the final read-only baseline check.


## 12. Database foundation implementation and validation (2026-11-14)

### Implemented files

- `supabase/migrations/20261114120000_swiftdictionary_update_2_4_0_quiz_question_bank_foundation.sql`
- `supabase/tests/quiz_question_bank_foundation.sql`
- `.github/workflows/quiz-db-foundation.yml`

The migration creates three private tables:

1. `private.quiz_question_bank` — versioned bilingual questions, four option records, correct option and explanations, approval lifecycle and eligibility indexes.
2. `private.quiz_sessions` — account-scoped session state, selected difficulty, course/translation snapshot, exact question count, source composition, local date/timezone and completion result.
3. `private.quiz_session_questions` — immutable prompt/option/explanation snapshots, shuffled option order, saved selection and same-day issued-question ledger.

Database enforcement includes exactly four unique option IDs with required bilingual text, a valid correct option ID, one active approved revision per question ID, session question counts per difficulty, one active session per account, unique question positions, and a unique `(user_id, local_date, question_id)` constraint that prevents re-issuing a question after abandonment or across difficulty levels. All three tables have RLS enabled and direct `anon`/`authenticated` table privileges revoked. Correct answers and explanations remain in the private schema.

### No-cost alternative to a Supabase development branch

The owner declined the estimated hourly Supabase branch charge. Do not create a billable Supabase branch for this validation stage.

Instead, GitHub Actions provisions an ephemeral PostgreSQL 17 service container for the job, bootstraps only the minimal Supabase-compatible roles and referenced schemas (`anon`, `authenticated`, `auth.users`, `public.languages`), applies the migration, runs the assertions, and destroys the container when the job ends. It does not connect to or alter the production Supabase project.

This is a useful PostgreSQL migration/constraint/security test, but it is not a full Supabase Auth, PostgREST, JWT, RLS-policy or Supabase CLI integration test. A full local Supabase CLI stack can be used later if a workflow specifically needs to validate those platform behaviours; it does not require a paid hosted branch but does require container resources.

### Validation result

- GitHub Actions workflow: `Quiz database foundation`, run #7.
- PostgreSQL service: PostgreSQL 17.12 (within the PostgreSQL 17 major line).
- Migration application: **passed**.
- Schema/table creation: **passed**.
- RLS flags and direct table privilege checks: **passed**.
- Four-option question approval and server-assigned approval timestamp: **passed**.
- Rejection of three-option questions and duplicate option IDs: **passed**.
- Persisted option permutation validation: **passed**.
- Answer changes before submission: **passed**.
- Same-day question reuse rejection after an abandoned session: **passed**.
- All assertions completed successfully; test transaction rolled back.

The first test run exposed an ordering-column defect in the question-bank validation trigger; it was corrected before the passing run. A subsequent test adjustment added the required synthetic `auth.users` row. The final run completed successfully.

### Scope limitations and next foundation work

This stage does not yet implement authenticated RPCs, question selection/random sampling, source-difficulty composition enforcement, session creation/resume/abandon/submit, server-side scoring, allowance charging, learning-history deletion integration or approved content ingestion. These are required before the feature can be used. No Quiz questions have been approved or inserted, and all difficulties remain unavailable.

No production Supabase migration, allowance change, user data change, merge or deployment was performed.


## 13. Authenticated Quiz session RPC implementation (2026-11-14)

### 13.1 Implementation scope

The next backend stage has been implemented on the feature/update-2-4-0-quiz branch in migration:

- supabase/migrations/20261114160000_swiftdictionary_update_2_4_0_quiz_authenticated_rpcs.sql

It builds on the question-bank/session foundation migration from section 12. No production Supabase migration was applied.

### 13.2 Server-side RPC surface

Public, authenticated-only, SECURITY INVOKER wrappers are provided for:

- get_my_quiz_availability()
- start_my_quiz(p_difficulty)
- get_my_active_quiz()
- save_my_quiz_answer(p_session_id, p_question_id, p_selected_option_id, p_current_position)
- submit_my_quiz(p_session_id)
- abandon_my_quiz(p_session_id)
- get_my_quiz_history(p_limit)
- get_my_quiz_review(p_session_id)

The existing delete_my_learning_history() RPC is extended to delete Quiz session snapshots as part of learning-history deletion.

Each implementation derives ownership from auth.uid(); no client-supplied user ID is accepted. Implementations live in the non-exposed private schema as narrowly scoped SECURITY DEFINER functions with an empty fixed search_path. Direct access to Quiz tables is revoked, RLS is enabled, and anonymous execution is revoked. Correct option IDs and explanations are withheld from active-session payloads and returned only after completion.

### 13.3 Question selection and availability

The RPC layer enforces the approved source-difficulty compositions:

| Selected difficulty | Session composition |
|---|---|
| Beginner | 10 Beginner |
| Intermediate | 12 Intermediate + 3 Beginner, or 8 + 7, or 7 + 8 |
| Advanced | 12–16 Advanced + 4 Intermediate + 0–4 Beginner |

For Intermediate, the RPC chooses randomly among compositions that still have enough unseen questions. Advanced likewise chooses randomly among feasible Beginner counts, rather than selecting a composition that cannot be fulfilled. This prevents avoidable failures when the remaining same-day pool is uneven.

The two-session minimum and three-session target are checked against approved question counts mapped to active permanent lessons. Current availability also checks same-day unseen counts and at least three distinct topics. Session selection caps any one topic at 40% of the quiz and requires at least three topics.

The current implementation exposes the English learning course only. A learning-course selection without an approved Quiz bank is reported as unavailable; a session's language selections are snapshotted so later preference changes do not rewrite an unfinished session.

### 13.4 Session lifecycle and scoring

- One unfinished session per account is enforced; a second start returns the existing session for resumption.
- Session question order and option order are randomized and stored, so refreshes do not reshuffle an active session.
- Selected answers and current position are saved server-side and can be changed until submission.
- Unfinished sessions have no timer or automatic expiry. They remain resumable until completion or explicit abandonment.
- Abandonment does not consume allowance, but issued questions remain reserved for that local day.
- Submission requires every question to be answered. The server calculates correct count and percentage, rounded to the nearest whole percentage.
- Completion is recorded through the existing learning_activity_log completion trigger, so the existing server-side daily allowance ledger remains authoritative. Duplicate submission is idempotent.
- Completed reviews reveal the correct option and explanations; active sessions do not.
- History returns completed Quiz summaries, with full review available through a separate owner-checked RPC.

### 13.5 Same-day reservation and deletion behaviour

A minimal private.quiz_daily_question_reservations table stores only the account ID, local date, question ID and reservation timestamp. It contains no prompt, options, selected answer, score or explanation. This separate ledger preserves the same-day no-repeat rule even if a user deletes Quiz history. Expired reservation rows are purged after a conservative 36-hour window when Quiz availability or a new session is requested.

Learning-history deletion removes Quiz sessions, answer snapshots and Quiz completion events, but deliberately retains:
- the daily allowance ledger, so deleting history cannot reset a user's quota; and
- the minimal temporary question-reservation ledger, so deleting history cannot cause a same-day question repeat.

This retention behaviour must be explained in the Privacy Notice before public release. Account deletion still removes these user-linked rows through the account foreign-key cascade.

### 13.6 Validation

The workflow .github/workflows/quiz-db-foundation.yml now has two isolated validation paths:

1. PostgreSQL 17 disposable service: applies the foundation and RPC migrations and tests constraints, question sampling, session lifecycle, scoring, answer review, allowance charging, deletion, ownership and access controls.
2. Disposable local Supabase stack: validates the real local Auth schema/JWT helpers, applies the synthetic SwiftDictionary application baseline and 2.3.x prerequisite migrations, applies both Quiz migrations, runs the authenticated RPC integration tests, and runs Supabase security advisors.

The local Supabase stack is created and destroyed within GitHub Actions. It is not a hosted Supabase branch and does not connect to the production project. RPC tests call the local database under the authenticated role with request claims set, exercising the real auth.uid()/auth.jwt() helpers and grants; a signed-token HTTP/PostgREST flow remains a later frontend end-to-end test. The PostgreSQL 17 and full local Supabase Auth/RPC/security-advisor jobs passed on workflow run 68 (2026-11-14), including the final access-control and RLS assertion for the temporary reservation table. The companion 2.3.x PostgreSQL, local Supabase Auth compatibility, and Chromium browser regression checks also passed.

### 13.7 Remaining work and release gates

- No approved Quiz question content has been inserted. The production question bank remains empty, so no difficulty should be made available yet.
- Quiz frontend screens and navigation are not implemented in this stage.
- Production Quiz allowance values remain Free 5/day and Premium 12/day. The confirmed target is Free 1/day and Premium 3/day; a separate reviewed migration must update the production limits before Quiz is enabled.
- PR #8 remains a draft validation PR. Do not merge it, apply production migrations, change production allowance rows, or deploy until explicitly approved.
- Next work should cover the question-bank authoring/import/approval pipeline, content minimums and curriculum coverage, then the Quiz UI and end-to-end browser tests.

### 13.8 Preliminary Malaysia privacy/legal review

Quiz adds account-linked learning-performance records: issued question IDs, answer selections, completion timestamps, scores, source lesson/topic mappings, local date and timezone. This is personal learning data even though it is not intended to be sensitive personal data. The feature adds no advertising tracker or third-party analytics.

The Malaysian Personal Data Protection Act 2010 regulates personal-data processing in commercial transactions. The project's current free/personal purpose makes its precise application a matter for the later legal review; any Premium/commercial operation increases the likelihood that the Act applies. The 2024 amendment's DPO and breach-notification provisions took effect on 1 June 2025. The Commissioner's DPO guidance identifies thresholds including more than 20,000 data subjects, more than 10,000 sensitive-data subjects, or processing requiring regular and systematic monitoring. Adaptive weak-topic prioritisation uses learning-performance data to evaluate a learner's progress and may fall within the Commissioner's 2026 profiling guidance; the DPO and profiling implications need specific legal assessment rather than an assumption that the small project is exempt.

Before public release, the later legal milestone should:
- update the Privacy Notice to describe quiz-answer/progress processing, purpose, retention and deletion behaviour, including the temporary 36-hour reservation ledger and retained allowance count;
- assess whether the project falls within a registrable data-controller class under the Commissioner's 2026 registration circular;
- assess whether adaptive topic recommendations constitute profiling or regular/systematic monitoring and whether a DPO or DPIA is required;
- verify the Supabase project region, subprocessors and a valid section 129 cross-border transfer basis if data leaves Malaysia;
- define breach-response and notification procedures, data-subject request handling, and account deletion/retention rules; and
- review age eligibility and applicable privacy rules for the global 16+ audience.

This is a preliminary engineering risk check, not legal advice. The dedicated Terms and Legal update remains scheduled after Flashcards is released to main, as previously decided.

Official reference material:
- [PDPA 2010 reprint (2026)](https://www.pdp.gov.my/wp-content/uploads/2026/10/Akta-709-cetakan-semula-2026-BI.pdf)
- [JPDP FAQ — scope, data-controller registration and DPO criteria](https://www.pdp.gov.my/en/faq/)
- [DPO appointment guidance](https://www.pdp.gov.my/en/akta/personal-data-protection-guidelines-on-the-appointment-of-data-protection-officer-dpo/)
- [Automated Decision-Making and Profiling Guideline (issued 30 April 2026)](https://www.pdp.gov.my/en/akta/automated-decision-making-and-profiling-guideline-admp/)
- [Cross-Border Transfer Guideline](https://www.pdp.gov.my/en/akta/personal-data-protection-guidelines-on-cross-border-transfer-of-personal-data-cbpdt/)
- [Circular No. 1/2026 — Registration of Data Controllers](https://www.pdp.gov.my/en/akta/personal-data-protection-commissioners-circular-no-1-2026-registration-of-data-controllers/)
