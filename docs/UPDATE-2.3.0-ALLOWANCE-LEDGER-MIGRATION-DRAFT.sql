-- DRAFT ONLY — not an applied Supabase migration.
-- Apply after:
--   1. docs/UPDATE-2.3.0-ALLOWANCE-MIGRATION-DRAFT.sql
--   2. docs/UPDATE-2.3.0-DAILY-ACTIVITY-MIGRATION-DRAFT.sql
-- Tested only in the disposable PostgreSQL 17 compatibility harness.
-- SwiftDictionary Update 2.3.0 — separate current-window allowance ledger

begin;

-- One compact row per user/activity category. No lesson IDs, content IDs,
-- topic IDs, answer data, language text, or per-completion event trail.
create table private.learning_allowance_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null
    check (activity_type in ('lesson','quiz','flashcard',
      'daily_topic','daily_application','daily_discovery','daily_revision')),
  window_start timestamptz not null,
  window_end timestamptz not null,
  used_count integer not null check (used_count >= 0),
  updated_at timestamptz not null default pg_catalog.now(),
  primary key (user_id, activity_type),
  constraint learning_allowance_usage_window_check
    check (window_start < window_end)
);

alter table private.learning_allowance_usage enable row level security;
revoke all on table private.learning_allowance_usage from public, anon, authenticated;
-- The authenticated Daily Activity start RPC calls one narrow helper in this schema;
-- schema usage does not grant access to the private table or other functions.
grant usage on schema private to authenticated;

-- Backfill the active local-day count before switching enforcement. Keep an
-- already-over-limit count intact; never truncate usage to the plan limit.
with effective_windows as (
  select u.id as user_id,
         coalesce(
           case when p.allowance_timezone is not null
                     and p.allowance_timezone_until > pg_catalog.now()
                then p.allowance_timezone else p.timezone end,
           'UTC'
         ) as timezone_name
  from auth.users u
  left join public.user_preferences p on p.user_id = u.id
),
window_bounds as (
  select user_id, timezone_name,
         (((pg_catalog.now() at time zone timezone_name)::date)::timestamp
            at time zone timezone_name) as window_start,
         ((((pg_catalog.now() at time zone timezone_name)::date + 1)::timestamp)
            at time zone timezone_name) as window_end
  from effective_windows
),
current_events as (
  select a.user_id, a.activity_type, w.window_start, w.window_end,
         count(*)::integer as used_count
  from public.learning_activity_log a
  join window_bounds w on w.user_id = a.user_id
  where a.event_type = 'completed'
    and a.created_at >= w.window_start
    and a.created_at < w.window_end
  group by a.user_id, a.activity_type, w.window_start, w.window_end
)
insert into private.learning_allowance_usage
  (user_id, activity_type, window_start, window_end, used_count)
select user_id, activity_type, window_start, window_end, used_count
from current_events
on conflict (user_id, activity_type) do update
set window_start = excluded.window_start,
    window_end = excluded.window_end,
    used_count = excluded.used_count,
    updated_at = pg_catalog.now();

-- Authenticated callers can read only their own current count through this
-- narrow function. The underlying private table remains inaccessible.
create or replace function private.current_learning_allowance_usage(
  p_user_id uuid,
  p_activity_type text,
  p_timezone text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_used integer;
  v_effective_timezone text;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Authentication required for own allowance usage'
      using errcode = '42501';
  end if;

  if p_activity_type is null
     or p_activity_type not in ('lesson','quiz','flashcard',
       'daily_topic','daily_application','daily_discovery','daily_revision')
     or p_timezone is null
     or not exists (
       select 1 from pg_catalog.pg_timezone_names z where z.name = p_timezone
     ) then
    raise exception 'Invalid allowance activity or timezone'
      using errcode = '22023';
  end if;

  select coalesce(
           case when p.allowance_timezone is not null
                     and p.allowance_timezone_until > pg_catalog.now()
                then p.allowance_timezone else p.timezone end,
           'UTC'
         )
  into v_effective_timezone
  from public.user_preferences p
  where p.user_id = p_user_id;

  if v_effective_timezone is null or p_timezone is distinct from v_effective_timezone then
    raise exception 'Allowance timezone must match the server-owned effective timezone'
      using errcode = '22023';
  end if;

  v_start := (((pg_catalog.now() at time zone p_timezone)::date)::timestamp
                at time zone p_timezone);
  v_end := ((((pg_catalog.now() at time zone p_timezone)::date + 1)::timestamp)
                at time zone p_timezone);

  select u.used_count into v_used
  from private.learning_allowance_usage u
  where u.user_id = p_user_id
    and u.activity_type = p_activity_type
    and u.window_start = v_start
    and u.window_end = v_end;

  return coalesce(v_used, 0);
end;
$function$;

revoke all on function private.current_learning_allowance_usage(uuid,text,text)
  from public, anon;
grant execute on function private.current_learning_allowance_usage(uuid,text,text)
  to authenticated;

-- Read-only dashboard endpoint. It exposes only the caller's own current-window
-- counters; the private ledger itself remains inaccessible to browser roles.
create or replace function public.get_my_learning_allowance_usage()
returns table(activity_type text, used_count integer)
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_timezone text;
begin
  if v_user is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select coalesce(
           case when p.allowance_timezone is not null
                     and p.allowance_timezone_until > pg_catalog.now()
                then p.allowance_timezone else p.timezone end,
           'UTC'
         )
  into v_timezone
  from public.user_preferences p
  where p.user_id = v_user;

  if v_timezone is null
     or not exists (
       select 1 from pg_catalog.pg_timezone_names z where z.name = v_timezone
     ) then
    raise exception 'A valid saved IANA timezone is required'
      using errcode = '22023';
  end if;

  -- Delegate each count to the narrowly scoped private helper. The exposed
  -- RPC runs as invoker and never reads the private ledger directly.
  return query
  select requested.activity_type,
         private.current_learning_allowance_usage(v_user,requested.activity_type,v_timezone)
  from (values
    ('lesson'),
    ('daily_topic'),
    ('daily_application'),
    ('daily_discovery'),
    ('daily_revision')
  ) as requested(activity_type)
  order by requested.activity_type;
end;
$function$;

revoke all on function public.get_my_learning_allowance_usage()
  from public, anon;
grant execute on function public.get_my_learning_allowance_usage()
  to authenticated;

-- Replace the completion-event trigger function. It still records history,
-- but the private ledger—not the history table—now enforces quota.
create or replace function public.enforce_learning_daily_limit()
returns trigger
language plpgsql
security definer
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

  -- Historical/start-only events are recorded but never consume or require
  -- a completion allowance. Only successful completion events are charged.
  if new.event_type <> 'completed' then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text, 0)
  );

  select coalesce(
           case when p.allowance_timezone is not null
                     and p.allowance_timezone_until > pg_catalog.now()
                then p.allowance_timezone else p.timezone end,
           'UTC'
         )
  into v_timezone
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

  insert into private.learning_allowance_usage
    (user_id, activity_type, window_start, window_end, used_count)
  values
    (new.user_id, new.activity_type, v_start, v_end, 1)
  on conflict (user_id, activity_type)
  do update
  set window_start = excluded.window_start,
      window_end = excluded.window_end,
      used_count = case
        when private.learning_allowance_usage.window_start = excluded.window_start
         and private.learning_allowance_usage.window_end = excluded.window_end
        then private.learning_allowance_usage.used_count + 1
        else 1
      end,
      updated_at = pg_catalog.now()
  where private.learning_allowance_usage.window_start is distinct from excluded.window_start
     or private.learning_allowance_usage.window_end is distinct from excluded.window_end
     or private.learning_allowance_usage.used_count < v_limit
  returning used_count into v_used;

  if not found then
    select u.used_count into v_used
    from private.learning_allowance_usage u
    where u.user_id = new.user_id
      and u.activity_type = new.activity_type;

    raise exception 'Daily learning completion limit reached'
      using errcode = 'P0001',
            detail = pg_catalog.json_build_object(
              'activity_type', new.activity_type,
              'daily_limit', v_limit,
              'used', coalesce(v_used, v_limit),
              'timezone', v_timezone,
              'resets_at', v_end
            )::text;
  end if;

  return new;
end;
$function$;

-- Daily Activity session start checks the ledger too. Starting/resuming remains
-- free; the completion trigger above is the only place that increments usage.
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
  v_language text;
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
     or (p_topic_id is not null and (p_topic_id <> pg_catalog.btrim(p_topic_id) or pg_catalog.char_length(p_topic_id) < 1 or pg_catalog.char_length(p_topic_id) > 120))
     or (p_difficulty is not null and p_difficulty not in ('beginner','intermediate','advanced'))
     or p_source is null
     or p_source not in ('daily','adaptive_revision')
     or (p_activity_type = 'daily_revision' and (p_source <> 'adaptive_revision' or p_topic_id is null))
     or (p_source = 'adaptive_revision' and p_activity_type <> 'daily_revision') then
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

  select case
           when p.allowance_timezone is not null
                and p.allowance_timezone_until > pg_catalog.now()
           then p.allowance_timezone
           else p.timezone
         end,
         p.learning_language,
         case p_activity_type
           when 'daily_topic' then p.daily_topic_enabled
           when 'daily_application' then p.daily_application_enabled
           when 'daily_discovery' then p.daily_discovery_enabled
           when 'daily_revision' then p.daily_revision_enabled
         end
  into v_timezone, v_language, v_preference_enabled
  from public.user_preferences p
  where p.user_id = v_user;

  if not found or v_timezone is null
     or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = v_timezone) then
    raise exception 'A valid saved IANA timezone is required'
      using errcode = '22023';
  end if;

  -- Replaying the same completed content in the same learning language is free,
  -- including when it is surfaced again on a later day.
  select * into v_session
  from public.daily_activity_sessions
  where user_id = v_user
    and activity_type = p_activity_type
    and content_id = p_content_id
    and language_code = v_language
    and status = 'completed'
  order by completed_at desc
  limit 1;

  if found then
    return v_session;
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

  select private.current_learning_allowance_usage(
    v_user, p_activity_type, v_timezone
  ) into v_used;

  if v_used >= v_limit then
    raise exception 'Daily learning completion limit reached'
      using errcode = 'P0001';
  end if;

  perform pg_catalog.set_config(
    'swiftdictionary.daily_start_rpc', 'on', true
  );

  insert into public.daily_activity_sessions
    (user_id, activity_type, language_code, content_id, topic_id, difficulty, source,
     local_date, timezone, status)
  values
    (v_user, p_activity_type, v_language, p_content_id, p_topic_id, p_difficulty, p_source,
     v_local_date, v_timezone, 'in_progress')
  returning * into v_session;

  if not found then
    raise exception 'Daily activity session could not be started'
      using errcode = '40001';
  end if;

  perform pg_catalog.set_config(
    'swiftdictionary.daily_start_rpc', 'off', true
  );

  return v_session;
end;
$function$;

commit;
