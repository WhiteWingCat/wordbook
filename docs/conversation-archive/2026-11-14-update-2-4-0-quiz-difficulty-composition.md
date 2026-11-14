# SwiftDictionary Update 2.4.0 — Quiz difficulty composition

**Date:** 2026-11-14  
**Repository:** WhiteWingCat/wordbook  
**Documentation branch:** `docs/master-development-record`  
**Status:** Planning decision only; no application or production changes

## Owner-confirmed question ratios

The owner wants higher-level quizzes to include some lower-level material for reinforcement and variety, while preserving the selected difficulty as the dominant focus.

| Selected Quiz difficulty | Question composition |
|---|---|
| Beginner | 100% Beginner |
| Intermediate | Either 50% Intermediate / 50% Beginner or 80% Intermediate / 20% Beginner. These are the two approved mixes; do not assume every ratio between them is approved. |
| Advanced | 60–80% Advanced, exactly 20% Intermediate, and 0–20% Beginner. |

The percentages in every individual quiz must total 100%. Higher-level material must never appear in a lower-level quiz.

## Existing question counts and implementation implications

- Beginner: 10 questions.
- Intermediate: 15 questions.
- Advanced: 20 questions.

The implementation must translate the permitted ratios into whole-question counts. For 15-question Intermediate quizzes, 80/20 maps exactly to 12 Intermediate and 3 Beginner questions; 50/50 requires a balanced 7/8 split, alternating which level gets the extra question across quizzes to avoid systematic bias. For 20-question Advanced quizzes, Intermediate is exactly 4 questions, Beginner is 0–4, and Advanced fills the remaining 16–12 questions. Beginner quizzes contain 10 Beginner questions. The implementation must never violate the 100% total or use an unapproved mix. If the approved question bank cannot satisfy the composition, the system must not silently substitute questions from an unauthorised difficulty; it should detect insufficient eligible content and handle it explicitly.

## Curriculum eligibility

The existing curriculum eligibility decision remains: questions may be selected from all approved curriculum lessons/content within the allowed difficulty composition, regardless of whether the individual learner has personally completed those lessons. No user-facing topic selection is required; mixed topics remain randomly selected.

## Effect on planning status

This resolves the previously open question of whether Intermediate and Advanced quizzes may include lower-level material. It does not authorise implementation. No source code, question bank, database migration, production data, live settings or deployment was changed.

Other outstanding Quiz design questions remain as recorded in the Master Development Record.
