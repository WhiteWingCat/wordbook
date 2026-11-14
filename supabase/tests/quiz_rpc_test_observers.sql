-- Test-only observers for isolated Quiz integration tests.
-- These are installed only in disposable CI databases, never in production.
create or replace function public.test_current_quiz_usage()
returns integer
language sql
security definer
set search_path=''
as $$
  select coalesce((
    select u.used_count from private.learning_allowance_usage u
    where u.user_id=auth.uid() and u.activity_type='quiz'
  ),0)
$$;

create or replace function public.test_my_quiz_session_count()
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare v_count integer;
begin
  select count(*)::integer into v_count
  from private.quiz_sessions s where s.user_id=auth.uid();
  return v_count;
end;
$$;

create or replace function public.test_my_quiz_completed_event_count()
returns integer
language sql
security definer
set search_path=''
as $$
  select count(*)::integer from public.learning_activity_log l
  where l.user_id=auth.uid() and l.activity_type='quiz' and l.event_type='completed'
$$;

revoke all on function public.test_current_quiz_usage() from public,anon;
revoke all on function public.test_my_quiz_session_count() from public,anon;
revoke all on function public.test_my_quiz_completed_event_count() from public,anon;
grant execute on function public.test_current_quiz_usage() to authenticated;
grant execute on function public.test_my_quiz_session_count() to authenticated;
grant execute on function public.test_my_quiz_completed_event_count() to authenticated;
