-- DRAFT ONLY — not an applied Supabase migration.
-- Apply only after the completion-based allowance foundation has been reviewed.
-- This migration draft is tested only in the free PostgreSQL compatibility harness.
-- SwiftDictionary Update 2.3.0 — daily activity session foundation

-- 1) Account-synchronised activity preferences. Existing users default to all enabled.
alter table public.user_preferences
  add column if not exists daily_topic_enabled boolean not null default true,
  add column if not exists daily_application_enabled boolean not null default true,
  add column if not exists daily_discovery_enabled boolean not null default true,
  add column if not exists daily_revision_enabled boolean not null default true;

-- 2) One unfinished session per user/category at a time. Abandoned sessions are
-- retained as history and do not count as completed activity.
create table public.daily_activity_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null
    check (activity_type in ('daily_topic','daily_application','daily_discovery','daily_revision')),
  content_id text not null
    check (char_length(content_id) between 1 and 120),
  topic_id text
    check (topic_id is null or char_length(topic_id) between 1 and 120),
  difficulty text
    check (difficulty is null or difficulty in ('beginner','intermediate','advanced')),
  source text not null default 'daily'
    check (source in ('daily','adaptive_revision')),
  local_date date not null,
  timezone text not null,
  status text not null default 'in_progress'
    check (status in ('in_progress','completed','abandoned')),
  correct_count integer,
  question_count integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_activity_sessions_completion_consistent
    check ((status = 'completed' and completed_at is not null)
        or (status <> 'completed' and completed_at is null)),
  constraint daily_activity_sessions_result_consistent
    check (
      (status <> 'completed' and correct_count is null and question_count is null)
      or
      (status = 'completed' and (
        (activity_type in ('daily_application','daily_revision')
          and correct_count is not null and question_count is not null
          and question_count > 0 and correct_count >= 0 and correct_count <= question_count)
        or
        (activity_type in ('daily_topic','daily_discovery')
          and correct_count is null and question_count is null)
      ))
    )
);

create unique index daily_activity_one_open_session_per_category
  on public.daily_activity_sessions(user_id, activity_type)
  where status = 'in_progress';

create index daily_activity_sessions_owner_history_idx
  on public.daily_activity_sessions(user_id, activity_type, local_date desc, created_at desc);

alter table public.daily_activity_sessions enable row level security;

create policy "Users can read their own daily activity sessions"
  on public.daily_activity_sessions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can start their own daily activity sessions"
  on public.daily_activity_sessions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'in_progress'
    and completed_at is null
    and correct_count is null
    and question_count is null
  );

create policy "Users can update their own daily activity sessions"
  on public.daily_activity_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.daily_activity_sessions to authenticated;

-- 3) Only session identity and lifecycle fields can change. Completion is
-- possible only while the trusted RPC has set its transaction-local marker.
create or replace function public.guard_daily_activity_session_update()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.user_id is distinct from old.user_id
     or new.activity_type is distinct from old.activity_type
     or new.content_id is distinct from old.content_id
     or new.topic_id is distinct from old.topic_id
     or new.difficulty is distinct from old.difficulty
     or new.source is distinct from old.source
     or new.local_date is distinct from old.local_date
     or new.timezone is distinct from old.timezone
     or new.started_at is distinct from old.started_at
     or new.created_at is distinct from old.created_at then
    raise exception 'Daily activity session identity cannot be changed'
      using errcode = '42501';
  end if;

  if old.status <> 'in_progress' then
    raise exception 'Finished daily activity sessions cannot be changed'
      using errcode = '23514';
  end if;

  if new.status = 'completed'
     and pg_catalog.current_setting('swiftdictionary.daily_completion_rpc', true)
         is distinct from 'on' then
    raise exception 'Use complete_daily_activity_session to save completion'
      using errcode = '42501';
  end if;

  if new.status not in ('in_progress','completed','abandoned') then
    raise exception 'Invalid daily activity session status'
      using errcode = '23514';
  end if;

  if new.status = 'abandoned' then
    new.completed_at := null;
    new.correct_count := null;
    new.question_count := null;
  end if;

  new.updated_at := pg_catalog.now();
  return new;
end;
$function$;

create trigger guard_daily_activity_session_update
before update on public.daily_activity_sessions
for each row execute function public.guard_daily_activity_session_update();

-- 4) Trusted trigger writes the completed activity event. It never calls the
-- lesson exemption; daily categories are always subject to their own limits.
create or replace function private.record_daily_activity_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_language text;
begin
  if auth.uid() is null or auth.uid() <> new.user_id then
    raise exception 'Authentication required for own daily activity completion'
      using errcode = '42501';
  end if;

  if old.status = 'in_progress' and new.status = 'completed' then
    select p.learning_language into v_language
    from public.user_preferences p
    where p.user_id = new.user_id;

    insert into public.learning_activity_log
      (user_id, activity_type, language_code, event_type)
    values
      (new.user_id, new.activity_type, coalesce(v_language, 'en'), 'completed');
  end if;

  return new;
end;
$function$;

revoke all on function private.record_daily_activity_completion()
  from public, anon, authenticated;

create trigger daily_activity_record_completion
after update of status on public.daily_activity_sessions
for each row
when (old.status is distinct from new.status)
execute function private.record_daily_activity_completion();

-- 5) Start/resume RPC. It does not consume allowance. It resumes any unfinished
-- session in this category (even across midnight) before considering a new one.
create or replace function public.start_daily_activity_session(
  p_activity_type text,
  p_content_id text,
  p_topic_id text default null,
  p_difficulty text default null,
  p_source text default 'daily'
)
returns public.daily_activity_sessions
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_timezone text;
  v_plan text;
  v_entitlement_status text;
  v_valid_from timestamptz;
  v_valid_until timestamptz;
  v_limit integer;
  v_enabled boolean;
  v_preference_enabled boolean;
  v_local_date date;
  v_start timestamptz;
  v_end timestamptz;
  v_used integer;
  v_session public.daily_activity_sessions%rowtype;
begin
  if v_user is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if p_activity_type is null
     or p_activity_type not in ('daily_topic','daily_application','daily_discovery','daily_revision')
     or p_content_id is null
     or p_content_id <> pg_catalog.btrim(p_content_id)
     or pg_catalog.char_length(p_content_id) < 1
     or pg_catalog.char_length(p_content_id) > 120
     or (p_topic_id is not null and pg_catalog.char_length(p_topic_id) > 120)
     or (p_difficulty is not null and p_difficulty not in ('beginner','intermediate','advanced'))
     or p_source is null
     or p_source not in ('daily','adaptive_revision') then
    raise exception 'Invalid daily activity session details'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user::text, 0)
  );

  select * into v_session
  from public.daily_activity_sessions
  where user_id = v_user
    and activity_type = p_activity_type
    and status = 'in_progress'
  order by started_at desc
  limit 1
  for update;

  if found then
    return v_session;
  end if;

  select p.timezone,
         case p_activity_type
           when 'daily_topic' then p.daily_topic_enabled
           when 'daily_application' then p.daily_application_enabled
           when 'daily_discovery' then p.daily_discovery_enabled
           when 'daily_revision' then p.daily_revision_enabled
         end
  into v_timezone, v_preference_enabled
  from public.user_preferences p
  where p.user_id = v_user;

  if not found or v_timezone is null
     or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = v_timezone) then
    raise exception 'A valid saved IANA timezone is required'
      using errcode = '22023';
  end if;

  if not v_preference_enabled then
    raise exception 'This daily activity is disabled in your preferences'
      using errcode = '42501';
  end if;

  select e.plan_code, e.status, e.valid_from, e.valid_until
  into v_plan, v_entitlement_status, v_valid_from, v_valid_until
  from public.user_entitlements e
  where e.user_id = v_user;

  if not found or v_entitlement_status <> 'active'
     or (v_valid_from is not null and pg_catalog.now() < v_valid_from)
     or (v_valid_until is not null and pg_catalog.now() >= v_valid_until) then
    v_plan := 'free';
  end if;

  select l.daily_limit, l.is_enabled into v_limit, v_enabled
  from public.learning_plan_limits l
  where l.plan_code = v_plan and l.activity_type = p_activity_type;

  if not found or not v_enabled then
    raise exception 'This daily activity is unavailable for the current plan'
      using errcode = '42501';
  end if;

  v_local_date := (pg_catalog.now() at time zone v_timezone)::date;
  v_start := (v_local_date::timestamp at time zone v_timezone);
  v_end := ((v_local_date + 1)::timestamp at time zone v_timezone);

  select count(*)::integer into v_used
  from public.learning_activity_log a
  where a.user_id = v_user
    and a.activity_type = p_activity_type
    and a.event_type = 'completed'
    and a.created_at >= v_start
    and a.created_at < v_end;

  if v_used >= v_limit then
    raise exception 'Daily learning completion limit reached'
      using errcode = 'P0001';
  end if;

  insert into public.daily_activity_sessions
    (user_id, activity_type, content_id, topic_id, difficulty, source,
     local_date, timezone, status)
  values
    (v_user, p_activity_type, p_content_id, p_topic_id, p_difficulty, p_source,
     v_local_date, v_timezone, 'in_progress')
  returning * into v_session;

  return v_session;
end;
$function$;

-- 6) Completion RPC. The progress transition and activity-log insert are one
-- transaction. A quota rejection rolls back the session completion as well.
create or replace function public.complete_daily_activity_session(
  p_session_id uuid,
  p_correct_count integer default null,
  p_question_count integer default null
)
returns public.daily_activity_sessions
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_session public.daily_activity_sessions%rowtype;
begin
  if v_user is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if p_session_id is null then
    raise exception 'Session ID is required'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user::text, 0)
  );

  select * into v_session
  from public.daily_activity_sessions
  where id = p_session_id and user_id = v_user
  for update;

  if not found then
    raise exception 'Daily activity session not found'
      using errcode = 'P0002';
  end if;

  if v_session.status = 'completed' then
    return v_session;
  end if;

  if v_session.status = 'abandoned' then
    raise exception 'An abandoned daily activity session cannot be completed'
      using errcode = '23514';
  end if;

  if v_session.activity_type in ('daily_application','daily_revision') then
    if p_correct_count is null or p_question_count is null
       or p_question_count <= 0 or p_correct_count < 0
       or p_correct_count > p_question_count then
      raise exception 'Valid aggregate practice counts are required'
        using errcode = '22023';
    end if;
  elsif p_correct_count is not null or p_question_count is not null then
    raise exception 'This daily activity does not accept practice counts'
      using errcode = '22023';
  end if;

  perform pg_catalog.set_config(
    'swiftdictionary.daily_completion_rpc', 'on', true
  );

  update public.daily_activity_sessions
  set status = 'completed',
      completed_at = pg_catalog.now(),
      correct_count = p_correct_count,
      question_count = p_question_count
  where id = v_session.id
    and user_id = v_user
    and status = 'in_progress'
  returning * into v_session;

  if not found then
    raise exception 'Daily activity completion could not be saved'
      using errcode = '40001';
  end if;

  perform pg_catalog.set_config(
    'swiftdictionary.daily_completion_rpc', 'off', true
  );

  return v_session;
end;
$function$;

revoke all on function public.start_daily_activity_session(text,text,text,text,text)
  from public, anon;
grant execute on function public.start_daily_activity_session(text,text,text,text,text)
  to authenticated;

revoke all on function public.complete_daily_activity_session(uuid,integer,integer)
  from public, anon;
grant execute on function public.complete_daily_activity_session(uuid,integer,integer)
  to authenticated;
