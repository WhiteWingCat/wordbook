-- Supabase Local Stack contract checks for Update 2.3.0.
-- Runs only against the disposable Supabase CLI stack in GitHub Actions.
-- It does not connect to, link, or modify the hosted SwiftDictionary project.

do $$
declare
  v_missing text[];
  v_uid uuid := '11111111-1111-4111-8111-111111111111';
begin
  select array_agg(required.column_name order by required.column_name)
    into v_missing
  from (values ('id'), ('user_id'), ('created_at'), ('not_after')) as required(column_name)
  where not exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'auth'
      and c.table_name = 'sessions'
      and c.column_name = required.column_name
  );

  if v_missing is not null then
    raise exception 'Supabase auth.sessions is missing expected columns: %', v_missing;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'anon')
     or not exists (select 1 from pg_roles where rolname = 'authenticated')
     or not exists (select 1 from pg_roles where rolname = 'service_role') then
    raise exception 'Expected Supabase API roles are not present';
  end if;

  if to_regprocedure('auth.uid()') is null
     or to_regprocedure('auth.jwt()') is null then
    raise exception 'Expected Supabase Auth helper functions are not present';
  end if;

  if not has_function_privilege('authenticated', 'auth.uid()', 'EXECUTE')
     or not has_function_privilege('authenticated', 'auth.jwt()', 'EXECUTE') then
    raise exception 'Authenticated role cannot execute the expected Auth helpers';
  end if;

  perform set_config('request.jwt.claim.sub', v_uid::text, true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_uid, 'session_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')::text,
    true
  );

  if auth.uid() is distinct from v_uid then
    raise exception 'auth.uid() did not resolve the request subject as expected';
  end if;

  if auth.jwt() ->> 'session_id' is distinct from 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' then
    raise exception 'auth.jwt() did not expose the session_id claim as expected';
  end if;

  raise notice 'Supabase local Auth contract checks passed';
end
$$;
