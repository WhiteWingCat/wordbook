-- Privacy-first approved content catalogue assertions.
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
insert into auth.users(id) values ('77777777-7777-4777-8777-777777777777');
insert into public.user_preferences(user_id,timezone,learning_language)
values ('77777777-7777-4777-8777-777777777777','Asia/Kuala_Lumpur','en');
insert into public.user_entitlements(user_id,plan_code,status)
values ('77777777-7777-4777-8777-777777777777','free','active');

select set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',true);
set local role authenticated;

do $$
begin
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
    'daily_discovery','discovery-word-meticulous-01:2026-11-14',null,null,'en','daily'
  ) then raise exception 'Valid date-scoped global Daily Discovery word was rejected'; end if;

  if private.is_approved_learning_content(
    'daily_discovery','discovery-not-in-catalogue:2026-11-14',null,null,'en','daily'
  ) then raise exception 'Unknown Daily Discovery word was accepted'; end if;

  if private.is_approved_learning_content(
    'daily_discovery','discovery-word-meticulous-01:not-a-date',null,null,'en','daily'
  ) then raise exception 'Daily Discovery with an invalid global date was accepted'; end if;

  if private.is_approved_learning_content(
    'daily_discovery','discovery-word-meticulous-01:2026-11-14','forged-topic',null,'en','daily'
  ) then raise exception 'Daily Discovery with a forged topic was accepted'; end if;

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

  -- The real public RPC must reject a forged topic before creating a session.
  begin
    perform public.start_daily_activity_session(
      'daily_topic','topic-present-perfect-01','forged-topic','intermediate','daily'
    );
    raise exception 'Daily Topic RPC accepted a forged topic mapping';
  exception when sqlstate '22023' then
    null;
  end;

  -- A valid catalogue entry is accepted and creates only the aggregate session row.
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
