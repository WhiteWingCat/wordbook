# SwiftDictionary Update 2.4.0 — Quiz final pre-development decisions

**Date:** 2026-11-14  
**Repository:** WhiteWingCat/wordbook  
**Documentation branch:** `docs/master-development-record`  
**Status:** Owner-approved planning decisions; no application or production changes

## Owner approval

The owner explicitly approved all three recommendations from the pre-development review.

### 1. Scoring

- Show the completed Quiz score and percentage.
- Do not use a pass/fail result or passing threshold in Update 2.4.0.
- Preserve per-question review, including the learner's selected answer, correct answer and explanation.
- Use performance to inform revision recommendations without treating one result as definitive mastery.

### 2. Unfinished-session persistence

- Preserve unfinished sessions until completion or explicit learner abandonment.
- Do not automatically expire a session at local midnight or when the daily allowance resets.
- Resuming is free and does not consume another allowance.
- Explicit abandonment releases the account's one-active-session slot and consumes no allowance.
- Keep the session account-owned and preserve its original difficulty, question/answer order and language pair.
- Catalogue changes must not silently mutate an active session; use stable/versioned references or an equivalent reviewed snapshot.

### 3. Minimum question-bank availability

- A difficulty cannot be offered as available or started until its approved bank meets a defined minimum-content requirement.
- Evaluate the bank against session length, approved difficulty composition, distinct questions within a session, topic coverage and supported course/translation language pair.
- Detect insufficiency before session creation. Never shorten the quiz, violate approved ratios, repeat a question within the same session or silently substitute out-of-scope content.
- The numeric threshold remains to be set after inspecting the approved question inventory and sampling/reuse policy. Document and test the threshold before enabling each difficulty.
- A difficulty with insufficient content must be unavailable with a clear explanation until enough approved material is added.

## Effect on planning status

These approvals resolve the three product-level questions from the pre-development review. Technical design still needs to define and verify the numeric content thresholds based on the actual question inventory.

No application source, question bank, Supabase schema or migration, production data, allowance setting or deployment was changed. Production remains Update 2.3.3; Quiz remains Coming Soon.

## Next work

Prepare the implementation specification, inspect the current application and Supabase architecture, complete the mandatory Malaysia/international legal and privacy review, and establish the content availability thresholds before enabling any Quiz difficulty.
