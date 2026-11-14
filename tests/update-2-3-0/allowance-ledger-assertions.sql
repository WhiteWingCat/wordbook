-- Current-window allowance ledger: backfill, privacy separation, quota
-- preservation after history deletion, and next-window rollover.
do $$
declare
  v_used integer;
begin
  select used_count into v_used
  from private.learning_allowance_usage
  where user_id = '88888888-8888-4888-8888-888888888888'
    and activity_type = 'lesson';
  if v_used <> 2 then
    raise exception 'Legacy current-window completion backfill expected 2, got %',v_used;
  end if;
end;
$$;

begin;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
set local role authenticated;
do $$
declare
  v_used integer;
  i integer;
begin
  -- The private table itself must not be readable by browser roles.
  begin
    perform used_count from private.learning_allowance_usage where user_id = auth.uid();
    raise exception 'Authenticated client unexpectedly read the private allowance ledger';
  exception when insufficient_privilege then null;
  end;

  select private.current_learning_allowance_usage(auth.uid(),'lesson','UTC')
  into v_used;
  if v_used <> 2 then
    raise exception 'Scoped usage helper expected 2, got %',v_used;
  end if;

  select usage.used_count into v_used
  from public.get_my_learning_allowance_usage() usage
  where usage.activity_type = 'lesson';
  if v_used <> 2 then
    raise exception 'Dashboard allowance RPC expected own lesson usage 2, got %',v_used;
  end if;

  for i in 1..4 loop
    insert into public.lesson_progress(user_id,difficulty,lesson_id,status)
    values (auth.uid(),'beginner','ledger-test-'||i,'in_progress');
  end loop;

  for i in 1..3 loop
    perform public.complete_permanent_lesson(
      'beginner','ledger-test-'||i,'sentence-basics',2,3
    );
  end loop;

  select private.current_learning_allowance_usage(auth.uid(),'lesson','UTC')
  into v_used;
  if v_used <> 5 then
    raise exception 'Ledger did not reach Free lesson quota of five (got %)',v_used;
  end if;
end;
$$;
commit;

-- Simulate the privileged history-deletion operation. It must not touch ledger.
delete from public.learning_activity_log
where user_id = '88888888-8888-4888-8888-888888888888'
  and activity_type = 'lesson';

begin;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
set local role authenticated;
do $$
declare
  v_used integer;
  v_rejected boolean := false;
begin
  select private.current_learning_allowance_usage(auth.uid(),'lesson','UTC')
  into v_used;
  if v_used <> 5 then
    raise exception 'Deleting history changed the current allowance count to %',v_used;
  end if;

  select usage.used_count into v_used
  from public.get_my_learning_allowance_usage() usage
  where usage.activity_type = 'lesson';
  if v_used <> 5 then
    raise exception 'Dashboard allowance RPC lost usage after history deletion (got %)',v_used;
  end if;

  begin
    perform public.complete_permanent_lesson(
      'beginner','ledger-test-4','sentence-basics',2,3
    );
  exception when sqlstate 'P0001' then v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'History deletion restored a permanent lesson allowance';
  end if;

  -- Daily category completions use the same independent ledger.
  perform public.complete_daily_activity_session(
    (select id from public.start_daily_activity_session(
      'daily_topic','topic-present-perfect-01','verb-tenses','intermediate','daily'
    )),null,null
  );

  select private.current_learning_allowance_usage(auth.uid(),'daily_topic','UTC')
  into v_used;
  if v_used <> 1 then
    raise exception 'Daily Topic ledger did not record exactly one completion';
  end if;

  select usage.used_count into v_used
  from public.get_my_learning_allowance_usage() usage
  where usage.activity_type = 'daily_topic';
  if v_used <> 1 then
    raise exception 'Dashboard allowance RPC did not report the Daily Topic ledger count';
  end if;
end;
$$;
commit;

delete from public.learning_activity_log
where user_id = '88888888-8888-4888-8888-888888888888'
  and activity_type = 'daily_topic';

begin;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
set local role authenticated;
do $$
declare
  v_rejected boolean := false;
begin
  begin
    perform public.start_daily_activity_session(
      'daily_topic','topic-present-routines-01','verb-tenses','beginner','daily'
    );
  exception when sqlstate 'P0001' then v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'Deleting Daily Topic history restored its current-day allowance';
  end if;

  begin
    perform private.current_learning_allowance_usage(
      '11111111-1111-4111-8111-111111111111','lesson','UTC'
    );
    raise exception 'Scoped allowance helper exposed another user count';
  exception when insufficient_privilege then null;
  end;
end;
$$;
commit;

-- Force the stored row into an expired window as the database owner, then
-- verify that the next successful completion starts the new window at one.
update private.learning_allowance_usage
set window_start = window_start - interval '2 days',
    window_end = window_end - interval '2 days',
    used_count = 5
where user_id = '88888888-8888-4888-8888-888888888888'
  and activity_type = 'lesson';

begin;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
set local role authenticated;
do $$
declare
  v_used integer;
begin
  perform public.complete_permanent_lesson(
    'beginner','ledger-test-4','sentence-basics',2,3
  );
  select private.current_learning_allowance_usage(auth.uid(),'lesson','UTC')
  into v_used;
  if v_used <> 1 then
    raise exception 'Expired allowance window did not roll over to one use (got %)',v_used;
  end if;
end;
$$;
commit;
