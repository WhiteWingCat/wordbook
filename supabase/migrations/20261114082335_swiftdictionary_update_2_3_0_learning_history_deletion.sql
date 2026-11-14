-- SwiftDictionary Update 2.3.0 — learning-history deletion support.
-- Applied to the live SwiftDictionary Supabase project as migration 20261114082335.
begin;

create or replace function private.delete_my_learning_history_impl()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_jwt jsonb;
  v_session_id uuid;
  v_session_created_at timestamptz;
  v_session_not_after timestamptz;
begin
  if v_user is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  -- Require a recently created, still-existing Supabase Auth session.
  -- Refreshing an old access token keeps the same session_id and does not
  -- reset created_at. Signing out removes the session row.
  v_jwt := auth.jwt();
  v_session_id := nullif(v_jwt ->> 'session_id', '')::uuid;

  select s.created_at, s.not_after
  into v_session_created_at, v_session_not_after
  from auth.sessions s
  where s.id = v_session_id
    and s.user_id = v_user;

  if not found
     or v_session_created_at is null
     or v_session_created_at < pg_catalog.now() - interval '15 minutes'
     or v_session_created_at > pg_catalog.now() + interval '60 seconds'
     or (v_session_not_after is not null and v_session_not_after <= pg_catalog.now()) then
    raise exception 'Recent authentication required to delete learning history'
      using errcode = '42501';
  end if;

  -- Serialize against every permanent-lesson and Daily Learning completion.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user::text, 0)
  );

  -- Delete only learning history. Account and quota state are retained.
  delete from public.daily_activity_sessions where user_id = v_user;
  delete from public.lesson_practice_results where user_id = v_user;
  delete from public.lesson_progress where user_id = v_user;
  delete from public.learning_activity_log where user_id = v_user;

  return pg_catalog.jsonb_build_object('deleted', true);
end;
$function$;

revoke all on function private.delete_my_learning_history_impl()
  from public, anon;
grant execute on function private.delete_my_learning_history_impl()
  to authenticated;

-- PostgREST calls this public wrapper. It does not elevate privileges;
-- the private implementation performs the narrowly scoped SECURITY DEFINER work.
create or replace function public.delete_my_learning_history()
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select private.delete_my_learning_history_impl();
$function$;

revoke all on function public.delete_my_learning_history() from public, anon;
grant execute on function public.delete_my_learning_history() to authenticated;

commit;
