-- DRAFT ONLY — not an applied Supabase migration.
-- Before deployment, create the timestamped migration with the Supabase CLI
-- and move this reviewed SQL into that generated file. This draft has only
-- been tested in the free PostgreSQL compatibility harness; it is not a
-- substitute for an isolated Supabase database test.
-- SwiftDictionary Update 2.3.0 — completion-based allowance foundation

-- 1) Preserve the meaning of historical activity rows. Before this change,
-- every lesson_progress insert produced one lesson activity row (a start).
-- Pair those rows with progress rows in per-user chronological order. Abort
-- rather than silently misattribute history if the one-to-one invariant drifted.
do $$
begin
  if exists (
    select 1
    from (
      select user_id, count(*) as progress_count
      from public.lesson_progress group by user_id
    ) p
    full join (
      select user_id, count(*) as log_count
      from public.learning_activity_log
      where activity_type = 'lesson' group by user_id
    ) a using (user_id)
    where coalesce(p.progress_count, 0) <> coalesce(a.log_count, 0)
  ) then
    raise exception 'Cannot reconcile historical lesson activity: per-user progress/log counts differ';
  end if;

  if exists (
    with p as (
      select user_id, started_at,
             row_number() over (partition by user_id order by started_at, difficulty, lesson_id) as rn
      from public.lesson_progress
    ),
    a as (
      select user_id, created_at,
             row_number() over (partition by user_id order by created_at, id) as rn
      from public.learning_activity_log
      where activity_type = 'lesson'
    )
    select 1
    from p join a using (user_id, rn)
    where abs(extract(epoch from (a.created_at - p.started_at))) > 5
  ) then
    raise exception 'Cannot reconcile historical lesson activity: start timestamps do not align';
  end if;
end
$$;

alter table public.learning_activity_log
  add column event_type text;

with progress_ranked as (
  select user_id, status, completed_at,
         row_number() over (partition by user_id order by started_at, difficulty, lesson_id) as rn
  from public.lesson_progress
),
activity_ranked as (
  select id, user_id,
         row_number() over (partition by user_id order by created_at, id) as rn
  from public.learning_activity_log
  where activity_type = 'lesson'
)
update public.learning_activity_log a
set event_type = case when p.status = 'completed' then 'completed' else 'started' end,
    created_at = case when p.status = 'completed' then p.completed_at else a.created_at end
from activity_ranked ar
join progress_ranked p using (user_id, rn)
where a.id = ar.id;

-- Existing non-lesson activity rows, if any, retain their previous counted meaning.
update public.learning_activity_log
set event_type = 'completed'
where event_type is null;

alter table public.learning_activity_log
  alter column event_type drop default,
  alter column event_type set not null,
  add constraint learning_activity_log_event_type_check
    check (event_type in ('started', 'completed'));

-- 2) Add the four independent daily activity categories and the approved limits.
alter table public.learning_activity_log
  drop constraint learning_activity_log_activity_type_check;
alter table public.learning_activity_log
  add constraint learning_activity_log_activity_type_check
    check (activity_type in ('lesson', 'quiz', 'flashcard',
                            'daily_topic', 'daily_application',
                            'daily_discovery', 'daily_revision'));

alter table public.learning_plan_limits
  drop constraint learning_plan_limits_activity_type_check;
alter table public.learning_plan_limits
  add constraint learning_plan_limits_activity_type_check
    check (activity_type in ('lesson', 'quiz', 'flashcard',
                            'daily_topic', 'daily_application',
                            'daily_discovery', 'daily_revision'));

update public.learning_plan_limits
set daily_limit = case plan_code
      when 'free' then 5
      when 'premium' then 15
      else daily_limit
    end,
    updated_at = now()
where activity_type = 'lesson';

insert into public.learning_plan_limits
  (plan_code, activity_type, daily_limit, is_enabled)
values
  ('free', 'daily_topic', 1, true),
  ('free', 'daily_application', 1, true),
  ('free', 'daily_discovery', 1, true),
  ('free', 'daily_revision', 1, true),
  ('premium', 'daily_topic', 3, true),
  ('premium', 'daily_application', 3, true),
  ('premium', 'daily_discovery', 3, true),
  ('premium', 'daily_revision', 3, true)
on conflict (plan_code, activity_type)
do update set daily_limit = excluded.daily_limit,
              is_enabled = excluded.is_enabled,
              updated_at = now();

-- 3) Daily quota checks count completed events only. Keep the existing
-- server-side entitlement, IANA timezone, advisory lock, and lesson-only
-- personal testing exemption logic.
create or replace function public.enforce_learning_daily_limit()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_timezone text;
  v_plan text;
  v_status text;
  v_valid_from timestamptz;
  v_valid_until timestamptz;
  v_limit integer;
  v_enabled boolean;
  v_start timestamptz;
  v_end timestamptz;
  v_used integer;
begin
  if auth.uid() is null or auth.uid() <> new.user_id then
    raise exception 'Authentication required for own learning activity'
      using errcode = '42501';
  end if;

  new.created_at := now();
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text, 0)
  );

  select coalesce(p.timezone, 'UTC') into v_timezone
  from public.user_preferences p
  where p.user_id = new.user_id;

  if not exists (
    select 1 from pg_catalog.pg_timezone_names where name = v_timezone
  ) then
    raise exception 'Invalid IANA timezone in user preferences'
      using errcode = '22023';
  end if;

  select e.plan_code, e.status, e.valid_from, e.valid_until
  into v_plan, v_status, v_valid_from, v_valid_until
  from public.user_entitlements e
  where e.user_id = new.user_id;

  if not found or v_status <> 'active'
     or (v_valid_from is not null and now() < v_valid_from)
     or (v_valid_until is not null and now() >= v_valid_until) then
    v_plan := 'free';
  end if;

  select l.daily_limit, l.is_enabled into v_limit, v_enabled
  from public.learning_plan_limits l
  where l.plan_code = v_plan and l.activity_type = new.activity_type;

  if not found or not v_enabled then
    raise exception 'This learning activity is currently unavailable'
      using errcode = '42501';
  end if;

  -- The private test exemption remains limited to permanent lesson completions.
  if new.activity_type = 'lesson' and private.is_learning_limit_exempt() then
    return new;
  end if;

  v_start := (((now() at time zone v_timezone)::date)::timestamp at time zone v_timezone);
  v_end := ((((now() at time zone v_timezone)::date + 1)::timestamp) at time zone v_timezone);

  select count(*)::integer into v_used
  from public.learning_activity_log a
  where a.user_id = new.user_id
    and a.activity_type = new.activity_type
    and a.event_type = 'completed'
    and a.created_at >= v_start
    and a.created_at < v_end;

  if v_used >= v_limit then
    raise exception 'Daily learning completion limit reached'
      using errcode = 'P0001',
            detail = pg_catalog.json_build_object(
              'activity_type', new.activity_type,
              'daily_limit', v_limit,
              'used', v_used,
              'timezone', v_timezone,
              'resets_at', v_end
            )::text;
  end if;

  return new;
end;
$function$;

-- 4) Stop charging when a lesson is opened. Keep historical start rows for
-- engagement history, but do not count them toward daily completion allowances.
drop trigger if exists lesson_progress_charge_on_first_start
  on public.lesson_progress;

-- Prevent clients from bypassing the completion RPC by inserting a row
-- that is already marked completed.
drop policy if exists "Users can start their own lessons"
  on public.lesson_progress;
create policy "Users can start their own lessons"
  on public.lesson_progress
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'in_progress'
    and completed_at is null
  );

-- A completion can only be made through the authenticated RPC below.
create or replace function public.guard_lesson_progress_update()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.user_id is distinct from old.user_id
     or new.difficulty is distinct from old.difficulty
     or new.lesson_id is distinct from old.lesson_id
     or new.started_at is distinct from old.started_at then
    raise exception 'Lesson identity and start time cannot be changed'
      using errcode = '42501';
  end if;

  if old.status = 'completed' and new.status <> 'completed' then
    raise exception 'Completed lessons cannot be reopened as incomplete'
      using errcode = '23514';
  end if;

  if old.status = 'completed'
     and new.completed_at is distinct from old.completed_at then
    raise exception 'Completed lesson timestamp cannot be changed'
      using errcode = '23514';
  end if;

  if old.status = 'in_progress' and new.status = 'completed' then
    if pg_catalog.current_setting('swiftdictionary.lesson_completion_rpc', true)
       is distinct from 'on' then
      raise exception 'Use complete_permanent_lesson to save lesson completion'
        using errcode = '42501';
    end if;
    if new.completed_at is null then
      raise exception 'Completion timestamp is required'
        using errcode = '23514';
    end if;
  end if;

  if new.status = 'in_progress' then
    new.completed_at := null;
  end if;

  new.updated_at := now();
  return new;
end;
$function$;

-- The existing practice-results table is empty in production. Refuse to add
-- a uniqueness rule if unexpected duplicate summaries have appeared meanwhile.
do $$
begin
  if exists (
    select 1
    from public.lesson_practice_results
    group by user_id, difficulty, lesson_id
    having count(*) > 1
  ) then
    raise exception 'Cannot enforce one practice summary per completed permanent lesson: duplicates exist';
  end if;
end
$$;

create unique index if not exists lesson_practice_results_one_per_lesson
  on public.lesson_practice_results(user_id, difficulty, lesson_id);

-- Only the trusted completion trigger writes aggregate practice outcomes.
drop policy if exists "Users can record their own lesson practice summaries"
  on public.lesson_practice_results;
revoke insert on public.lesson_practice_results from authenticated;

create or replace function private.record_lesson_completion_allowance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_topic_id text;
  v_correct_count integer;
  v_question_count integer;
begin
  if auth.uid() is null or auth.uid() <> new.user_id then
    raise exception 'Authentication required for own lesson completion'
      using errcode = '42501';
  end if;

  if old.status = 'in_progress' and new.status = 'completed' then
    v_topic_id := pg_catalog.current_setting('swiftdictionary.lesson_topic_id', true);
    v_correct_count := pg_catalog.current_setting('swiftdictionary.lesson_correct_count', true)::integer;
    v_question_count := pg_catalog.current_setting('swiftdictionary.lesson_question_count', true)::integer;

    if v_topic_id is null or v_correct_count is null or v_question_count is null
       or v_question_count <= 0 or v_correct_count < 0
       or v_correct_count > v_question_count then
      raise exception 'Valid aggregate lesson practice results are required'
        using errcode = '22023';
    end if;

    insert into public.learning_activity_log
      (user_id, activity_type, language_code, event_type)
    values (new.user_id, 'lesson', 'en', 'completed');

    insert into public.lesson_practice_results
      (user_id, difficulty, lesson_id, topic_id, correct_count, question_count)
    values
      (new.user_id, new.difficulty, new.lesson_id, v_topic_id,
       v_correct_count, v_question_count);
  end if;

  return new;
end;
$function$;

revoke all on function private.record_lesson_completion_allowance()
  from public, anon, authenticated;

drop trigger if exists lesson_progress_record_completion
  on public.lesson_progress;
create trigger lesson_progress_record_completion
after update of status on public.lesson_progress
for each row
when (old.status is distinct from new.status)
execute function private.record_lesson_completion_allowance();

-- Activity rows are now written only by trusted database triggers, not the browser.
drop policy if exists "Users can record their own learning activity"
  on public.learning_activity_log;
revoke insert on public.learning_activity_log from authenticated;

-- 5) Atomic, idempotent completion RPC. The completion update and quota log
-- insert share one transaction: if the quota trigger rejects the insert, the
-- progress update rolls back too. Duplicate retries return the completed row.
drop function if exists public.complete_permanent_lesson(text, text);

create or replace function public.complete_permanent_lesson(
  p_difficulty text,
  p_lesson_id text,
  p_topic_id text,
  p_correct_count integer,
  p_question_count integer
)
returns public.lesson_progress
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_progress public.lesson_progress%rowtype;
begin
  if v_user is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if p_difficulty is null
     or p_difficulty not in ('beginner', 'intermediate', 'advanced')
     or p_lesson_id is null
     or p_lesson_id <> pg_catalog.btrim(p_lesson_id)
     or pg_catalog.char_length(p_lesson_id) < 1
     or pg_catalog.char_length(p_lesson_id) > 120
     or p_topic_id is null
     or p_topic_id <> pg_catalog.btrim(p_topic_id)
     or pg_catalog.char_length(p_topic_id) < 1
     or pg_catalog.char_length(p_topic_id) > 120
     or p_correct_count is null or p_question_count is null
     or p_question_count <= 0 or p_correct_count < 0
     or p_correct_count > p_question_count then
    raise exception 'Invalid lesson identity or aggregate practice result'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user::text, 0)
  );

  select * into v_progress
  from public.lesson_progress
  where user_id = v_user
    and difficulty = p_difficulty
    and lesson_id = p_lesson_id
  for update;

  if not found then
    raise exception 'Start this lesson before completing it'
      using errcode = 'P0002';
  end if;

  if v_progress.status = 'completed' then
    return v_progress;
  end if;

  perform pg_catalog.set_config('swiftdictionary.lesson_topic_id', p_topic_id, true);
  perform pg_catalog.set_config('swiftdictionary.lesson_correct_count', p_correct_count::text, true);
  perform pg_catalog.set_config('swiftdictionary.lesson_question_count', p_question_count::text, true);
  perform pg_catalog.set_config(
    'swiftdictionary.lesson_completion_rpc', 'on', true
  );

  update public.lesson_progress
  set status = 'completed',
      completed_at = pg_catalog.now()
  where id = v_progress.id
    and status = 'in_progress'
  returning * into v_progress;

  if not found then
    raise exception 'Lesson completion could not be saved'
      using errcode = '40001';
  end if;

  perform pg_catalog.set_config(
    'swiftdictionary.lesson_completion_rpc', 'off', true
  );
  perform pg_catalog.set_config('swiftdictionary.lesson_topic_id', '', true);
  perform pg_catalog.set_config('swiftdictionary.lesson_correct_count', '', true);
  perform pg_catalog.set_config('swiftdictionary.lesson_question_count', '', true);

  return v_progress;
end;
$function$;

revoke all on function public.complete_permanent_lesson(text, text, text, integer, integer)
  from public, anon;
grant execute on function public.complete_permanent_lesson(text, text, text, integer, integer)
  to authenticated;

-- The former start-trigger function is now dormant; prevent direct execution.
revoke all on function public.record_lesson_start_allowance()
  from public, anon, authenticated;


-- Required post-migration checks:
-- 1. Free lesson limit = 5; Premium lesson limit = 15.
-- 2. Each daily_* category = Free 1 / Premium 3.
-- 3. Old completed lesson rows have event_type='completed' and completion timestamps.
-- 4. Existing in-progress lesson rows, if any, remain event_type='started'.
-- 5. INSERT into learning_activity_log from authenticated client is denied.
-- 6. Direct INSERT as completed and direct REST update to completed are denied.
-- 7. RPC completion succeeds once; duplicate RPC returns the same completed row.
-- 8. Concurrent completions at the quota boundary cannot exceed the limit.
-- 9. A quota failure rolls back status/completed_at and creates no usage row.
-- 10. The personal exemption affects lesson only; daily_* limits remain enforced.
