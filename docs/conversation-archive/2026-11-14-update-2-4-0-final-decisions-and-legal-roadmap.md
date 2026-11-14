# SwiftDictionary Update 2.4.0 — final Quiz decisions and legal roadmap (2026-11-14)

## Purpose

This archive records the owner's final Quiz decisions, the technical baseline inspection, and the proposed later legal-documentation milestone. It is a summary of the development discussion, not a verbatim transcript.

## Owner-confirmed Quiz decisions

- Exactly four answer options per question: one correct answer and three strong, plausible distractors. Reject questions that cannot meet this quality standard; do not publish a weak fourth option.
- Avoid repeating any question for the same account during the same effective local allowance day, across sessions and difficulty levels.
- Avoid repeating the same complete quiz. The individual-question non-reuse rule makes a repeated sequence impossible within the day.
- A started session reserves its issued questions for that local day even if the learner abandons it. Abandonment remains free and does not consume completion allowance.
- Hard question-bank minimum: two complete sessions per selected difficulty.
- Preferred question-bank target: three complete sessions per selected difficulty.
- Free allowance: one successfully completed Quiz per local day.
- Premium allowance: three successfully completed Quizzes per local day (confirmed 1:3 ratio).
- Display percentage rounded to the nearest whole percentage, retaining exact score and question-count values.

### Question-bank capacity

| Selected difficulty | Two-session minimum | Three-session target |
|---|---|---|
| Beginner | 20 Beginner | 30 Beginner |
| Intermediate | 24 Intermediate + 16 Beginner | 36 Intermediate + 24 Beginner |
| Advanced | 32 Advanced + 8 Intermediate + 8 Beginner | 48 Advanced + 12 Intermediate + 12 Beginner |

These counts are shared source-difficulty pools. A higher-difficulty quiz can consume lower-difficulty questions under the approved ratios, so the availability service must check remaining unseen questions across all difficulty levels before starting. If exact composition, curriculum coverage and topic diversity cannot be satisfied, the session must remain unavailable; never repeat, shorten or substitute out-of-scope questions.

## Previously approved requirements retained

- Beginner 10 questions; Intermediate 15; Advanced 20.
- Beginner 100% Beginner.
- Intermediate either 50% Intermediate / 50% Beginner or 80% Intermediate / 20% Beginner.
- Advanced 60–80% Advanced, exactly 20% Intermediate and 0–20% Beginner.
- Questions may come from all approved lessons in the selected difficulty's eligible curriculum regardless of the learner's personal lesson completion.
- No timer; no pass/fail; show score and percentage.
- Answers can be changed until submission; correct answers and explanations remain hidden until submission.
- Unfinished sessions persist until completion or explicit abandonment; one active session per account.
- Only successful submission consumes allowance. Resume, abandon and completed review are free.
- Course/translation pair is captured at session start. Language changes refresh dependent content immediately for new sessions, while existing sessions preserve their captured language pair.
- Dashboard and Daily Revision may use aggregate topic-level quiz outcomes, but one wrong answer is not definitive evidence of weakness.

## Read-only implementation baseline

The connected Supabase project was inspected read-only:

- PostgreSQL 17.11, Tokyo region.
- 18 applied migrations through the six Update 2.3.0 migrations.
- Existing activity log and private allowance ledger already recognise `quiz`.
- Production Quiz allowance settings remain Free 5/day and Premium 12/day. No values were changed. A reviewed migration must set Free 1/day and Premium 3/day before Quiz is enabled.
- No Quiz question bank, session table, Quiz RPC or approved Quiz questions exist.
- Existing completion trigger uses the server-owned effective timezone/plan and charges completed events.
- Personal testing exemption is lesson-only.
- Existing learning-history deletion must be extended to Quiz history without deleting the private allowance ledger.
- Main still renders Quiz as Coming Soon. Existing Lesson practice questions are not a substitute for a separately authored/reviewed Quiz bank.

No application source, production schema, allowance setting, production data, merge or deployment was changed during this planning session.

## Legal and privacy roadmap

The existing privacy-policy draft is not approved for publication. Quiz adds selected answer IDs, question snapshots, scores and topic performance, so the notice and retention/deletion disclosures must be updated before release. Mandatory Malaysia and international privacy review remains a Quiz release gate.

The owner proposed a broader separate milestone after Flashcards reaches main:

**Proposed Update 2.6.0 — Legal, Privacy & Terms Foundation.**

Candidate areas to scope later:
- Terms of Service/Use and service rules.
- Privacy Notice, data categories, purposes, retention, user rights, access/correction/deletion and contact route.
- Third-party processors, hosting, cross-border processing and cookies/local storage disclosures as applicable.
- Content ownership, licensing, attribution and acceptable-use rules.
- Educational-content disclaimers and limitations.
- Availability, account suspension/termination and liability wording, subject to legal review.
- If paid Premium is introduced: pricing, billing, renewal, cancellation, refunds, taxes and consumer disclosures.

This is a deferred planning item, not a legal opinion or compliance certification. Its scope and legal requirements must be researched and approved closer to the milestone.

## Changes and recovery

- Updated `docs/UPDATE-2.4.0-QUIZ-TECHNICAL-SPECIFICATION.md` with all confirmed rules.
- Updated `docs/MASTER-DEVELOPMENT-RECORD.md` with the final decisions, current baseline and proposed legal roadmap.
- Updated the conversation archive index.
- Documentation remains on `docs/master-development-record`.
- Next step: create the Quiz implementation branch from current `main`, then implement and validate in isolation. Do not apply production migrations, change live allowance values, merge or deploy without explicit owner approval.
