-- Assertions for the local PostgreSQL compatibility harness.
-- Run after allowance-baseline.sql and the migration draft.

do $$
declare
  v_count integer;
  v_status text;
begin
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
