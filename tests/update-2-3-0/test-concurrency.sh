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
-- Acquire the same transaction-scoped per-user lock, then overlap both callers.
select pg_advisory_xact_lock(hashtextextended('$uid', 0));
select pg_sleep(1);
select (public.complete_permanent_lesson('beginner', '$lesson')).status;
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
end;
$$;
SQL

echo "Concurrent completion test passed: one completion committed, one was rejected, and the quota remained at five."
