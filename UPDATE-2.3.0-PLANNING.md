# SwiftDictionary Update 2.3.0 — Planning Document

**Status:** Product direction recorded; technical design and implementation not yet approved  
**Milestone:** Update 2.3.0 — Daily Learning Expansion

## 1. Official scope

Update 2.3.0 introduces a daily-learning experience around these roadmap features:

- Daily Topic
- Daily Application
- Daily Discovery
- User-selected daily activities
- Daily Revision
- Weak-topic prioritisation
- Expanded Profile progress statistics

This milestone follows Update 2.2.0 — English Lessons Foundation. Dedicated Quiz and Flashcards experiences remain separate roadmap milestones (Updates 2.4.0 and 2.5.0 respectively); they are not being brought forward into 2.3.0.

## 2. Confirmed product decisions

The owner confirmed the following choices on 2026-11-10:

| Area | Confirmed decision |
|---|---|
| Daily activity presentation | Show all enabled activities together on the Daily Learning page. |
| Daily Revision | Use adaptive revision based on learning performance and spaced review. |
| Daily Discovery | Use a mixture of vocabulary, word origins, expressions, language facts, grammar insights and common mistakes. |

These are product decisions, not implementation approval.

## 3. Feature goals and intended behaviour

### 3.1 Daily Topic

Purpose: introduce a focused learning topic in a short, approachable format.

Potential content:
- A concise explanation of the selected topic.
- Relevant vocabulary and original example sentences.
- Links to related permanent lessons where appropriate.
- Topic-level learning history.

The permanent lesson library remains the structured course. Daily Topic should complement it rather than replace or duplicate it.

### 3.2 Daily Application

Purpose: help users apply concepts rather than only read explanations.

Potential exercise types:
- Sentence construction.
- Selecting an appropriate word or expression.
- Correcting grammar.
- Completing sentences in context.

Questions, answer options, explanations and examples should be original or appropriately licensed. Results should be attributable to a topic so that revision and progress statistics can use them.

### 3.3 Daily Discovery

Purpose: make language learning exploratory and engaging.

Confirmed content direction: mixed content, potentially including:
- Vocabulary and less-common words.
- Word origins and etymology.
- English expressions and idioms.
- Language facts.
- Grammar insights.
- Common language mistakes.

Discovery entries should be concise, accurate and sourced during editorial preparation where factual claims require verification. The initial content approach should favour original writing rather than reproducing third-party articles.

### 3.4 User-selected daily activities

The Daily Learning page should present all activities enabled by the user's preferences together, rather than forcing a single activity recommendation as the only visible choice.

Users should be able to enable or disable individual activity types and change those preferences later. Preferences should be saved to the signed-in user's account and isolated between accounts.

Selecting or viewing an activity should not itself consume a learning allowance. Allowance consumption should occur only when the user starts an activity that qualifies under the existing server-side allowance rules.

The exact default preference values and interaction details remain to be finalised during technical planning.

### 3.5 Daily Revision

Revision should be adaptive rather than relying only on random questions or requiring users to manually assemble every review session.

Potential revision inputs:
- Topics from previously completed lessons.
- Questions answered incorrectly.
- Topic-level practice accuracy.
- Time elapsed since the last review.
- Previous review outcomes.

Suggested prioritisation:
1. Repeatedly missed concepts.
2. Topics with low demonstrated accuracy.
3. Topics due for review under the spaced-review schedule.
4. Other previously learned material for periodic reinforcement.

A single mistake should not be enough to permanently classify a topic as weak. The design should require a reasonable amount of evidence and should adapt as performance changes.

Missing a day must not punish the user or erase progress. Overdue reviews should be handled gracefully.

### 3.6 Weak-topic prioritisation

Weak-topic recommendations should use more than a single score or isolated incorrect answer. Candidate signals include:
- Number of attempts and amount of available evidence.
- Correct and incorrect responses.
- Recent performance compared with earlier performance.
- Time since the topic was last studied or reviewed.
- Improvement or decline over multiple attempts.

The exact calculation, minimum evidence threshold and priority categories remain open for technical/product design. Recommendations should be explainable to the user and should update when new results are recorded.

### 3.7 Expanded Profile statistics

The Profile should retain the existing learning overview and expandable detail sections while adding useful daily-learning information.

Potential additions:
- Daily Topic history and progress.
- Daily Application attempts and performance.
- Daily Discovery history.
- Daily Revision history and upcoming review needs.
- Topics recommended for revision.
- Topic-level improvement over time.

Existing Beginner, Intermediate and Advanced lesson progress must remain intact. Statistics must be based on real recorded activity, avoid double-counting, and remain scoped to the signed-in account.

## 4. Daily dates, timezones and allowances

- Daily activity dates must respect the user's configured IANA timezone.
- Existing daily allowance enforcement remains authoritative and server-side.
- Do not introduce a separate client-only quota mechanism.
- Preserve the existing rule that starting a qualifying new lesson consumes the applicable allowance, while resuming an unfinished lesson or revisiting a completed lesson does not consume another new-lesson allowance.
- Revision of already learned material should not accidentally be treated as a new lesson start. Its allowance treatment must be explicitly defined before implementation.
- Preserve the existing private, account-specific lesson testing exception. It must not expand to other accounts or other activity categories without separate approval.
- Do not change the user's timezone or reset behaviour as a side effect of this milestone.

## 5. Technical investigation required before implementation

Inspect the current main branch and live Supabase schema before proposing migrations or frontend changes. In particular:

1. Trace how Update 2.2.0 creates, resumes, completes and records lessons.
2. Inspect learning_activity_log, lesson_progress, allowance enforcement, timezone handling and related RPCs/triggers.
3. Determine whether existing records identify the lesson, topic, difficulty, activity date and practice outcome sufficiently for the proposed statistics.
4. Identify the minimum additive data model needed for daily assignments, activity preferences, topic-level outcomes and revision scheduling.
5. Review RLS, grants, ownership constraints and account-switching behaviour for every proposed data object.
6. Decide how daily content is selected and kept stable for a user's local day, including what happens when preferences change during that day.
7. Define how activity starts, completion, retries, interrupted sessions and duplicate submissions are handled.
8. Confirm that Profile statistics can be derived without trusting client-calculated values.
9. Propose migration and rollback steps before any database change.
10. Keep the existing Dictionary, Supabase authentication, account switching, saved-word sync, lesson progress and unlimited dictionary search intact.

No schema, RPC, trigger, frontend or production database changes are authorised by this planning document.

## 6. Legal, privacy and content-quality review

A feature-specific legal review is required before implementation and before adding new content sources.

- Prefer original explanations, questions, answer options, examples and discovery entries.
- Do not copy textbook exercises, articles, dictionary definitions, images or other protected material without a suitable licence or permission.
- Record source and licence information for any third-party material that is approved for use.
- Verify factual claims in word-origin and language-discovery content; etymology and usage claims can be uncertain or disputed.
- Review any third-party API or content-provider terms before integration, including attribution, caching, redistribution and commercial-use restrictions.
- Explain the purpose of learning-performance data and collect only what is needed.
- Enforce user-level data isolation through Supabase RLS and server-side checks.
- Do not expose private learning histories or weak-topic profiles to other users.
- Keep dictionary word-grid search free and unlimited; do not subscription-gate it.

The project is currently a free public personal learning project. Any future paid access remains limited to separately planned optional learning features and requires a fresh legal/product review.

## 7. Existing features and constraints to preserve

- Supabase Google authentication.
- Sign-out and account switching on shared devices.
- Per-account saved-word synchronisation with no cross-account overlap.
- Unlimited dictionary word-grid search.
- English and Simplified Chinese course support and translation-language switching.
- Existing lesson library, lesson completion and per-difficulty progress.
- Existing Profile access rules and account preferences.
- User-configured timezone and local-midnight daily reset.
- Server-side daily allowance enforcement and the narrowly scoped personal lesson-testing exception.

## 8. Proposed planning and delivery sequence

This is a proposed order for discussion, not an approved implementation schedule:

1. Complete read-only inspection of the current application and Supabase baseline.
2. Produce a technical design covering data model, user flows, allowance semantics, security, timezone behaviour and migration/rollback.
3. Review feature-specific legal and content requirements.
4. Obtain owner approval of the technical design before coding or database changes.
5. Implement and validate Daily Topic and Daily Application foundations.
6. Implement mixed-content Daily Discovery.
7. Implement adaptive Daily Revision and weak-topic prioritisation.
8. Integrate activity preferences and expanded Profile statistics.
9. Run consolidated regression, security, data-isolation, timezone and browser testing.
10. Prepare one consolidated release after the owner reviews and approves the changes.

Do not create a new release package or deploy to GitHub Pages after each small batch. Keep changes accumulated and validated for one consolidated release. Do not merge or deploy without explicit owner approval.

## 9. Acceptance criteria to refine during technical planning

- All enabled daily activities are visible together on the Daily Learning page.
- Activity preferences persist per account and do not leak across accounts.
- Daily Topic and Daily Application record enough topic-level information to support progress and revision.
- Daily Discovery supports the agreed mixed-content direction and uses properly sourced/licensed content.
- Daily Revision adapts to learning evidence and review timing; it does not punish missed days.
- Weak-topic recommendations require sufficient evidence and respond to new performance.
- Profile statistics reflect actual records, avoid double-counting and remain account-scoped.
- Daily boundaries follow each user's configured timezone.
- Existing allowance rules and the personal testing exception remain correctly scoped.
- Authentication, account switching, saved words, lessons, translation switching and unlimited dictionary search pass regression tests.
- Database access controls prevent one user from reading or changing another user's learning data.
- Owner browser verification is recorded distinctly from any independent automated testing.

## 10. Decisions still open

The following details are intentionally not assumed yet:
- Default enabled activities for a new account.
- Whether Daily Topic and Daily Application share a daily topic or can be selected independently.
- Daily content selection rules and whether users can request another item.
- The minimum evidence threshold and exact weak-topic scoring model.
- Spaced-review intervals and how users can manually review a topic.
- Whether Daily Discovery is informational only or can be saved/bookmarked.
- The exact allowance treatment, if any, for Daily Application and Daily Revision.
- The detailed Profile metrics and visual layout.
- Whether daily content is stored as versioned records or generated/selected dynamically.

These should be resolved through read-only code/database inspection and owner discussion before implementation.
