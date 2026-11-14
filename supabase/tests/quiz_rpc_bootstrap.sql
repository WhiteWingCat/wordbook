-- Test-only Supabase/Auth and existing learning-schema compatibility layer.
-- Runs only inside the disposable PostgreSQL 17 GitHub Actions service.

create role anon nologin;
create role authenticated nologin;
create schema auth;
create schema private;

create table auth.users (
  id uuid primary key
);
create table auth.sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  not_after timestamptz
);

create or replace function auth.uid()
returns uuid
language sql stable
set search_path=''
as $$
  select coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.sub',true),''),
    nullif(pg_catalog.current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub'
  )::uuid
$$;

create or replace function auth.jwt()
returns jsonb
language sql stable
set search_path=''
as $$
  select coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claims',true),'')::jsonb,
    '{}'::jsonb
  )
$$;

grant usage on schema auth to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
grant execute on function auth.jwt() to anon,authenticated;

create table public.languages (
  code text primary key,
  name text not null,
  native_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.languages(code,name,native_name)
values ('en','English','English'),('zh','Chinese','中文');

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  learning_language text not null default 'en' references public.languages(code),
  translation_language text not null default 'zh' references public.languages(code),
  timezone text not null default 'UTC',
  allowance_timezone text,
  allowance_timezone_until timestamptz
);

create table public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_code text not null check(plan_code in ('free','premium')),
  status text not null default 'active',
  valid_from timestamptz,
  valid_until timestamptz
);

create table public.learning_plan_limits (
  plan_code text not null check(plan_code in ('free','premium')),
  activity_type text not null,
  daily_limit integer not null,
  is_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key(plan_code,activity_type)
);
insert into public.learning_plan_limits(plan_code,activity_type,daily_limit)
values ('free','quiz',1),('premium','quiz',3);

create table private.learning_allowance_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  used_count integer not null check(used_count>=0),
  updated_at timestamptz not null default now(),
  primary key(user_id,activity_type)
);

create or replace function private.current_learning_allowance_usage(
  p_user_id uuid,p_activity_type text,p_timezone text
)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_used integer;
begin
  if auth.uid() is null or auth.uid()<>p_user_id then
    raise exception 'Authentication required for own allowance usage' using errcode='42501';
  end if;
  v_start:=(((pg_catalog.now() at time zone p_timezone)::date)::timestamp at time zone p_timezone);
  v_end:=((((pg_catalog.now() at time zone p_timezone)::date+1)::timestamp) at time zone p_timezone);
  select used_count into v_used from private.learning_allowance_usage
  where user_id=p_user_id and activity_type=p_activity_type
    and window_start=v_start and window_end=v_end;
  return coalesce(v_used,0);
end;
$$;

create or replace function private.is_learning_limit_exempt()
returns boolean
language sql stable security definer set search_path=''
as $$ select false $$;

create table public.learning_activity_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null,
  language_code text not null references public.languages(code),
  created_at timestamptz not null default now(),
  event_type text not null check(event_type in ('started','completed'))
);

create or replace function public.enforce_learning_daily_limit()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_timezone text;
  v_plan text;
  v_limit integer;
  v_enabled boolean;
  v_start timestamptz;
  v_end timestamptz;
  v_used integer;
begin
  if auth.uid() is null or auth.uid()<>new.user_id then
    raise exception 'Authentication required for own learning activity' using errcode='42501';
  end if;
  new.created_at:=pg_catalog.now();
  if new.event_type<>'completed' then return new; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text,0));

  select coalesce(
    case when p.allowance_timezone is not null and p.allowance_timezone_until>pg_catalog.now()
      then p.allowance_timezone else p.timezone end,'UTC'
  ) into v_timezone
  from public.user_preferences p where p.user_id=new.user_id;

  if not exists(select 1 from pg_catalog.pg_timezone_names where name=v_timezone) then
    raise exception 'Invalid IANA timezone' using errcode='22023';
  end if;

  select e.plan_code into v_plan from public.user_entitlements e
  where e.user_id=new.user_id and e.status='active'
    and (e.valid_from is null or e.valid_from<=pg_catalog.now())
    and (e.valid_until is null or e.valid_until>pg_catalog.now());
  v_plan:=coalesce(v_plan,'free');

  select l.daily_limit,l.is_enabled into v_limit,v_enabled
  from public.learning_plan_limits l
  where l.plan_code=v_plan and l.activity_type=new.activity_type;
  if not found or not v_enabled then
    raise exception 'This learning activity is currently unavailable' using errcode='42501';
  end if;
  if new.activity_type='lesson' and private.is_learning_limit_exempt() then return new; end if;

  v_start:=(((pg_catalog.now() at time zone v_timezone)::date)::timestamp at time zone v_timezone);
  v_end:=((((pg_catalog.now() at time zone v_timezone)::date+1)::timestamp) at time zone v_timezone);
  insert into private.learning_allowance_usage(user_id,activity_type,window_start,window_end,used_count)
  values(new.user_id,new.activity_type,v_start,v_end,1)
  on conflict(user_id,activity_type) do update
  set window_start=excluded.window_start,
      window_end=excluded.window_end,
      used_count=case
        when private.learning_allowance_usage.window_start=excluded.window_start
         and private.learning_allowance_usage.window_end=excluded.window_end
        then private.learning_allowance_usage.used_count+1 else 1 end,
      updated_at=pg_catalog.now()
  where private.learning_allowance_usage.window_start is distinct from excluded.window_start
     or private.learning_allowance_usage.window_end is distinct from excluded.window_end
     or private.learning_allowance_usage.used_count<v_limit
  returning used_count into v_used;

  if not found then
    raise exception 'Daily learning completion limit reached'
      using errcode='P0001',detail='{"activity_type":"quiz"}';
  end if;
  return new;
end;
$$;

create trigger enforce_learning_daily_limit_before_insert
before insert on public.learning_activity_log
for each row execute function public.enforce_learning_daily_limit();

create table private.learning_content_catalog (
  activity_type text not null,
  content_id text not null,
  language_code text not null,
  is_active boolean not null default true,
  primary key(activity_type,content_id,language_code)
);
insert into private.learning_content_catalog(activity_type,content_id,language_code)
select 'permanent_lesson','lesson-'||n,'en'
from generate_series(1,5) n;

create table public.daily_activity_sessions(user_id uuid not null);
create table public.lesson_practice_results(user_id uuid not null);
create table public.lesson_progress(user_id uuid not null);

grant usage on schema public to anon,authenticated;
grant select,update on public.user_preferences to authenticated;


-- Test-only SECURITY DEFINER observers. They expose only the current fixture
-- user's aggregate assertions and are never installed by a production migration.
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
