-- Current-window allowance ledger: backfill, privacy separation, quota
-- preservation after history deletion, and next-window rollover.
do $$
declare
  v_uid uuid := '88888888-8888-4888-8888-888888888888';
  v_used integer;
  v_session uuid;
  v_rejected boolean;
  i integer;
begin
  select used_count into v_used
  from private.learning_allowance_usage
  where user_id = v_uid and activity_type = 'lesson';

  if v_used <> 2 then
    raise exception 'Legacy current-window completion backfill expected 2, got %',v_used;
  end if;

  -- Under the authenticated role, the private ledger itself is not readable.
  perform set_config('request.jwt.claim.sub',v_uid::text,true);
  set local role authenticated;
  begin
    perform used_count from private.learning_allowance_usage where user_id = auth.uid();
    raise exception 'Authenticated client unexpectedly read the private allowance ledger';
  exception when insufficient_privilege then
    null;
  end;

  -- The scoped helper exposes only the caller's own current count.
  select private.current_learning_allowance_usage(auth.uid(),'lesson','UTC')
  into v_used;
  if v_used <> 2 then
    raise exception 'Scoped usage helper expected 2, got %',v_used;
  end if;

  -- Create three remaining lesson attempts; the two migrated legacy events
  -- plus these three completions must reach the Free limit of five.
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

  -- Remove the detailed event history as a privileged deletion operation
  -- would. The private current-window count must remain unchanged.
  reset role;
  delete from public.learning_activity_log
  where user_id = v_uid and activity_type = 'lesson';

  set local role authenticated;
  select private.current_learning_allowance_usage(auth.uid(),'lesson','UTC')
  into v_used;
  if v_used <> 5 then
    raise exception 'Deleting history changed the current allowance count to %',v_used;
  end if;

  v_rejected := false;
  begin
    perform public.complete_permanent_lesson(
      'beginner','ledger-test-4','sentence-basics',2,3
    );
  exception when sqlstate 'P0001' then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'History deletion restored a permanent lesson allowance';
  end if;

  -- Daily category completions use the same independent ledger.
  select id into v_session
  from public.start_daily_activity_session(
    'daily_topic','ledger-daily-one','sentence-basics','beginner','daily'
  );
  perform public.complete_daily_activity_session(v_session,null,null);

  select private.current_learning_allowance_usage(auth.uid(),'daily_topic','UTC')
  into v_used;
  if v_used <> 1 then
    raise exception 'Daily Topic ledger did not record exactly one completion';
  end if;

  reset role;
  delete from public.learning_activity_log
  where user_id = v_uid and activity_type = 'daily_topic';

  set local role authenticated;
  v_rejected := false;
  begin
    perform public.start_daily_activity_session(
      'daily_topic','ledger-daily-two','sentence-basics','beginner','daily'
    );
  exception when sqlstate 'P0001' then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'Deleting Daily Topic history restored its current-day allowance';
  end if;

  -- Expired ledger windows roll over to one use on the next completion.
  reset role;
  update private.learning_allowance_usage
  set window_start = window_start - interval '2 days',
      window_end = window_end - interval '2 days',
      used_count = 5
  where user_id = v_uid and activity_type = 'lesson';

  set local role authenticated;
  -- Use the fourth lesson row; the prior window has expired.
  perform public.complete_permanent_lesson(
    'beginner','ledger-test-4','sentence-basics',2,3
  );

  select private.current_learning_allowance_usage(auth.uid(),'lesson','UTC')
  into v_used;
  if v_used <> 1 then
    raise exception 'Expired allowance window did not roll over to one use (got %)',v_used;
  end if;

  -- Another user cannot query the first user's allowance through the helper.
  begin
    perform private.current_learning_allowance_usage(
      '11111111-1111-4111-8111-111111111111','lesson','UTC'
    );
    raise exception 'Scoped allowance helper exposed another user count';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
