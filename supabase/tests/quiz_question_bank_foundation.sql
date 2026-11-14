-- SwiftDictionary Update 2.4.0 — Quiz question-bank foundation tests.
-- Run with: supabase test db
-- The test transaction rolls back its synthetic content.
begin;

select plan(13);

select has_table('private', 'quiz_question_bank',
  'Private versioned Quiz question bank exists');
select has_table('private', 'quiz_sessions',
  'Private Quiz session table exists');
select has_table('private', 'quiz_session_questions',
  'Private session question and issued-question ledger exists');

select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c
   join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'private' and c.relname = 'quiz_question_bank'),
  'Question bank has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c
   join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'private' and c.relname = 'quiz_sessions'),
  'Quiz sessions have RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c
   join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'private' and c.relname = 'quiz_session_questions'),
  'Issued questions have RLS enabled'
);

select ok(not pg_catalog.has_table_privilege('anon',
  'private.quiz_question_bank', 'SELECT'),
  'Anonymous role cannot read question bank');
select ok(not pg_catalog.has_table_privilege('authenticated',
  'private.quiz_question_bank', 'SELECT'),
  'Authenticated role cannot read answer keys directly');
select ok(not pg_catalog.has_table_privilege('authenticated',
  'private.quiz_sessions', 'SELECT'),
  'Authenticated role cannot read private session records directly');

select has_index('private', 'quiz_session_questions',
  'quiz_session_questions_no_same_day_repeat',
  'Unique user/day/question index exists');

select lives_ok($sql$
  insert into private.quiz_question_bank (
    question_id, revision, learning_language_code,
    translation_language_code, source_lesson_id, topic_id, difficulty,
    prompt_learning, prompt_translation, options, correct_option_id,
    explanation_learning, explanation_translation, status
  ) values (
    'test-foundation-question', 1, 'en', 'zh',
    'test-source-lesson', 'test-topic', 'beginner',
    'Choose the correct greeting.', '选择正确的问候语。',
    '[
      {"id":"a","learning_text":"Hello","translation_text":"你好"},
      {"id":"b","learning_text":"Yesterday","translation_text":"昨天"},
      {"id":"c","learning_text":"Quickly","translation_text":"快速地"},
      {"id":"d","learning_text":"Blue","translation_text":"蓝色"}
    ]'::jsonb,
    'a', 'Hello is a greeting.', 'Hello 是问候语。', 'approved'
  );
$sql$, 'A complete four-option bilingual question can be approved');

select ok(
  (select approved_at is not null
   from private.quiz_question_bank
   where question_id = 'test-foundation-question' and revision = 1),
  'Approval timestamp is assigned by the database trigger'
);

select throws_ok($sql$
  insert into private.quiz_question_bank (
    question_id, revision, learning_language_code,
    translation_language_code, source_lesson_id, topic_id, difficulty,
    prompt_learning, prompt_translation, options, correct_option_id,
    explanation_learning, explanation_translation, status
  ) values (
    'test-three-option-question', 1, 'en', 'zh',
    'test-source-lesson', 'test-topic', 'beginner',
    'This must fail.', '此题必须失败。',
    '[
      {"id":"a","learning_text":"One","translation_text":"一"},
      {"id":"b","learning_text":"Two","translation_text":"二"},
      {"id":"c","learning_text":"Three","translation_text":"三"}
    ]'::jsonb,
    'a', 'Explanation.', '解释。', 'draft'
  );
$sql$, '23514', null,
  'A question with fewer than four options is rejected');

select * from finish();
rollback;
