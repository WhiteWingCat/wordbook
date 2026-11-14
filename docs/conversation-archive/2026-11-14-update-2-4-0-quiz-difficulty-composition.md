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
| Intermediate | 50–80% Intermediate and 20–50% Beginner. Both 50/50 and 80/20 are explicitly acceptable. |
| Advanced | 60–80% Advanced, exactly 20% Intermediate, and 0–20% Beginner. |

The percentages in every individual quiz must total 100%. Higher-level material must never appear in a lower-level quiz.

## Existing question counts and implementation implications

- Beginner: 10 questions.
- Intermediate: 15 questions.
- Advanced: 20 questions.

The implementation must translate the permitted ratios into whole-question counts. It must define a consistent rounding and balancing approach that never violates the approved ranges or the 100% total. If the approved question bank cannot satisfy the composition, the system must not silently substitute questions from an unauthorised difficulty; it should detect insufficient eligible content and handle it explicitly.

## Curriculum eligibility

The existing curriculum eligibility decision remains: questions may be selected from all approved curriculum lessons/content within the allowed difficulty composition, regardless of whether the individual learner has personally completed those lessons. No user-facing topic selection is required; mixed topics remain randomly selected.

## Effect on planning status

This resolves the previously open question of whether Intermediate and Advanced quizzes may include lower-level material. It does not authorise implementation. No source code, question bank, database migration, production data, live settings or deployment was changed.

Other outstanding Quiz design questions remain as recorded in the Master Development Record.
