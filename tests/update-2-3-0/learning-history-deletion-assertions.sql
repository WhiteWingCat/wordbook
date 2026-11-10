-- Learning-history deletion RPC: ownership, recent-authentication,
-- atomic deletion, idempotency, quota preservation and unrelated-data retention.

insert into public.saved_words(user_id,word)
values ('88888888-8888-4888-8888-888888888888','retain-me');

-- Ensure the fixture has practice data and at least one completed lesson.
insert into public.lesson_practice_results
  (user_id,difficulty,lesson_id,topic_id,correct_count,question_count)
values
  ('88888888-8888-4888-8888-888888888888','beginner','history-delete-practice-fixture','sentence-basics',2,3);

begin;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
select set_config(
  'request.jwt.claims',
  pg_catalog.jsonb_build_object(
    'sub','88888888-8888-4888-8888-888888888888',
    'amr',pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('method','oauth','timestamp',extract(epoch from pg_catalog.now())::bigint))
  )::text,
  true
);
set local role authenticated;

do $$
declare
  v_before_lesson integer;
  v_before_daily integer;
  v_after_lesson integer;
  v_after_daily integer;
  v_count integer;
begin
  select private.current_learning_allowance_usage(auth.uid(),'lesson','UTC')
    into v_before_lesson;
  select private.current_learning_allowance_usage(auth.uid(),'daily_topic','UTC')
    into v_before_daily;

  perform public.delete_my_learning_history();
  -- A repeated request must remain safe and successful.
  perform public.delete_my_learning_history();

  select count(*) into v_count from public.lesson_progress where user_id = auth.uid();
  if v_count <> 0 then raise exception 'Lesson progress was not fully deleted'; end if;

  select count(*) into v_count from public.lesson_practice_results where user_id = auth.uid();
  if v_count <> 0 then raise exception 'Practice summaries were not fully deleted'; end if;

  select count(*) into v_count from public.daily_activity_sessions where user_id = auth.uid();
  if v_count <> 0 then raise exception 'Daily Activity sessions were not fully deleted'; end if;

  select count(*) into v_count from public.learning_activity_log where user_id = auth.uid();
  if v_count <> 0 then raise exception 'Learning activity history was not fully deleted'; end if;

  select private.current_learning_allowance_usage(auth.uid(),'lesson','UTC')
    into v_after_lesson;
  select private.current_learning_allowance_usage(auth.uid(),'daily_topic','UTC')
    into v_after_daily;

  if v_after_lesson <> v_before_lesson then
    raise exception 'History deletion changed lesson allowance from % to %',v_before_lesson,v_after_lesson;
  end if;
  if v_after_daily <> v_before_daily then
    raise exception 'History deletion changed Daily Topic allowance from % to %',v_before_daily,v_after_daily;
  end if;
end;
$$;
commit;

-- Confirm that the operation did not remove account state or saved words.
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from auth.users
  where id = '88888888-8888-4888-8888-888888888888';
  if v_count <> 1 then raise exception 'History deletion removed the Auth account'; end if;

  select count(*) into v_count from public.user_preferences
  where user_id = '88888888-8888-4888-8888-888888888888';
  if v_count <> 1 then raise exception 'History deletion removed user preferences'; end if;

  select count(*) into v_count from public.user_entitlements
  where user_id = '88888888-8888-4888-8888-888888888888';
  if v_count <> 1 then raise exception 'History deletion removed the entitlement row'; end if;

  select count(*) into v_count from public.saved_words
  where user_id = '88888888-8888-4888-8888-888888888888' and word = 'retain-me';
  if v_count <> 1 then raise exception 'History deletion removed saved words'; end if;
end;
$$;

-- A stale or missing auth_time must be rejected before any deletion.
begin;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
select set_config(
  'request.jwt.claims',
  pg_catalog.jsonb_build_object(
    'sub','88888888-8888-4888-8888-888888888888',
    'amr',pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('method','oauth','timestamp',extract(epoch from pg_catalog.now() - interval '1 hour')::bigint),
      pg_catalog.jsonb_build_object('method','token_refresh','timestamp',extract(epoch from pg_catalog.now())::bigint)
    )
  )::text,
  true
);
set local role authenticated;
do $$
declare
  v_rejected boolean := false;
begin
  begin
    perform public.delete_my_learning_history();
  exception when insufficient_privilege then v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'Deletion accepted a stale authentication timestamp';
  end if;
end;
$$;
rollback;
