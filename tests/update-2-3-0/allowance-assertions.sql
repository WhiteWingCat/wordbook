-- Assertions for the local PostgreSQL compatibility harness.
-- Run after allowance-baseline.sql and the migration draft.

do $$
declare
  v_count integer;
  v_status text;
  v_default text;
begin
  -- Event classification must be explicit; the browser cannot write usage rows.
  select column_default into v_default
  from information_schema.columns
  where table_schema = 'public' and table_name = 'learning_activity_log'
    and column_name = 'event_type';
  if v_default is not null then
    raise exception 'event_type unexpectedly has a default';
  end if;
  if has_table_privilege('authenticated', 'public.learning_activity_log', 'INSERT') then
    raise exception 'Authenticated users still have direct activity-log INSERT privilege';
  end if;
  if has_table_privilege('authenticated', 'public.lesson_practice_results', 'INSERT') then
    raise exception 'Authenticated users still have direct practice-result INSERT privilege';
  end if;
  if has_function_privilege('anon', 'public.complete_permanent_lesson(text,text,text,integer,integer)', 'EXECUTE') then
    raise exception 'Anonymous users can execute the completion RPC';
  end if;
  if not has_function_privilege('authenticated', 'public.complete_permanent_lesson(text,text,text,integer,integer)', 'EXECUTE') then
    raise exception 'Authenticated users cannot execute the completion RPC';
  end if;
  if has_function_privilege('anon', 'public.record_completed_lesson_practice_result(text,text,text,integer,integer)', 'EXECUTE') then
    raise exception 'Anonymous users can execute the replay practice RPC';
  end if;
  if not has_function_privilege('authenticated', 'public.record_completed_lesson_practice_result(text,text,text,integer,integer)', 'EXECUTE') then
    raise exception 'Authenticated users cannot execute the replay practice RPC';
  end if;

  -- Approved limits are installed, including independent daily categories.
  if (select daily_limit from public.learning_plan_limits
      where plan_code = 'free' and activity_type = 'lesson') <> 5 then
    raise exception 'Free permanent lesson limit is not 5';
  end if;
  if (select daily_limit from public.learning_plan_limits
      where plan_code = 'premium' and activity_type = 'lesson') <> 15 then
    raise exception 'Premium permanent lesson limit is not 15';
  end if;
  if (select count(*) from public.learning_plan_limits
      where plan_code = 'free' and activity_type in
        ('daily_topic','daily_application','daily_discovery','daily_revision')
        and daily_limit = 1) <> 4 then
    raise exception 'Free daily category limits are incomplete';
  end if;
  if (select count(*) from public.learning_plan_limits
      where plan_code = 'premium' and activity_type in
        ('daily_topic','daily_application','daily_discovery','daily_revision')
        and daily_limit = 3) <> 4 then
    raise exception 'Premium daily category limits are incomplete';
  end if;

  -- Existing Quiz and Flashcard quotas are deliberately unchanged by 2.3.0.
  if (select daily_limit from public.learning_plan_limits
      where plan_code = 'free' and activity_type = 'quiz') <> 5
     or (select daily_limit from public.learning_plan_limits
      where plan_code = 'free' and activity_type = 'flashcard') <> 5 then
    raise exception 'Free Quiz/Flashcard limits changed unexpectedly';
  end if;
  if (select daily_limit from public.learning_plan_limits
      where plan_code = 'premium' and activity_type = 'quiz') <> 12
     or (select daily_limit from public.learning_plan_limits
      where plan_code = 'premium' and activity_type = 'flashcard') <> 12 then
    raise exception 'Premium Quiz/Flashcard limits changed unexpectedly';
  end if;

  -- Historical progress/log pairs were backfilled according to their status.
  if (select count(*) from public.learning_activity_log
      where user_id = '11111111-1111-4111-8111-111111111111'
        and event_type = 'completed') <> 4 then
    raise exception 'Historical completed lesson events were not backfilled';
  end if;
  if (select count(*) from public.learning_activity_log
      where user_id = '11111111-1111-4111-8111-111111111111'
        and event_type = 'started') <> 2 then
    raise exception 'Historical in-progress lesson events were not backfilled';
  end if;
end;
$$;

-- Normal Free user: the fifth completion succeeds, duplicate retry is free,
-- and a sixth completion fails atomically.
begin;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;
do $$
declare
  v_count integer;
  v_status text;
  v_quota_rejected boolean := false;
  v_in_progress_rejected boolean := false;
begin
  -- Reject null/invalid lesson identity and completion without a started row.
  begin
    perform public.complete_permanent_lesson(null, 'legacy-06', 'sentence-basics', 0, 3);
    raise exception 'Null difficulty unexpectedly passed validation';
  exception when sqlstate '22023' then
    null;
  end;

  begin
    perform public.complete_permanent_lesson('beginner', 'not-started', 'sentence-basics', 0, 3);
    raise exception 'Completion without a started lesson unexpectedly succeeded';
  exception when sqlstate 'P0002' then
    null;
  end;

  perform public.complete_permanent_lesson('beginner', 'legacy-05', 'sentence-basics', 2, 3);
  perform public.complete_permanent_lesson('beginner', 'legacy-05', 'sentence-basics', 2, 3);

  select count(*) into v_count
  from public.learning_activity_log
  where user_id = auth.uid()
    and activity_type = 'lesson'
    and event_type = 'completed';
  if v_count <> 5 then
    raise exception 'Expected exactly five completed lesson events after duplicate retry; got %', v_count;
  end if;

  if (select count(*) from public.lesson_practice_results
      where user_id = auth.uid() and difficulty = 'beginner'
        and lesson_id = 'legacy-05') <> 1 then
    raise exception 'Lesson completion did not save exactly one aggregate practice result';
  end if;
  if (select topic_id from public.lesson_practice_results
      where user_id = auth.uid() and difficulty = 'beginner'
        and lesson_id = 'legacy-05') <> 'sentence-basics'
     or (select correct_count from public.lesson_practice_results
      where user_id = auth.uid() and difficulty = 'beginner'
        and lesson_id = 'legacy-05') <> 2
     or (select question_count from public.lesson_practice_results
      where user_id = auth.uid() and difficulty = 'beginner'
        and lesson_id = 'legacy-05') <> 3 then
    raise exception 'Aggregate practice result values were not saved correctly';
  end if;

  v_quota_rejected := false;
  begin
    perform public.complete_permanent_lesson('beginner', 'legacy-06', 'sentence-basics', 2, 3);
  exception when sqlstate 'P0001' then
    v_quota_rejected := true;
  end;
  if not v_quota_rejected then
    raise exception 'Expected the sixth completion to be rejected';
  end if;

  select status into v_status
  from public.lesson_progress
  where user_id = auth.uid() and lesson_id = 'legacy-06';
  if v_status <> 'in_progress' then
    raise exception 'Quota rejection did not roll back lesson completion';
  end if;

  if (select count(*) from public.lesson_practice_results
      where user_id = auth.uid() and difficulty = 'beginner'
        and lesson_id = 'legacy-06') <> 0 then
    raise exception 'Quota-rejected completion incorrectly saved a practice result';
  end if;

  -- A direct REST-style update cannot bypass the completion RPC.
  begin
    update public.lesson_progress
    set status = 'completed', completed_at = now()
    where user_id = auth.uid() and lesson_id = 'legacy-06';
    raise exception 'Direct lesson completion unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;

  -- Historical completed lessons can receive one aggregate replay summary
  -- without consuming another lesson allowance.
  if public.record_completed_lesson_practice_result(
       'beginner','legacy-01','sentence-basics',1,3
     ) is not true then
    raise exception 'First replay practice summary was not recorded';
  end if;
  if public.record_completed_lesson_practice_result(
       'beginner','legacy-01','sentence-basics',3,3
     ) is not false then
    raise exception 'Duplicate replay practice summary was not idempotent';
  end if;
  if (select count(*) from public.lesson_practice_results
      where user_id = auth.uid() and lesson_id = 'legacy-01') <> 1 then
    raise exception 'Historical lesson replay did not save exactly one practice summary';
  end if;

  begin
    perform public.record_completed_lesson_practice_result(
      'beginner','legacy-06','sentence-basics',1,3
    );
  exception when sqlstate 'P0002' then
    v_in_progress_rejected := true;
  end;
  if not v_in_progress_rejected then
    raise exception 'Replay practice summary was accepted for an in-progress lesson';
  end if;

  -- Browser roles cannot forge aggregate practice history.
  begin
    insert into public.lesson_practice_results(
      user_id, difficulty, lesson_id, topic_id, correct_count, question_count
    ) values (auth.uid(), 'beginner', 'forged', 'sentence-basics', 3, 3);
    raise exception 'Direct practice-result INSERT unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;

  -- Browser roles can no longer insert authoritative allowance events.
  begin
    insert into public.learning_activity_log(user_id, activity_type, language_code, event_type)
    values (auth.uid(), 'lesson', 'en', 'completed');
    raise exception 'Direct activity-log insert unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
commit;

-- The private test exemption applies to permanent lessons, but not daily categories.
begin;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
set local role authenticated;
do $$
declare
  i integer;
  v_count integer;
begin
  for i in 1..6 loop
    perform public.complete_permanent_lesson('beginner', 'exempt-' || lpad(i::text, 2, '0'), 'sentence-basics', 3, 3);
  end loop;

  select count(*) into v_count
  from public.learning_activity_log
  where user_id = auth.uid()
    and activity_type = 'lesson'
    and event_type = 'completed';
  if v_count <> 6 then
    raise exception 'Lesson-only test exemption did not permit all six test completions';
  end if;
end;
$$;
commit;

-- Simulate trusted server-side daily completion writes. Each category has its
-- own Free allowance; the test exemption must not exempt daily categories.
begin;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
do $$
declare
  v_count integer;
  v_quota_rejected boolean := false;
begin
  insert into public.learning_activity_log(user_id, activity_type, language_code, event_type)
  values (auth.uid(), 'daily_topic', 'en', 'completed');

  begin
    insert into public.learning_activity_log(user_id, activity_type, language_code, event_type)
    values (auth.uid(), 'daily_topic', 'en', 'completed');
  exception when sqlstate 'P0001' then
    v_quota_rejected := true;
  end;
  if not v_quota_rejected then
    raise exception 'Second Daily Topic completion unexpectedly succeeded';
  end if;

  insert into public.learning_activity_log(user_id, activity_type, language_code, event_type)
  values (auth.uid(), 'daily_revision', 'en', 'completed');

  select count(*) into v_count
  from public.learning_activity_log
  where user_id = auth.uid()
    and activity_type = 'daily_topic'
    and event_type = 'completed';
  if v_count <> 1 then
    raise exception 'Daily Topic limit was not enforced';
  end if;

  if (select count(*) from public.learning_activity_log
      where user_id = auth.uid()
        and activity_type = 'daily_revision'
        and event_type = 'completed') <> 1 then
    raise exception 'Daily Revision did not have an independent allowance';
  end if;
end;
$$;
commit;

-- Premium daily categories allow exactly three completions.
begin;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
do $$
declare
  i integer;
  v_quota_rejected boolean := false;
begin
  for i in 1..3 loop
    insert into public.learning_activity_log(user_id, activity_type, language_code, event_type)
    values (auth.uid(), 'daily_discovery', 'en', 'completed');
  end loop;

  begin
    insert into public.learning_activity_log(user_id, activity_type, language_code, event_type)
    values (auth.uid(), 'daily_discovery', 'en', 'completed');
  exception when sqlstate 'P0001' then
    v_quota_rejected := true;
  end;
  if not v_quota_rejected then
    raise exception 'Fourth Premium Daily Discovery completion unexpectedly succeeded';
  end if;
end;
$$;
commit;


-- Starting and abandoning a permanent lesson is free.
begin;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;
do $$
declare
  v_before integer;
  v_after integer;
begin
  select count(*) into v_before
  from public.learning_activity_log
  where user_id = auth.uid() and activity_type = 'lesson'
    and event_type = 'completed';

  insert into public.lesson_progress(user_id, difficulty, lesson_id, status)
  values (auth.uid(), 'beginner', 'abandoned-test', 'in_progress');

  -- Leaving the row in progress represents an abandoned lesson session.
  select count(*) into v_after
  from public.learning_activity_log
  where user_id = auth.uid() and activity_type = 'lesson'
    and event_type = 'completed';

  if v_after <> v_before then
    raise exception 'Starting/abandoning a lesson consumed a completion allowance';
  end if;
end;
$$;
commit;

-- Premium users can complete 15 permanent lessons, but not a 16th.
insert into public.lesson_progress(user_id, difficulty, lesson_id, status)
select '44444444-4444-4444-8444-444444444444',
       'beginner', 'premium-limit-' || lpad(n::text, 2, '0'), 'in_progress'
from generate_series(1, 16) as n;

begin;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
set local role authenticated;
do $$
declare
  i integer;
  v_status text;
  v_quota_rejected boolean := false;
begin
  for i in 1..15 loop
    perform public.complete_permanent_lesson(
      'beginner', 'premium-limit-' || lpad(i::text, 2, '0'), 'verb-tenses', 3, 3
    );
  end loop;

  begin
    perform public.complete_permanent_lesson('beginner', 'premium-limit-16', 'verb-tenses', 3, 3);
  exception when sqlstate 'P0001' then
    v_quota_rejected := true;
  end;
  if not v_quota_rejected then
    raise exception 'Premium 16th permanent lesson unexpectedly succeeded';
  end if;

  select status into v_status
  from public.lesson_progress
  where user_id = auth.uid() and lesson_id = 'premium-limit-16';
  if v_status <> 'in_progress' then
    raise exception 'Premium quota rejection did not preserve the 16th lesson as in progress';
  end if;

  if (select count(*) from public.learning_activity_log
      where user_id = auth.uid() and activity_type = 'lesson'
        and event_type = 'completed') <> 15 then
    raise exception 'Premium user did not receive exactly 15 permanent lesson completions';
  end if;
end;
$$;
commit;

-- Verify that local-day boundaries use DST-aware IANA timezone conversion:
-- 2026 spring-forward day is 23 hours and fall-back day is 25 hours in New York.
do $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_day_hours numeric;
begin
  v_start := (
    (('2026-03-08 12:00:00-04'::timestamptz
      at time zone 'America/New_York')::date)::timestamp
    at time zone 'America/New_York'
  );
  v_end := (
    ((('2026-03-08 12:00:00-04'::timestamptz
      at time zone 'America/New_York')::date + 1)::timestamp)
    at time zone 'America/New_York'
  );
  v_day_hours := extract(epoch from (v_end - v_start)) / 3600;
  if v_day_hours <> 23 then
    raise exception 'Spring-forward local day was % hours; expected 23', v_day_hours;
  end if;

  v_start := (
    (('2026-11-01 12:00:00-05'::timestamptz
      at time zone 'America/New_York')::date)::timestamp
    at time zone 'America/New_York'
  );
  v_end := (
    ((('2026-11-01 12:00:00-05'::timestamptz
      at time zone 'America/New_York')::date + 1)::timestamp)
    at time zone 'America/New_York'
  );
  v_day_hours := extract(epoch from (v_end - v_start)) / 3600;
  if v_day_hours <> 25 then
    raise exception 'Fall-back local day was % hours; expected 25', v_day_hours;
  end if;
end;
$$;


-- Daily Topic: start/resume/abandon are free, first completion is charged once,
-- replaying completed content is free, and a new item is blocked after quota.
begin;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;
do $$
declare
  v_first uuid;
  v_resumed uuid;
  v_second uuid;
  v_replayed uuid;
  v_before integer;
  v_after integer;
  v_quota_rejected boolean := false;
  v_session_timezone text;
  v_session_date date;
begin
  select count(*) into v_before
  from public.learning_activity_log
  where user_id = auth.uid() and activity_type = 'daily_topic'
    and event_type = 'completed';

  select id into v_first
  from public.start_daily_activity_session(
    'daily_topic','topic-day-1','sentence-basics','beginner','daily'
  );
  select id into v_resumed
  from public.start_daily_activity_session(
    'daily_topic','another-content-id','sentence-basics','beginner','daily'
  );
  if v_first <> v_resumed then
    raise exception 'Starting the same category twice did not resume the open session';
  end if;

  select timezone, local_date into v_session_timezone, v_session_date
  from public.daily_activity_sessions where id = v_first;
  if v_session_timezone <> 'Asia/Kuala_Lumpur'
     or v_session_date <> (now() at time zone 'Asia/Kuala_Lumpur')::date then
    raise exception 'Daily session did not snapshot the saved IANA timezone and local date';
  end if;

  select count(*) into v_after
  from public.learning_activity_log
  where user_id = auth.uid() and activity_type = 'daily_topic'
    and event_type = 'completed';
  if v_after <> v_before then
    raise exception 'Starting/resuming a daily session consumed allowance';
  end if;

  update public.daily_activity_sessions
  set status = 'abandoned'
  where id = v_first;

  select id into v_second
  from public.start_daily_activity_session(
    'daily_topic','topic-day-1','sentence-basics','beginner','daily'
  );
  if v_second = v_first then
    raise exception 'An abandoned session was not replaced by a fresh session';
  end if;

  perform public.complete_daily_activity_session(v_second, null, null);
  perform public.complete_daily_activity_session(v_second, null, null);

  select count(*) into v_after
  from public.learning_activity_log
  where user_id = auth.uid() and activity_type = 'daily_topic'
    and event_type = 'completed';
  if v_after <> v_before + 1 then
    raise exception 'Daily Topic completion was not charged exactly once';
  end if;

  select id into v_replayed
  from public.start_daily_activity_session(
    'daily_topic','topic-day-1','sentence-basics','beginner','daily'
  );
  if v_replayed <> v_second then
    raise exception 'Replaying completed daily content did not return the original completed session';
  end if;

  begin
    perform public.start_daily_activity_session(
      'daily_topic','topic-day-2','sentence-basics','beginner','daily'
    );
  exception when sqlstate 'P0001' then
    v_quota_rejected := true;
  end;
  if not v_quota_rejected then
    raise exception 'A second Free Daily Topic session was started after its completion limit';
  end if;

  -- Direct REST-style session creation cannot forge a date/timezone or bypass the start RPC.
  begin
    insert into public.daily_activity_sessions(
      user_id, activity_type, content_id, local_date, timezone, status
    ) values (auth.uid(), 'daily_topic', 'forged-session', date '2000-01-01', 'Pacific/Honolulu', 'in_progress');
    raise exception 'Direct daily session INSERT unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
commit;

-- Daily Application requires valid aggregate outcomes; no raw answers are stored.
begin;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;
do $$
declare
  v_session uuid;
  v_invalid_rejected boolean := false;
begin
  select id into v_session
  from public.start_daily_activity_session(
    'daily_application','application-day-1','sentence-basics','beginner','daily'
  );

  begin
    perform public.complete_daily_activity_session(v_session, null, null);
  exception when sqlstate '22023' then
    v_invalid_rejected := true;
  end;
  if not v_invalid_rejected then
    raise exception 'Daily Application accepted missing aggregate result counts';
  end if;

  -- Direct completion is blocked; only the completion RPC may finish the session.
  begin
    update public.daily_activity_sessions
    set status = 'completed', completed_at = now(),
        correct_count = 2, question_count = 3
    where id = v_session;
    raise exception 'Direct daily session completion unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;

  perform public.complete_daily_activity_session(v_session, 2, 3);
  if (select correct_count from public.daily_activity_sessions where id = v_session) <> 2
     or (select question_count from public.daily_activity_sessions where id = v_session) <> 3 then
    raise exception 'Daily Application aggregate outcome was not saved correctly';
  end if;
end;
$$;
commit;

-- Daily session rows are isolated by owner RLS across accounts.
begin;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
set local role authenticated;
do $$
declare
  v_foreign_session uuid;
begin
  select id into v_foreign_session
  from public.start_daily_activity_session(
    'daily_application','private-account-session','sentence-basics','beginner','daily'
  );
  perform set_config('test.foreign_session_id', v_foreign_session::text, false);
end;
$$;
commit;

begin;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;
do $$
declare
  v_foreign_session uuid := current_setting('test.foreign_session_id')::uuid;
  v_visible integer;
begin
  select count(*) into v_visible
  from public.daily_activity_sessions
  where id = v_foreign_session;
  if v_visible <> 0 then
    raise exception 'A user can read another account daily session';
  end if;

  update public.daily_activity_sessions
  set status = 'abandoned'
  where id = v_foreign_session;

  select count(*) into v_visible
  from public.daily_activity_sessions
  where id = v_foreign_session and status = 'in_progress';
  if v_visible <> 0 then
    raise exception 'A user can modify another account daily session';
  end if;
end;
$$;
commit;

-- Preferences are owner-scoped and disabled activities cannot be newly started.
begin;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;
do $$
declare
  v_rejected boolean := false;
begin
  if not (select daily_topic_enabled and daily_application_enabled
          and daily_discovery_enabled and daily_revision_enabled
          from public.user_preferences where user_id = auth.uid()) then
    raise exception 'Daily activity preferences do not default to all enabled';
  end if;

  update public.user_preferences
  set daily_discovery_enabled = false
  where user_id = auth.uid();

  begin
    perform public.start_daily_activity_session(
      'daily_discovery','discovery-day-1',null,null,'daily'
    );
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'A disabled daily activity was started';
  end if;

  update public.user_preferences
  set daily_discovery_enabled = true
  where user_id = auth.uid();
end;
$$;
commit;

-- Premium Daily Discovery allows three distinct completions; the fourth is blocked.
begin;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
set local role authenticated;
do $$
declare
  i integer;
  v_session uuid;
  v_rejected boolean := false;
begin
  for i in 1..3 loop
    select id into v_session
    from public.start_daily_activity_session(
      'daily_revision','premium-revision-' || i,'verb-tenses','intermediate','adaptive_revision'
    );
    perform public.complete_daily_activity_session(v_session, 2, 3);
  end loop;

  begin
    perform public.start_daily_activity_session(
      'daily_revision','premium-revision-4','verb-tenses','intermediate','adaptive_revision'
    );
  exception when sqlstate 'P0001' then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'Premium fourth Daily Discovery session was not blocked';
  end if;
end;
$$;
commit;
