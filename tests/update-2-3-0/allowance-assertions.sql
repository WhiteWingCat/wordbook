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
  if has_function_privilege('anon', 'public.complete_permanent_lesson(text,text)', 'EXECUTE') then
    raise exception 'Anonymous users can execute the completion RPC';
  end if;
  if not has_function_privilege('authenticated', 'public.complete_permanent_lesson(text,text)', 'EXECUTE') then
    raise exception 'Authenticated users cannot execute the completion RPC';
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
begin
  perform public.complete_permanent_lesson('beginner', 'legacy-05');
  perform public.complete_permanent_lesson('beginner', 'legacy-05');

  select count(*) into v_count
  from public.learning_activity_log
  where user_id = auth.uid()
    and activity_type = 'lesson'
    and event_type = 'completed';
  if v_count <> 5 then
    raise exception 'Expected exactly five completed lesson events after duplicate retry; got %', v_count;
  end if;

  begin
    perform public.complete_permanent_lesson('beginner', 'legacy-06');
    raise exception 'Expected the sixth completion to be rejected';
  exception when sqlstate 'P0001' then
    null;
  end;

  select status into v_status
  from public.lesson_progress
  where user_id = auth.uid() and lesson_id = 'legacy-06';
  if v_status <> 'in_progress' then
    raise exception 'Quota rejection did not roll back lesson completion';
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
    perform public.complete_permanent_lesson('beginner', 'exempt-' || lpad(i::text, 2, '0'));
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
begin
  insert into public.learning_activity_log(user_id, activity_type, language_code, event_type)
  values (auth.uid(), 'daily_topic', 'en', 'completed');

  begin
    insert into public.learning_activity_log(user_id, activity_type, language_code, event_type)
    values (auth.uid(), 'daily_topic', 'en', 'completed');
    raise exception 'Second Daily Topic completion unexpectedly succeeded';
  exception when sqlstate 'P0001' then
    null;
  end;

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
begin
  for i in 1..3 loop
    insert into public.learning_activity_log(user_id, activity_type, language_code, event_type)
    values (auth.uid(), 'daily_discovery', 'en', 'completed');
  end loop;

  begin
    insert into public.learning_activity_log(user_id, activity_type, language_code, event_type)
    values (auth.uid(), 'daily_discovery', 'en', 'completed');
    raise exception 'Fourth Premium Daily Discovery completion unexpectedly succeeded';
  exception when sqlstate 'P0001' then
    null;
  end;
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
begin
  for i in 1..15 loop
    perform public.complete_permanent_lesson(
      'beginner', 'premium-limit-' || lpad(i::text, 2, '0')
    );
  end loop;

  begin
    perform public.complete_permanent_lesson('beginner', 'premium-limit-16');
    raise exception 'Premium 16th permanent lesson unexpectedly succeeded';
  exception when sqlstate 'P0001' then
    null;
  end;

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
