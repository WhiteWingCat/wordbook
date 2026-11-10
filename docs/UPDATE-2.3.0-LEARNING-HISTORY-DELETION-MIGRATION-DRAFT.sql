-- DRAFT ONLY — not an applied Supabase migration.
-- Apply after:
--   1. UPDATE-2.3.0-ALLOWANCE-MIGRATION-DRAFT.sql
--   2. UPDATE-2.3.0-DAILY-ACTIVITY-MIGRATION-DRAFT.sql
--   3. UPDATE-2.3.0-ALLOWANCE-LEDGER-MIGRATION-DRAFT.sql
-- The privileged implementation stays in the non-exposed private schema.
-- The public RPC is only a SECURITY INVOKER wrapper.

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
  v_auth_time bigint;
begin
  if v_user is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  -- Supabase JWTs expose the authentication-method timestamps in the signed
  -- amr claim. Exclude token_refresh: refreshing an old session is not a
  -- recent authentication event.
  v_jwt := auth.jwt();
  select max((entry.value ->> 'timestamp')::bigint)
  into v_auth_time
  from pg_catalog.jsonb_array_elements(
    coalesce(v_jwt -> 'amr', '[]'::jsonb)
  ) as entry(value)
  where entry.value ->> 'method' in (
    'oauth','password','otp','totp','sso/saml','magiclink',
    'email/signup','email_change','recovery','invite'
  )
    and entry.value ->> 'timestamp' ~ '^[0-9]+$';

  if v_auth_time is null
     or pg_catalog.to_timestamp(v_auth_time) < pg_catalog.now() - interval '15 minutes'
     or pg_catalog.to_timestamp(v_auth_time) > pg_catalog.now() + interval '60 seconds' then
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
