# SwiftDictionary Update 2.4.0 — Quiz technical preparation

**Date:** 2026-11-14  
**Repository:** WhiteWingCat/wordbook  
**Documentation branch:** \`docs/master-development-record\`  
**Status:** Read-only source/database inspection and technical specification; no implementation

## Purpose

The owner asked to proceed to the next stage after approving the Quiz scoring, unfinished-session persistence and question-bank availability decisions. This session prepared the technical specification, inspected the current repository and connected Supabase project, and completed an initial Malaysia/international legal and privacy risk review.

## Repository inspection

- Production baseline is Update 2.3.3, main merge commit \`90dc73a9b65fc3af713fefab4955057026089b96\`.
- The static GitHub Pages app has its main interface and most application logic in \`index.html\` (approximately 932 KB, 18,530 lines); Daily Learning is separated into \`daily-learning.js\`.
- No root \`package.json\`; Playwright configuration, mock testing and existing browser/SQL regression tests are present.
- Quiz route exists but remains Coming Soon.
- Current Lessons curriculum is English learning with Simplified Chinese translations. It has 15 lessons and 52 Lesson practice questions: Beginner 5 lessons/18 questions, Intermediate 5/17, Advanced 5/17.
- No Quiz question bank or Quiz session tables exist in production. Quiz question count is zero; no difficulty can be enabled yet.
- The Lesson practice bank is not an acceptable substitute for the separately authored Quiz bank.

## Supabase read-only findings

- Connected project: SwiftDictionary, PostgreSQL 17.11, Tokyo region (\`ap-northeast-1\`).
- Migration history lists 18 applied migrations, including the six 2.3.0 migrations.
- Existing learning tables include plan limits, completion activity log, private current-window allowance ledger, Lesson progress/results and Daily Learning sessions.
- The \`learning_activity_log\` constraint already accepts activity type \`quiz\`; the private allowance ledger also accepts \`quiz\`.
- Its server-side insert trigger charges only \`completed\` events, uses the effective server-owned IANA timezone and plan, serialises per-user completion and updates the private ledger in the same transaction. This is a useful completion-based allowance path.
- The personal test exemption is explicitly limited to Lesson completion.
- Existing Daily Learning sessions enforce one open session per user/category and have daily rollover behaviour. Quiz requires one open session per account, no automatic expiry, answer snapshots and delayed answer-key disclosure; do not reuse the Daily Learning session model unchanged.
- Current learning-history deletion deletes Daily Learning sessions, Lesson practice summaries, Lesson progress and activity log. Quiz records must be added to this deletion path while retaining the private allowance ledger.
- Production \`learning_plan_limits\` currently has Quiz Free 5/day and Premium 12/day. This conflicts with the planned Free 1/day and proposed Premium 3/day. No live values were changed.
- No Quiz tables, Quiz RPCs or Quiz question records were found.

## Approved product decisions carried forward

- Beginner 10, Intermediate 15, Advanced 20 questions.
- Beginner 100% Beginner; Intermediate either 50/50 or 80/20; Advanced 60–80% Advanced, exactly 20% Intermediate and 0–20% Beginner.
- Curriculum eligibility includes all approved lessons in scope regardless of personal completion.
- Multiple-choice only; no timer; no pass/fail.
- Answers can be changed before submission; correct answers/results are hidden until submit.
- Score and percentage only; completed review includes selected answer, correct answer and explanation.
- Unfinished sessions persist until completion or explicit abandonment, including across local midnight.
- One active session per account; abandonment is free and releases the slot.
- Only successful submission consumes an allowance.
- Course/translation language pair is captured at session start; selector refresh and translation quality QA are required globally.
- Quiz results inform Dashboard and Daily Revision without treating one wrong answer as definitive mastery.

## Technical design recommendation

The new specification proposes a private versioned question bank and private session/question snapshots, narrow authenticated RPCs for availability/start/resume/save/submit/abandon/review, server-side answer evaluation, atomic completion/allowance charging, immutable completed review and deletion integration.

A proposed two-session question pool is 20 Beginner, 24 Intermediate + 16 Beginner, and 32 Advanced + 8 Intermediate + 8 Beginner. A three-session pool would support the proposed Premium 3/day limit without same-day repeats. These figures are explicitly proposals pending owner confirmation of question reuse and Premium limits; they are not yet approved implementation requirements.

## Legal and privacy review

Quiz will add account-linked selected answer IDs, scores, question snapshots and topic performance to current learning records. The current privacy-policy draft says individual answers are not stored; that statement must be updated before public release if Quiz stores selected options.

The preparation reviewed Malaysia PDPA amendments and commencement, JPDP cross-border transfer/DPO/DPIA guidance, GDPR territorial scope and child-consent rules, and US COPPA guidance. Key issues include determining whether Act 709 applies to the operator's actual public-service activity, bilingual privacy notice, Tokyo and other cross-border processing, DPO/DPIA screening for systematic learning-performance monitoring, breach response, data retention/deletion and the intended 16+ global audience. This is planning guidance, not legal advice or compliance certification.

Primary sources are listed in the technical specification and should be rechecked before release.

## Remaining owner confirmations

1. Four options where quality distractors exist, with three allowed when a fourth would be weak.
2. Whether same-day repeats across separate completed sessions should be prohibited.
3. Confirm the proposed two-session hard minimum and three-session Premium quality target after deciding question reuse.
4. Confirm whether Premium Quiz allowance should be 3/day (production currently has 12/day).
5. Confirm nearest-integer percentage rounding.

## Changes and recovery

- Created the technical specification and this archive on \`docs/master-development-record\`.
- Updated the Master Development Record and archive index.
- No application code, content bank, Supabase schema, migration, live allowance value, production user data or deployment was changed.
- Quiz remains Coming Soon. No feature branch was created.
- Next step: owner review of the specification and remaining choices. Only then create the Quiz implementation branch from current \`main\`.


### Frontend integration refinement

The technical specification was refined to recommend a dedicated \`quiz.js\` module with a narrow explicit bridge to the current inline application state. The browser receives only sanitised question/session data; all scoring, answer-key handling and allowance decisions remain server-side. This avoids further expanding the large \`index.html\` while retaining the existing static GitHub Pages architecture.
