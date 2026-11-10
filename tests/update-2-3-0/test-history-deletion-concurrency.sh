#!/usr/bin/env bash
set -euo pipefail

db="${DATABASE_URL:?DATABASE_URL is required}"
uid="99999999-9999-4999-8999-999999999999"
marker="/tmp/swiftdictionary-history-delete-lock-acquired"
rm -f "$marker"

psql "$db" -X -v ON_ERROR_STOP=1 <<SQL
insert into auth.users(id) values ('$uid');
insert into auth.sessions(id,user_id,created_at) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','$uid',now());
insert into public.user_preferences(user_id,timezone) values ('$uid','UTC');
insert into public.user_entitlements(user_id,plan_code,status) values ('$uid','free','active');
insert into public.lesson_progress(user_id,difficulty,lesson_id,status)
values ('$uid','beginner','history-delete-race','in_progress');
SQL

run_completion_first() {
  psql "$db" -X -v ON_ERROR_STOP=1 <<SQL
begin;
select set_config('request.jwt.claim.sub', '$uid', true);
set local role authenticated;
select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('$uid',0));
\! touch "$marker"
select (public.complete_permanent_lesson(
  'beginner','history-delete-race','sentence-basics',2,3
)).status;
select pg_sleep(2);
commit;
SQL
}

run_deletion_second() {
  psql "$db" -X -v ON_ERROR_STOP=1 <<SQL
begin;
select set_config('request.jwt.claim.sub', '$uid', true);
select set_config(
  'request.jwt.claims',
  pg_catalog.jsonb_build_object(
    'sub','$uid',
    'session_id','cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  )::text,
  true
);
set local role authenticated;
select public.delete_my_learning_history();
commit;
SQL
}

run_completion_first >/tmp/sd-history-completion.out 2>&1 &
completion_pid=$!

for attempt in $(seq 1 100); do
  [[ -f "$marker" ]] && break
  sleep 0.1
done
if [[ ! -f "$marker" ]]; then
  echo "Completion transaction did not acquire the shared advisory lock."
  cat /tmp/sd-history-completion.out
  exit 1
fi

run_deletion_second >/tmp/sd-history-deletion.out 2>&1 &
deletion_pid=$!

wait "$completion_pid"
wait "$deletion_pid"

psql "$db" -X -v ON_ERROR_STOP=1 <<SQL
do \$\$
declare
  v_used integer;
  v_history integer;
  v_account integer;
begin
  select used_count into v_used
  from private.learning_allowance_usage
  where user_id = '$uid' and activity_type = 'lesson';
  if v_used <> 1 then
    raise exception 'Completion/deletion race changed ledger count to %, expected 1',v_used;
  end if;

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
    raise exception 'Deletion did not remove all history after the serialized completion (% rows remain)',v_history;
  end if;

  select count(*) into v_account from auth.users where id = '$uid';
  if v_account <> 1 then
    raise exception 'Learning-history deletion removed the Auth account';
  end if;
end;
\$\$;
SQL

echo "Concurrent completion/deletion test passed: the completion was charged once, then history was deleted without changing allowance usage."
