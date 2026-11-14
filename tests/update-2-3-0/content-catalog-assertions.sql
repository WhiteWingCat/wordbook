-- Privacy-first approved content catalogue and global Daily Discovery schedule assertions.
-- Run in disposable Supabase/PostgreSQL only, after catalogue + allowance + Daily Learning migrations.

do $$
begin
  if (select count(*) from private.learning_content_catalog where activity_type='daily_topic' and is_active) <> 28 then
    raise exception 'Expected 28 approved Daily Topic IDs';
  end if;
  if (select count(*) from private.learning_content_catalog where activity_type='daily_application' and is_active) <> 25 then
    raise exception 'Expected 25 approved Daily Application IDs';
  end if;
  if (select count(*) from private.learning_content_catalog where activity_type='daily_discovery' and is_active) <> 93 then
    raise exception 'Expected 93 approved Daily Discovery word IDs';
  end if;
  if (select count(distinct rotation_order) from private.learning_content_catalog where activity_type='daily_discovery' and is_active) <> 93
     or (select min(rotation_order) from private.learning_content_catalog where activity_type='daily_discovery' and is_active) <> 1
     or (select max(rotation_order) from private.learning_content_catalog where activity_type='daily_discovery' and is_active) <> 93 then
    raise exception 'Daily Discovery rotation order must be unique and contiguous from 1 to 93';
  end if;
  if exists (select 1 from private.learning_content_catalog where activity_type <> 'daily_discovery' and rotation_order is not null) then
    raise exception 'Only Daily Discovery entries may have a rotation order';
  end if;
  if (select count(*) from private.learning_content_catalog where activity_type='permanent_lesson' and is_active) <> 15 then
    raise exception 'Expected 15 approved permanent lesson IDs';
  end if;

  if has_table_privilege('anon','private.learning_content_catalog','SELECT')
     or has_table_privilege('authenticated','private.learning_content_catalog','SELECT') then
    raise exception 'Client roles can read the private content catalogue';
  end if;
  if has_function_privilege('anon','private.is_approved_learning_content(text,text,text,text,text,text)','EXECUTE') then
    raise exception 'Anonymous users can execute the private content validator';
  end if;
  if not has_function_privilege('authenticated','private.is_approved_learning_content(text,text,text,text,text,text)','EXECUTE') then
    raise exception 'Authenticated RPC callers cannot execute the private content validator';
  end if;
  if not (select relrowsecurity from pg_catalog.pg_class where oid='private.learning_content_catalog'::regclass) then
    raise exception 'Private content catalogue must have RLS enabled';
  end if;
end;
$$;

begin;
insert into auth.users(id) values
  ('77777777-7777-4777-8777-777777777777'),
  ('88888888-8888-4888-8888-888888888888');
insert into public.user_preferences(user_id,timezone,learning_language)
values
  ('77777777-7777-4777-8777-777777777777','Asia/Kuala_Lumpur','en'),
  ('88888888-8888-4888-8888-888888888888','Asia/Kuala_Lumpur','en');
insert into public.user_entitlements(user_id,plan_code,status)
values
  ('77777777-7777-4777-8777-777777777777','free','active'),
  ('88888888-8888-4888-8888-888888888888','premium','active');

select set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',true);
set local role authenticated;

do $$
declare
  v_day date := (pg_catalog.now() at time zone 'UTC')::date;
  v_day_text text := pg_catalog.to_char((pg_catalog.now() at time zone 'UTC')::date,'YYYY-MM-DD');
  v_pool_size integer;
  v_first_order integer;
  v_ids text[];
begin
  select pg_catalog.count(*) into v_pool_size
  from private.learning_content_catalog
  where activity_type='daily_discovery' and is_active and rotation_order is not null;

  v_first_order :=
    pg_catalog.mod(pg_catalog.mod((v_day - date '2026-11-15') * 3,v_pool_size)
      + v_pool_size,v_pool_size) + 1;

  select pg_catalog.array_agg(c.content_id order by s.slot) into v_ids
  from pg_catalog.generate_series(0,3) as s(slot)
  join private.learning_content_catalog c
    on c.rotation_order = pg_catalog.mod(v_first_order - 1 + s.slot,v_pool_size) + 1
  where c.activity_type='daily_discovery' and c.is_active;

  if not private.is_approved_learning_content(
    'permanent_lesson','b-sentence','sentence-basics','beginner','en','daily'
  ) then raise exception 'Valid permanent lesson was rejected'; end if;

  if private.is_approved_learning_content(
    'permanent_lesson','b-sentence','verb-tenses','beginner','en','daily'
  ) then raise exception 'Permanent lesson topic mismatch was accepted'; end if;

  if private.is_approved_learning_content(
    'daily_topic','topic-present-perfect-01','sentence-basics','intermediate','en','daily'
  ) then raise exception 'Daily Topic topic mismatch was accepted'; end if;

  if private.is_approved_learning_content(
    'daily_application','application-articles-01','nouns-and-articles','advanced','en','daily'
  ) then raise exception 'Daily Application difficulty mismatch was accepted'; end if;

  if not private.is_approved_learning_content(
    'daily_discovery',v_ids[1] || ':' || v_day_text,null,null,'en','daily'
  ) then raise exception 'Free plan was not allowed to access today's first global Discovery entry'; end if;

  if private.is_approved_learning_content(
    'daily_discovery',v_ids[2] || ':' || v_day_text,null,null,'en','daily'
  ) then raise exception 'Free plan was allowed to access the second global Discovery entry'; end if;

  if private.is_approved_learning_content(
    'daily_discovery','discovery-not-in-catalogue:' || v_day_text,null,null,'en','daily'
  ) then raise exception 'Unknown Daily Discovery word was accepted'; end if;

  if private.is_approved_learning_content(
    'daily_discovery',v_ids[1] || ':' || pg_catalog.to_char(v_day - 1,'YYYY-MM-DD'),null,null,'en','daily'
  ) then raise exception 'A stale UTC Daily Discovery date was accepted for a new session'; end if;

  if private.is_approved_learning_content(
    'daily_discovery',v_ids[1] || ':not-a-date',null,null,'en','daily'
  ) then raise exception 'Daily Discovery with an invalid global date was accepted'; end if;

  if private.is_approved_learning_content(
    'daily_discovery',v_ids[1] || ':2026-02-30',null,null,'en','daily'
  ) then raise exception 'Daily Discovery with an impossible calendar date was accepted'; end if;

  if private.is_approved_learning_content(
    'daily_discovery',v_ids[1] || ':' || v_day_text,'forged-topic',null,'en','daily'
  ) then raise exception 'Daily Discovery with a forged topic was accepted'; end if;

  -- A Free user cannot bypass the hidden second/third entries by calling the public RPC directly.
  begin
    perform public.start_daily_activity_session(
      'daily_discovery',v_ids[2] || ':' || v_day_text,null,null,'daily'
    );
    raise exception 'Free plan RPC accepted the second Discovery entry';
  exception when sqlstate '22023' then
    null;
  end;

  -- The first scheduled entry remains startable for Free.
  perform public.start_daily_activity_session(
    'daily_discovery',v_ids[1] || ':' || v_day_text,null,null,'daily'
  );

  -- Switch the JWT identity to the separate Premium fixture account.
  perform pg_catalog.set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);

  if not private.is_approved_learning_content(
    'daily_discovery',v_ids[1] || ':' || v_day_text,null,null,'en','daily'
  ) or not private.is_approved_learning_content(
    'daily_discovery',v_ids[2] || ':' || v_day_text,null,null,'en','daily'
  ) or not private.is_approved_learning_content(
    'daily_discovery',v_ids[3] || ':' || v_day_text,null,null,'en','daily'
  ) then raise exception 'Premium plan could not access all three scheduled Discovery entries'; end if;

  if private.is_approved_learning_content(
    'daily_discovery',v_ids[4] || ':' || v_day_text,null,null,'en','daily'
  ) then raise exception 'Premium plan was allowed to access an unscheduled fourth Discovery entry'; end if;

  perform public.start_daily_activity_session(
    'daily_discovery',v_ids[2] || ':' || v_day_text,null,null,'daily'
  );

  if (select count(*) from public.daily_activity_sessions
      where user_id=auth.uid() and activity_type='daily_discovery'
        and content_id=v_ids[2] || ':' || v_day_text and status='in_progress') <> 1 then
    raise exception 'Premium plan could not start a scheduled second Discovery entry';
  end if;

  -- Return to the Free fixture for the remaining catalogue/RPC checks.
  perform pg_catalog.set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',true);

  if not private.is_approved_learning_content(
    'daily_revision',
    'revision:verb-tenses:application-verb-patterns-01:2026-11-13:1',
    'verb-tenses','intermediate','en','adaptive_revision'
  ) then raise exception 'Valid adaptive revision source was rejected'; end if;

  if private.is_approved_learning_content(
    'daily_revision',
    'revision:verb-tenses:application-articles-01:2026-11-13:1',
    'verb-tenses','beginner','en','adaptive_revision'
  ) then raise exception 'Adaptive revision with mismatched topic was accepted'; end if;

  if private.is_approved_learning_content(
    'daily_revision',
    'revision:verb-tenses:application-verb-patterns-01:2026-11-13:1',
    'verb-tenses','intermediate','zh','adaptive_revision'
  ) then raise exception 'Uncatalogued translation language was accepted'; end if;

  -- The public RPC rejects forged topic metadata before creating a session.
  begin
    perform public.start_daily_activity_session(
      'daily_topic','topic-present-perfect-01','forged-topic','intermediate','daily'
    );
    raise exception 'Daily Topic RPC accepted a forged topic mapping';
  exception when sqlstate '22023' then
    null;
  end;

  perform public.start_daily_activity_session(
    'daily_topic','topic-present-perfect-01','verb-tenses','intermediate','daily'
  );

  if (select count(*) from public.daily_activity_sessions
      where user_id=auth.uid() and content_id='topic-present-perfect-01'
        and status='in_progress') <> 1 then
    raise exception 'Valid catalogue item did not create exactly one daily session';
  end if;
end;
$$;
rollback;
