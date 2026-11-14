-- SwiftDictionary Update 2.4.0 — Quiz question-bank foundation tests.
-- This test script is run by the isolated GitHub Actions PostgreSQL 17 service.
-- It is deliberately dependency-light (no Supabase branch or pgTAP extension).
\set ON_ERROR_STOP on

begin;

do $test$
declare
  v_question private.quiz_question_bank%rowtype;
  v_session_one uuid;
  v_session_two uuid;
  v_user uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  v_day date := date '2026-11-14';
  v_failed boolean;
begin
  -- Schema and security structure.
  if to_regclass('private.quiz_question_bank') is null
     or to_regclass('private.quiz_sessions') is null
     or to_regclass('private.quiz_session_questions') is null then
    raise exception 'Quiz foundation tables are missing';
  end if;

  if not (select relrowsecurity from pg_class where oid='private.quiz_question_bank'::regclass)
     or not (select relrowsecurity from pg_class where oid='private.quiz_sessions'::regclass)
     or not (select relrowsecurity from pg_class where oid='private.quiz_session_questions'::regclass) then
    raise exception 'RLS must be enabled on every private Quiz table';
  end if;

  if has_table_privilege('anon','private.quiz_question_bank','SELECT')
     or has_table_privilege('authenticated','private.quiz_question_bank','SELECT')
     or has_table_privilege('authenticated','private.quiz_sessions','SELECT')
     or has_table_privilege('authenticated','private.quiz_session_questions','SELECT') then
    raise exception 'Direct table read privileges must remain revoked';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='private.quiz_session_questions'::regclass
      and conname='quiz_session_questions_no_same_day_repeat'
      and contype='u'
  ) then
    raise exception 'Same-day question uniqueness constraint is missing';
  end if;

  -- A reviewed bilingual question with four unique options is accepted.
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
  ) returning * into v_question;

  if v_question.approved_at is null then
    raise exception 'Approval timestamp was not assigned by the trigger';
  end if;

  -- Three options must fail the table check.
  v_failed := false;
  begin
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
  exception when check_violation then
    v_failed := true;
  end;
  if not v_failed then
    raise exception 'A three-option question was unexpectedly accepted';
  end if;

  -- Duplicate option IDs must fail the validation trigger.
  v_failed := false;
  begin
    insert into private.quiz_question_bank (
      question_id, revision, learning_language_code,
      translation_language_code, source_lesson_id, topic_id, difficulty,
      prompt_learning, prompt_translation, options, correct_option_id,
      explanation_learning, explanation_translation, status
    ) values (
      'test-duplicate-option-question', 1, 'en', 'zh',
      'test-source-lesson', 'test-topic', 'beginner',
      'This must fail.', '此题必须失败。',
      '[
        {"id":"a","learning_text":"One","translation_text":"一"},
        {"id":"a","learning_text":"Two","translation_text":"二"},
        {"id":"c","learning_text":"Three","translation_text":"三"},
        {"id":"d","learning_text":"Four","translation_text":"四"}
      ]'::jsonb,
      'a', 'Explanation.', '解释。', 'draft'
    );
  exception when check_violation then
    v_failed := true;
  end;
  if not v_failed then
    raise exception 'Duplicate option IDs were unexpectedly accepted';
  end if;

  -- Session snapshots store the selected option order and preserve the answer
  -- key privately. A pre-submission answer selection remains changeable.
  insert into private.quiz_sessions (
    user_id, difficulty, learning_language_code, translation_language_code,
    question_count, source_composition, local_date, timezone
  ) values (
    v_user, 'beginner', 'en', 'zh', 10,
    '{"beginner":10}'::jsonb, v_day, 'Asia/Kuala_Lumpur'
  ) returning id into v_session_one;

  insert into private.quiz_session_questions (
    session_id, user_id, local_date, question_id, question_revision,
    position, option_order, prompt_learning_snapshot,
    prompt_translation_snapshot, options_snapshot, correct_option_id_snapshot,
    explanation_learning_snapshot, explanation_translation_snapshot
  ) values (
    v_session_one, v_user, v_day, v_question.question_id, v_question.revision,
    1, array['c','a','d','b'], v_question.prompt_learning,
    v_question.prompt_translation, v_question.options, v_question.correct_option_id,
    v_question.explanation_learning, v_question.explanation_translation
  );

  update private.quiz_session_questions
  set selected_option_id='b', answered_at=now()
  where session_id=v_session_one and position=1;

  update private.quiz_session_questions
  set selected_option_id='a', answered_at=now()
  where session_id=v_session_one and position=1;

  if (select selected_option_id from private.quiz_session_questions
      where session_id=v_session_one and position=1) <> 'a' then
    raise exception 'Learner could not change an answer before submission';
  end if;

  -- A second bank question allows us to validate the insert-time permutation
  -- guard without attempting to mutate an immutable snapshot.
  insert into private.quiz_question_bank (
    question_id, revision, learning_language_code,
    translation_language_code, source_lesson_id, topic_id, difficulty,
    prompt_learning, prompt_translation, options, correct_option_id,
    explanation_learning, explanation_translation, status
  ) values (
    'test-foundation-question-two', 1, 'en', 'zh',
    'test-source-lesson', 'test-topic', 'beginner',
    'Choose the correct colour.', '选择正确的颜色。',
    '[
      {"id":"a","learning_text":"Red","translation_text":"红色"},
      {"id":"b","learning_text":"Run","translation_text":"跑"},
      {"id":"c","learning_text":"Tomorrow","translation_text":"明天"},
      {"id":"d","learning_text":"Softly","translation_text":"轻轻地"}
    ]'::jsonb,
    'a', 'Red is a colour.', 'Red 是一种颜色。', 'approved'
  );

  v_failed := false;
  begin
    insert into private.quiz_session_questions (
      session_id, user_id, local_date, question_id, question_revision,
      position, option_order, prompt_learning_snapshot,
      prompt_translation_snapshot, options_snapshot, correct_option_id_snapshot,
      explanation_learning_snapshot, explanation_translation_snapshot
    )
    select
      v_session_one, v_user, v_day, q.question_id, q.revision,
      2, array['a','a','c','d'], q.prompt_learning,
      q.prompt_translation, q.options, q.correct_option_id,
      q.explanation_learning, q.explanation_translation
    from private.quiz_question_bank q
    where q.question_id='test-foundation-question-two' and q.revision=1;
  exception when check_violation then
    v_failed := true;
  end;
  if not v_failed then
    raise exception 'An invalid option permutation was unexpectedly accepted';
  end if;

  -- Abandonment keeps issued question IDs reserved for the local day.
  insert into private.quiz_sessions (
    user_id, difficulty, learning_language_code, translation_language_code,
    question_count, source_composition, local_date, timezone,
    status, abandoned_at
  ) values (
    v_user, 'beginner', 'en', 'zh', 10,
    '{"beginner":10}'::jsonb, v_day, 'Asia/Kuala_Lumpur',
    'abandoned', now()
  ) returning id into v_session_two;

  v_failed := false;
  begin
    insert into private.quiz_session_questions (
      session_id, user_id, local_date, question_id, question_revision,
      position, option_order, prompt_learning_snapshot,
      prompt_translation_snapshot, options_snapshot, correct_option_id_snapshot,
      explanation_learning_snapshot, explanation_translation_snapshot
    ) values (
      v_session_two, v_user, v_day, v_question.question_id, v_question.revision,
      1, array['a','b','c','d'], v_question.prompt_learning,
      v_question.prompt_translation, v_question.options, v_question.correct_option_id,
      v_question.explanation_learning, v_question.explanation_translation
    );
  exception when unique_violation then
    v_failed := true;
  end;
  if not v_failed then
    raise exception 'Same question was incorrectly reusable after abandonment on the same day';
  end if;

  raise notice 'Quiz question-bank foundation: all assertions passed';
end;
$test$;

rollback;
