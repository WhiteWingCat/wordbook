#!/usr/bin/env bash
set -euo pipefail

db="${DATABASE_URL:?DATABASE_URL is required}"
uid="f6e8b56d-cc13-4d91-9c4f-2d95c0a7e6b1"
session_id="f6e8b56d-cc13-4d91-9c4f-2d95c0a7e6b2"
marker="/tmp/swiftdictionary-replay-insert-sleeping"
rm -f "$marker"

# This test pauses the replay-summary INSERT after the RPC has selected the
# completed lesson. The deletion request starts during that pause. With the
# shared per-user advisory lock, deletion must wait and then remove the summary.
psql "$db" -X -v ON_ERROR_STOP=1 <<SQL
insert into auth.users(id) values ('$uid');
select set_config('request.jwt.claim.sub', '$uid', false);
insert into auth.sessions(id,user_id,created_at) values ('$session_id','$uid',now());
insert into public.user_preferences(user_id,timezone) values ('$uid','UTC');
insert into public.user_entitlements(user_id,plan_code,status) values ('$uid','free','active');
insert into public.lesson_progress(user_id,difficulty,lesson_id,status,completed_at)
values ('$uid','beginner','replay-delete-race','completed',now());

create or replace function public.test_pause_replay_summary_insert()
returns trigger language plpgsql set search_path = ''
as \$function\$
begin
  if new.user_id = '$uid' then
    perform pg_catalog.pg_sleep(3);
  end if;
  return new;
end;
\$function\$;

create trigger test_pause_replay_summary_insert
before insert on public.lesson_practice_results
for each row execute function public.test_pause_replay_summary_insert();
SQL

run_replay() {
  psql "$db" -X -v ON_ERROR_STOP=1 <<SQL
begin;
select set_config('request.jwt.claim.sub', '$uid', true);
set local role authenticated;
select public.record_completed_lesson_practice_result(
  'beginner','replay-delete-race','sentence-basics',2,3
);
commit;
SQL
}

run_deletion() {
  psql "$db" -X -v ON_ERROR_STOP=1 <<SQL
begin;
select set_config('request.jwt.claim.sub', '$uid', true);
select set_config(
  'request.jwt.claims',
  pg_catalog.jsonb_build_object(
    'sub','$uid',
    'session_id','$session_id'
  )::text,
  true
);
set local role authenticated;
select public.delete_my_learning_history();
commit;
SQL
}

run_replay >/tmp/sd-history-replay.out 2>&1 &
replay_pid=$!

# Wait until the replay RPC is inside the deliberately slow INSERT trigger.
entered=false
for attempt in $(seq 1 100); do
  if psql "$db" -X -At -v ON_ERROR_STOP=1 -c "select exists (
      select 1 from pg_catalog.pg_stat_activity
      where wait_event = 'PgSleep'
        and query ilike '%record_completed_lesson_practice_result%'
    );" | grep -qx t; then
    entered=true
    break
  fi
  sleep 0.1
done
if [[ "$entered" != true ]]; then
  echo "Replay RPC did not reach the controlled INSERT pause."
  cat /tmp/sd-history-replay.out
  exit 1
fi

run_deletion >/tmp/sd-history-replay-deletion.out 2>&1 &
deletion_pid=$!

wait "$replay_pid"
wait "$deletion_pid"

psql "$db" -X -v ON_ERROR_STOP=1 <<SQL
drop trigger test_pause_replay_summary_insert on public.lesson_practice_results;
drop function public.test_pause_replay_summary_insert();

do \$\$
declare
  v_history integer;
  v_account integer;
begin
  select count(*) into v_history
  from (
    select user_id from public.lesson_progress where user_id = '$uid'
    union all
    select user_id from public.lesson_practice_results where user_id = '$uid'
    union all
    select user_id from public.daily_activity_sessions where user_id = '$uid'
    union all
    select user_id from public.learning_activity_log where user_id = '$uid'
  ) history_rows;
  if v_history <> 0 then
    raise exception 'Replay/deletion race left % learning-history rows behind',v_history;
  end if;

  select count(*) into v_account from auth.users where id = '$uid';
  if v_account <> 1 then
    raise exception 'Learning-history deletion removed the Auth account';
  end if;
end;
\$\$;
SQL

echo "Replay/deletion concurrency test passed: replay summary completed before deletion, and deletion left no learning-history rows."
