-- DRAFT ONLY — not an applied Supabase migration.
-- Apply after:
--   1. UPDATE-2.3.0-ALLOWANCE-MIGRATION-DRAFT.sql
--   2. UPDATE-2.3.0-DAILY-ACTIVITY-MIGRATION-DRAFT.sql
--   3. UPDATE-2.3.0-ALLOWANCE-LEDGER-MIGRATION-DRAFT.sql
-- This function is intentionally exposed through public for Supabase RPC,
-- but is executable only by authenticated users and derives identity from auth.uid().

begin;

create or replace function public.delete_my_learning_history()
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

  -- Require a recent authentication event. The client must reauthenticate
  -- before requesting this irreversible deletion; a refreshed old session
  -- does not satisfy the check.
  v_jwt := auth.jwt();
  v_auth_time := nullif(v_jwt ->> 'auth_time', '')::bigint;
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

  -- These are the complete learning-history tables in Update 2.3.0.
  -- Do not delete preferences, profile, saved words, entitlements, Auth,
  -- or private.learning_allowance_usage.
  delete from public.daily_activity_sessions where user_id = v_user;
  delete from public.lesson_practice_results where user_id = v_user;
  delete from public.lesson_progress where user_id = v_user;
  delete from public.learning_activity_log where user_id = v_user;

  return pg_catalog.jsonb_build_object('deleted', true);
end;
$function$;

revoke all on function public.delete_my_learning_history() from public, anon;
grant execute on function public.delete_my_learning_history() to authenticated;

commit;
