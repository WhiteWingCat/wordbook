#!/usr/bin/env bash
set -euo pipefail

db="${DATABASE_URL:?DATABASE_URL is required}"
uid="33333333-3333-4333-8333-333333333333"

# Add four completed lessons and two unfinished lessons after the migration.
# The fifth slot is shared by two concurrent completion requests.
psql "$db" -X -v ON_ERROR_STOP=1 <<SQL
select set_config('request.jwt.claim.sub', '$uid', false);

insert into public.lesson_progress(user_id, difficulty, lesson_id, status, completed_at)
select '$uid', 'beginner',
       'concurrent-' || lpad(n::text, 2, '0'), 'completed', now()
from generate_series(1, 4) as n;

insert into public.lesson_progress(user_id, difficulty, lesson_id, status)
select '$uid', 'beginner',
       'concurrent-' || lpad(n::text, 2, '0'), 'in_progress'
from generate_series(5, 6) as n;

insert into public.learning_activity_log(user_id, activity_type, language_code, event_type)
select '$uid', 'lesson', 'en',
       case when n <= 4 then 'completed' else 'started' end
from generate_series(1, 6) as n;
SQL

run_completion() {
  local lesson="$1"
  local output="/tmp/${lesson}.out"
  local status="/tmp/${lesson}.status"
  set +e
  psql "$db" -X -v ON_ERROR_STOP=1 >"$output" 2>&1 <<SQL
begin;
select set_config('request.jwt.claim.sub', '$uid', true);
set local role authenticated;
-- Start both requests together; the completion RPC must serialize them itself.
select pg_sleep(1);
select (public.complete_permanent_lesson('beginner', '$lesson', 'sentence-basics', 3, 3)).status;
commit;
SQL
  echo "$?" >"$status"
  set -e
}

run_completion concurrent-05 &
pid_a=$!
run_completion concurrent-06 &
pid_b=$!
wait "$pid_a"
wait "$pid_b"

status_a="$(cat /tmp/concurrent-05.status)"
status_b="$(cat /tmp/concurrent-06.status)"
if ! { [[ "$status_a" -eq 0 && "$status_b" -ne 0 ]] || [[ "$status_a" -ne 0 && "$status_b" -eq 0 ]]; }; then
  echo "Expected exactly one concurrent completion to succeed and one to hit the quota."
  cat /tmp/concurrent-05.out /tmp/concurrent-06.out
  exit 1
fi

psql "$db" -X -v ON_ERROR_STOP=1 <<'SQL'
do $$
declare
  v_completed integer;
  v_in_progress integer;
  v_practice_results integer;
begin
  select count(*) into v_completed
  from public.learning_activity_log
  where user_id = '33333333-3333-4333-8333-333333333333'
    and activity_type = 'lesson' and event_type = 'completed';
  select count(*) into v_in_progress
  from public.lesson_progress
  where user_id = '33333333-3333-4333-8333-333333333333'
    and status = 'in_progress';

  if v_completed <> 5 then
    raise exception 'Concurrent quota race produced % completions; expected exactly 5', v_completed;
  end if;
  if v_in_progress <> 1 then
    raise exception 'Concurrent quota race left % unfinished lessons; expected exactly 1', v_in_progress;
  end if;

  select count(*) into v_practice_results
  from public.lesson_practice_results
  where user_id = '33333333-3333-4333-8333-333333333333';

  if v_practice_results <> 1 then
    raise exception 'Concurrent quota race saved % practice results; expected exactly 1', v_practice_results;
  end if;
end;
$$;
SQL

# Concurrent retries for the same daily reading session must be idempotent:
# both callers may receive the completed row, but only one completion event is written.
daily_uid="66666666-6666-4666-8666-666666666666"
psql "$db" -X -v ON_ERROR_STOP=1 <<SQL
insert into auth.users(id) values ('$daily_uid');
insert into public.user_preferences(user_id,timezone)
values ('$daily_uid','UTC');
insert into public.user_entitlements(user_id,plan_code,status)
values ('$daily_uid','free','active');
SQL

daily_session_id="$(psql "$db" -qAtX -v ON_ERROR_STOP=1 <<SQL
select set_config('request.jwt.claim.sub', '$daily_uid', false) \gset
set role authenticated;
select (public.start_daily_activity_session('daily_topic','daily-topic-concurrency-01',null,null,'daily')).id;
SQL
)"

run_daily_completion() {
  local label="$1"
  local output="/tmp/daily-$label.out"
  local status="/tmp/daily-$label.status"
  set +e
  psql "$db" -X -v ON_ERROR_STOP=1 >"$output" 2>&1 <<SQL
begin;
select set_config('request.jwt.claim.sub', '$daily_uid', true);
set local role authenticated;
select pg_sleep(1);
select (public.complete_daily_activity_session('$daily_session_id', null, null)).status;
commit;
SQL
  echo "$?" >"$status"
  set -e
}

run_daily_completion a &
daily_pid_a=$!
run_daily_completion b &
daily_pid_b=$!
wait "$daily_pid_a"
wait "$daily_pid_b"

psql "$db" -X -v ON_ERROR_STOP=1 <<SQL
do $
declare
  v_events integer;
  v_status text;
begin
  select count(*) into v_events
  from public.learning_activity_log
  where user_id = '$daily_uid'
    and activity_type = 'daily_topic'
    and event_type = 'completed';
  select status into v_status
  from public.daily_activity_sessions
  where id = '$daily_session_id';

  if v_events <> 1 then
    raise exception 'Concurrent daily completion retries wrote % events; expected exactly 1', v_events;
  end if;
  if v_status <> 'completed' then
    raise exception 'Concurrent daily completion left the session in status %', v_status;
  end if;
end;
$;
SQL

if [[ "$(cat /tmp/daily-a.status)" -ne 0 || "$(cat /tmp/daily-b.status)" -ne 0 ]]; then
  echo "Concurrent daily completion retry unexpectedly failed."
  cat /tmp/daily-a.out /tmp/daily-b.out
  exit 1
fi

echo "Concurrent daily completion test passed: duplicate requests wrote exactly one event."

echo "Concurrent completion test passed: one completion committed, one was rejected, and the quota remained at five."
