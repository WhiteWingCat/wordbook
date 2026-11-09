-- SwiftDictionary Update 2.2.0: owner-authorized testing allowance bypass.
-- Only trusted auth.users.raw_app_meta_data (JWT app_metadata) can enable this.
-- The bypass is scoped to lesson starts; all starts are still recorded in learning_activity_log.
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

  -- Explicitly granted by a trusted administrator in auth.users.raw_app_meta_data.
  -- Never use user-editable user_metadata for authorization.
  if new.activity_type = 'lesson'
     and coalesce((auth.jwt() -> 'app_metadata' ->> 'swift_dictionary_testing_bypass')::boolean, false) then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text, 0)
  );

  select coalesce(p.timezone, 'UTC')
    into v_timezone
    from public.user_preferences p
    where p.user_id = new.user_id;

  if not exists (select 1 from pg_catalog.pg_timezone_names where name = v_timezone) then
    raise exception 'Invalid IANA timezone in user preferences'
      using errcode = '22023';
  end if;

  select e.plan_code, e.status, e.valid_from, e.valid_until
    into v_plan, v_status, v_valid_from, v_valid_until
    from public.user_entitlements e
    where e.user_id = new.user_id;

  if not found
     or v_status <> 'active'
     or (v_valid_from is not null and now() < v_valid_from)
     or (v_valid_until is not null and now() >= v_valid_until) then
    v_plan := 'free';
  end if;

  select l.daily_limit, l.is_enabled
    into v_limit, v_enabled
    from public.learning_plan_limits l
    where l.plan_code = v_plan and l.activity_type = new.activity_type;

  if not found or not v_enabled then
    raise exception 'This learning activity is currently unavailable'
      using errcode = '42501';
  end if;

  v_start := (((now() at time zone v_timezone)::date)::timestamp at time zone v_timezone);
  v_end := ((((now() at time zone v_timezone)::date + 1)::timestamp) at time zone v_timezone);

  select count(*)::integer
    into v_used
    from public.learning_activity_log a
    where a.user_id = new.user_id
      and a.activity_type = new.activity_type
      and a.created_at >= v_start
      and a.created_at < v_end;

  if v_used >= v_limit then
    raise exception 'Daily learning limit reached'
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
