# SwiftDictionary Update 2.4.0 — Quiz planning decisions and language refresh QA

**Date:** 2026-11-14  
**Repository:** [WhiteWingCat/wordbook](https://github.com/WhiteWingCat/wordbook)  
**Documentation branch:** `docs/master-development-record`  
**Production baseline:** Update 2.3.3, merged to `main` as `90dc73a9b65fc3af713fefab4955057026089b96`  
**Status:** Planning only; no Quiz implementation or production changes

## Purpose

Record the owner's final decisions on three open Quiz interaction questions and establish a broader quality rule for course and translation selection across SwiftDictionary.

## Confirmed Quiz decisions

1. **Lesson eligibility — curriculum.** Quiz questions may be drawn from all approved curriculum lessons within the selected difficulty, regardless of whether the individual learner has personally completed those lessons. The content must still belong to the approved curriculum and selected difficulty. Exact cumulative mapping between Beginner, Intermediate and Advanced remains open.
2. **Timer — none.** Quiz has no countdown or time limit and introduces no time pressure.
3. **Answer navigation — change.** Learners may move between questions and revise selections until final submission. Once submitted, answers are locked and the result is read-only.

These decisions supplement the existing 2.4.0 planning decisions recorded in Section 28 of the Master Development Record. They do not authorise implementation.

## Standing course/translation refresh and translation QA rule

The owner requested a general rule, not a Quiz-specific feature:

- Changing the learning-course language or translation-language selection must refresh the current relevant page and all dependent content. The learner must not have to navigate away and return to see the updated selection.
- Verify that lesson/question text, answer choices where applicable, explanations, feedback, labels, status text and all other language-dependent UI update together. Check for stale strings and mixed-language content.
- Test both selectors, changes between available values, switching back, and changes made while viewing learning content.
- Translation validation must assess correctness, completeness and contextual appropriateness for the selected course/translation pair. A changed language label or partial string replacement does not pass.
- A new session uses the newly selected pair. An existing active session retains the pair captured at its start, unless a separately designed and tested transition is introduced.
- Add explicit selector-refresh and translation-quality checks to Lessons, Quiz, Flashcards and future language-aware feature regression tests.

## Existing Quiz scope retained

The earlier planning decisions remain in force: multiple-choice only for 2.4.0; fill-in-the-blank deferred; Beginner 10, Intermediate 15 and Advanced 20 questions; mixed topics without user-facing category selection; answer order fixed for the session; correct answers and feedback withheld until submission; unfinished progress resumable; one active session per account; completed review is read-only; free allowance one completed quiz per local day and proposed Premium allowance three; and explanations/feedback follow the selected translation language.

## Remaining design questions

- Exact cumulative mapping of content across difficulty levels.
- Handling an active unfinished session across local-midnight allowance reset, content retirement, or preference changes (while preserving the session's captured language pair).
- Whether results have a pass threshold or only score/percentage and per-question review; no pass mark is approved.
- Exact server-side uniqueness and allowance enforcement, including cloned/duplicate session prevention.
- Minimum versioned result snapshot needed for completed review after question-catalogue changes.
- Sampling balance when the approved question bank is limited.

## Legal, privacy and implementation safeguards

- Perform the standing Malaysia PDPA and international privacy/legal planning review before implementation; this archive is planning guidance, not legal advice or a compliance certification.
- Inspect current source, live schema, existing allowance RPCs, limits and ledger before designing migrations. Do not assume Quiz limits are configured merely because an activity type exists.
- Keep correct-answer keys server-side until submission and enforce session ownership/one-active-session rules server-side.
- Minimise stored learner data and align Quiz history with learning-history deletion without resetting the separate allowance ledger.
- Preserve account isolation, shared-device account switching, timezone-based resets and unlimited free dictionary search.
- Do not apply production migrations, change production data, merge application code or deploy without explicit owner approval.

## Implementation and validation status

No application code, question bank, database migration, production setting or live deployment was changed in this session. Quiz remains Coming Soon. The next step is to continue planning the open design questions; implementation requires separate explicit authorisation and the normal feature-branch, legal/privacy, source/schema review and validation process.


## Additional owner decision — difficulty progression and question ratios

The owner confirmed that higher-level quizzes may include material from lower difficulty levels to reinforce learning and improve variety:

| Selected Quiz difficulty | Composition |
|---|---|
| Beginner | 100% Beginner |
| Intermediate | Either 50% Intermediate / 50% Beginner or 80% Intermediate / 20% Beginner. These are the two approved mixes. |
| Advanced | 60–80% Advanced, exactly 20% Intermediate, and 0–20% Beginner |

All percentages total 100%; no higher-level material appears in a lower-level quiz. Existing session lengths are Beginner 10, Intermediate 15 and Advanced 20 questions. For a 15-question Intermediate quiz, 80/20 is exactly 12/3. A 50/50 split cannot be exact with an odd question count, so use 7/8 and alternate which level gets the extra question across quizzes. For 20-question Advanced quizzes, Intermediate is exactly 4 questions, Beginner is 0–4, and Advanced fills the remaining 16–12. Beginner quizzes contain 10 Beginner questions.

Question selection remains curriculum-wide within the allowed difficulty composition, regardless of the learner's personal lesson-completion history. Do not silently substitute out-of-scope questions if the bank is insufficient.

No code, question content, database migration, production data or live deployment was changed.
