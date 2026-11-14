\set ON_ERROR_STOP on
begin;

-- Deterministic, fictional test accounts; all data rolls back at the end.
insert into auth.users(id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc')
on conflict (id) do nothing;

insert into public.user_preferences(user_id,learning_language,translation_language,timezone)
values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','en','zh','Asia/Kuala_Lumpur'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','en','zh','Asia/Kuala_Lumpur'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','en','zh','Asia/Kuala_Lumpur')
on conflict (user_id) do update set
  learning_language=excluded.learning_language,
  translation_language=excluded.translation_language,
  timezone=excluded.timezone;

insert into public.user_entitlements(user_id,plan_code,status)
values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','free','active'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','premium','active'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','free','active')
on conflict (user_id) do update set
  plan_code=excluded.plan_code,status='active',valid_from=null,valid_until=null;

-- Isolated local quota fixtures use the confirmed target limits, without
-- modifying the connected production project.
update public.learning_plan_limits set daily_limit=1,is_enabled=true
where plan_code='free' and activity_type='quiz';
update public.learning_plan_limits set daily_limit=3,is_enabled=true
where plan_code='premium' and activity_type='quiz';

insert into private.learning_content_catalog(
  activity_type,content_id,topic_id,difficulty,language_code,is_active
)
select
  'permanent_lesson',
  d.prefix||'-lesson-'||n,
  'topic-'||n,
  d.difficulty,
  'en',
  true
from (values ('b','beginner'),('i','intermediate'),('a','advanced')) d(prefix,difficulty)
cross join generate_series(1,5) n
on conflict (activity_type,content_id,language_code)
do update set topic_id=excluded.topic_id,difficulty=excluded.difficulty,is_active=true;

-- Synthetic bank: 3-session target capacity for all three difficulties,
-- with five distinct topics and five approved lesson mappings.
insert into private.quiz_question_bank(
  question_id,revision,learning_language_code,translation_language_code,
  source_lesson_id,topic_id,difficulty,prompt_learning,prompt_translation,
  options,correct_option_id,explanation_learning,explanation_translation,status
)
select
  prefix||'-'||n,1,'en','zh',
  prefix||'-lesson-'||(((n-1)%5)+1),
  'topic-'||(((n-1)%5)+1),
  difficulty,
  'Select the correct answer for '||prefix||' question '||n||'.',
  '请选择'||prefix||'第'||n||'题的正确答案。',
  '[{"id":"a","learning_text":"Correct","translation_text":"正确"},{"id":"b","learning_text":"Wrong one","translation_text":"错误一"},{"id":"c","learning_text":"Wrong two","translation_text":"错误二"},{"id":"d","learning_text":"Wrong three","translation_text":"错误三"}]'::jsonb,
  'a',
  'The first option is correct.',
  '第一个选项是正确答案。',
  'approved'
from (
  select 'b' prefix,'beginner' difficulty,n from generate_series(1,30) n
  union all
  select 'i','intermediate',n from generate_series(1,36) n
  union all
  select 'a','advanced',n from generate_series(1,48) n
) bank;

insert into auth.sessions(id,user_id,created_at,not_after)
values
 (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  now(),
  now()+interval '1 hour'
 ),
 (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  now(),
  now()+interval '1 hour'
 )
on conflict (id) do update set
  user_id=excluded.user_id,created_at=excluded.created_at,not_after=excluded.not_after;

create temporary table quiz_test_refs(
  user_a_session_id uuid,
  user_c_used_ids text[]
);
grant select,insert on quiz_test_refs to authenticated;

set local role authenticated;

-- Test User A: Free plan, abandoned questions remain reserved, one completion/day.
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","session_id":"dddddddd-dddd-4ddd-8ddd-dddddddddddd"}',true);

do $test$
declare
  v_availability jsonb;
  v_first jsonb;
  v_second jsonb;
  v_saved jsonb;
  v_result jsonb;
  v_q jsonb;
  v_question_id text;
  v_first_ids text[];
  v_second_ids text[];
  v_session_id uuid;
  v_count integer;
  v_max_topic integer;
  v_failed boolean;
begin
  v_availability:=public.get_my_quiz_availability();
  if jsonb_array_length(v_availability->'difficulties')<>3
     or exists (
       select 1 from jsonb_array_elements(v_availability->'difficulties') d
       where not coalesce((d->>'available')::boolean,false)
          or not coalesce((d->>'bank_target_met')::boolean,false)
     ) then
    raise exception 'All three difficulties should meet the seeded target bank and be available';
  end if;
  if v_availability->'allowance'->>'daily_limit'<>'1' then
    raise exception 'Free Quiz allowance must be one per local day';
  end if;

  v_first:=public.start_my_quiz('beginner');
  v_session_id:=(v_first->>'session_id')::uuid;
  if v_first->>'status'<>'in_progress'
     or jsonb_array_length(v_first->'questions')<>10 then
    raise exception 'Beginner Quiz did not create exactly ten questions';
  end if;
  if (v_first->'questions'->0) ? 'correct_option_id'
     or (v_first->'questions'->0) ? 'explanation_learning' then
    raise exception 'Active Quiz payload leaked answer keys or explanations';
  end if;
  select max(question_total)::integer into v_max_topic
  from (
    select count(*) question_total
    from jsonb_array_elements(v_first->'questions') q
    group by q->>'topic_id'
  ) topic_counts;
  if v_max_topic>4 then
    raise exception 'A topic supplied more than 40 percent of the Beginner Quiz';
  end if;
  if (select count(distinct q->>'topic_id') from jsonb_array_elements(v_first->'questions') q)<3 then
    raise exception 'Beginner Quiz did not cover at least three topics';
  end if;

  select array_agg(q->>'question_id') into v_first_ids
  from jsonb_array_elements(v_first->'questions') q;

  v_result:=public.get_my_active_quiz();
  if v_result->>'session_id'<>v_first->>'session_id' then
    raise exception 'Active Quiz could not be resumed';
  end if;

  perform public.abandon_my_quiz(v_session_id);
  if public.test_current_quiz_usage()<>0 then
    raise exception 'Abandoning a Quiz must not consume allowance';
  end if;

  v_second:=public.start_my_quiz('beginner');
  if jsonb_array_length(v_second->'questions')<>10 then
    raise exception 'Second Beginner Quiz did not start after abandonment';
  end if;
  select array_agg(q->>'question_id') into v_second_ids
  from jsonb_array_elements(v_second->'questions') q;
  if v_first_ids && v_second_ids then
    raise exception 'A question was repeated on the same local day after abandonment';
  end if;

  -- Change an answer before submission, then save all answers.
  v_q:=v_second->'questions'->0;
  v_saved:=public.save_my_quiz_answer(
    (v_second->>'session_id')::uuid,v_q->>'question_id','b',1
  );
  v_saved:=public.save_my_quiz_answer(
    (v_second->>'session_id')::uuid,v_q->>'question_id','a',1
  );
  for v_q in select value from jsonb_array_elements(v_second->'questions')
  loop
    v_saved:=public.save_my_quiz_answer(
      (v_second->>'session_id')::uuid,
      v_q->>'question_id',
      'a',
      (v_q->>'position')::integer
    );
  end loop;

  insert into pg_temp.quiz_test_refs(user_a_session_id)
  values ((v_second->>'session_id')::uuid);

  v_result:=public.submit_my_quiz((v_second->>'session_id')::uuid);
  if v_result->>'status'<>'completed'
     or v_result->>'correct_count'<>'10'
     or v_result->>'percentage'<>'100' then
    raise exception 'Server-side scoring or rounded percentage is incorrect';
  end if;
  if not ((v_result->'questions'->0) ? 'correct_option_id')
     or not ((v_result->'questions'->0) ? 'explanation_learning') then
    raise exception 'Completed review did not reveal the answer and explanation';
  end if;

  -- Duplicate submit is idempotent and must not charge a second completion.
  v_result:=public.submit_my_quiz((v_second->>'session_id')::uuid);
  v_count:=public.test_my_quiz_completed_event_count();
  if v_count<>1 then
    raise exception 'Repeated submit created more than one completion event';
  end if;
  if public.test_current_quiz_usage()<>1 then
    raise exception 'Free allowance ledger did not charge exactly once';
  end if;

  v_result:=public.get_my_quiz_history(20);
  if jsonb_array_length(v_result)<>1 then
    raise exception 'Completed Quiz history is missing or duplicated';
  end if;

  v_failed:=false;
  begin
    perform public.save_my_quiz_answer(
      (v_second->>'session_id')::uuid,
      v_second->'questions'->0->>'question_id','b',1
    );
  exception when others then v_failed:=true;
  end;
  if not v_failed then
    raise exception 'Completed Quiz answers remained editable';
  end if;

  v_failed:=false;
  begin
    perform public.start_my_quiz('beginner');
  exception when others then v_failed:=true;
  end;
  if not v_failed then
    raise exception 'Free user started a second Quiz after using the daily allowance';
  end if;
end;
$test$;

-- User B must not be able to inspect User A's completed session.
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
select set_config('request.jwt.claims','{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',true);
do $ownership$
declare v_failed boolean:=false;
begin
  begin
    perform public.get_my_quiz_review(
      (select user_a_session_id from pg_temp.quiz_test_refs limit 1)
    );
  exception when no_data_found then v_failed:=true;
  end;
  if not v_failed then
    raise exception 'Cross-account Quiz review access was not rejected';
  end if;
end;
$ownership$;

-- Premium user: exactly three completions/day, no same-day reuse between sessions,
-- and a fourth start is blocked by the server-side completion allowance.
do $premium$
declare
  v_session jsonb;
  v_result jsonb;
  v_q jsonb;
  v_seen text[]:='{}'::text[];
  v_current text[];
  v_session_id uuid;
  v_count integer;
  v_comp jsonb;
  v_failed boolean;
  v_round integer;
begin
  for v_round in 1..3 loop
    v_session:=public.start_my_quiz('intermediate');
    if v_session->>'status'<>'in_progress'
       or jsonb_array_length(v_session->'questions')<>15 then
      raise exception 'Premium Intermediate Quiz session did not start';
    end if;
    v_comp:=v_session->'source_composition';
    if coalesce((v_comp->>'intermediate')::integer,0) not in (7,8,12)
       or coalesce((v_comp->>'beginner')::integer,0) not in (3,7,8)
       or (coalesce((v_comp->>'intermediate')::integer,0)
          +coalesce((v_comp->>'beginner')::integer,0))<>15 then
      raise exception 'Intermediate Quiz source composition violates the approved ratios';
    end if;

    select array_agg(q->>'question_id') into v_current
    from jsonb_array_elements(v_session->'questions') q;
    if v_seen && v_current then
      raise exception 'Premium account received a same-day repeated question';
    end if;
    v_seen:=v_seen||v_current;

    v_session_id:=(v_session->>'session_id')::uuid;
    -- Attempting a second difficulty while active must return the existing session.
    if v_round=1 then
      v_result:=public.start_my_quiz('advanced');
      if v_result->>'status'<>'active_session_exists'
         or v_result->'session'->>'session_id'<>v_session->>'session_id' then
        raise exception 'One-active-session-per-account rule was not enforced';
      end if;
    end if;

    for v_q in select value from jsonb_array_elements(v_session->'questions')
    loop
      v_result:=public.save_my_quiz_answer(
        v_session_id,v_q->>'question_id','a',(v_q->>'position')::integer
      );
    end loop;
    v_result:=public.submit_my_quiz(v_session_id);
    if v_result->>'status'<>'completed' then
      raise exception 'Premium Quiz did not complete';
    end if;
  end loop;

  v_count:=public.test_current_quiz_usage();
  if v_count<>3 then raise exception 'Premium daily allowance did not charge three completions'; end if;

  v_failed:=false;
  begin
    perform public.start_my_quiz('intermediate');
  exception when others then v_failed:=true;
  end;
  if not v_failed then raise exception 'Premium user started a fourth Quiz on the same day'; end if;
end;
$premium$;

-- User C validates Advanced composition and cross-difficulty no-repeat after abandonment.
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
select set_config('request.jwt.claims','{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc"}',true);
do $advanced$
declare
  v_advanced jsonb;
  v_beginner jsonb;
  v_q jsonb;
  v_seen text[];
  v_new text[];
  v_comp jsonb;
begin
  v_advanced:=public.start_my_quiz('advanced');
  v_comp:=v_advanced->'source_composition';
  if (v_comp->>'intermediate')::integer<>4
     or (v_comp->>'advanced')::integer not between 12 and 16
     or (v_comp->>'beginner')::integer not between 0 and 4
     or ((v_comp->>'advanced')::integer+(v_comp->>'intermediate')::integer
         +(v_comp->>'beginner')::integer)<>20 then
    raise exception 'Advanced Quiz source composition violates the approved ratios';
  end if;
  select array_agg(q->>'question_id') into v_seen
  from jsonb_array_elements(v_advanced->'questions') q;
  perform public.abandon_my_quiz((v_advanced->>'session_id')::uuid);

  v_beginner:=public.start_my_quiz('beginner');
  select array_agg(q->>'question_id') into v_new
  from jsonb_array_elements(v_beginner->'questions') q;
  if v_seen && v_new then
    raise exception 'A question repeated across Advanced and Beginner on the same local day';
  end if;
  insert into pg_temp.quiz_test_refs(user_c_used_ids) values (v_seen||v_new);
  perform public.abandon_my_quiz((v_beginner->>'session_id')::uuid);
end;
$advanced$;


-- The Chinese course currently has no approved Quiz curriculum and must stay unavailable.
update public.user_preferences
set learning_language='zh'
where user_id=auth.uid();

do $unsupported_course$
declare
  v_availability jsonb;
  v_failed boolean:=false;
begin
  v_availability:=public.get_my_quiz_availability();
  if exists (
    select 1 from jsonb_array_elements(v_availability->'difficulties') d
    where coalesce((d->>'available')::boolean,false)
       or d->>'reason'<>'learning_course_not_supported'
  ) then
    raise exception 'Unsupported Chinese learning course was incorrectly offered';
  end if;

  begin
    perform public.start_my_quiz('beginner');
  exception when insufficient_privilege then
    v_failed:=true;
  end;
  if not v_failed then
    raise exception 'Quiz start accepted an unsupported learning course';
  end if;
end;
$unsupported_course$;


-- History deletion removes answer/session snapshots but retains the minimal
-- same-day question reservation ledger until its local-day retention expires.
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
select set_config('request.jwt.claims',
  '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","session_id":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"}',true);
do $c_history_delete$
begin
  perform public.delete_my_learning_history();
  if public.test_my_quiz_session_count()<>0 then
    raise exception 'Quiz session snapshots remained after history deletion';
  end if;
  if public.test_current_quiz_usage()<>0 then
    raise exception 'Abandoned history deletion changed the completion allowance';
  end if;
end;
$c_history_delete$;

update public.user_preferences
set learning_language='en'
where user_id=auth.uid();

do $c_no_repeat_after_delete$
declare
  v_session jsonb;
  v_new_ids text[];
  v_used_ids text[];
begin
  v_used_ids:=(select user_c_used_ids from pg_temp.quiz_test_refs where user_c_used_ids is not null limit 1);
  v_session:=public.start_my_quiz('beginner');
  select array_agg(q->>'question_id') into v_new_ids
  from jsonb_array_elements(v_session->'questions') q;
  if v_used_ids && v_new_ids then
    raise exception 'Same-day question reservation was lost when Quiz history was deleted';
  end if;
  perform public.abandon_my_quiz((v_session->>'session_id')::uuid);
end;
$c_no_repeat_after_delete$;

-- Recent-authenticated history deletion removes Quiz sessions but preserves allowance usage.
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","session_id":"dddddddd-dddd-4ddd-8ddd-dddddddddddd"}',true);
do $deletion$
declare
  v_result jsonb;
  v_count integer;
  v_used integer;
begin
  v_result:=public.delete_my_learning_history();
  if v_result->>'deleted'<>'true' then raise exception 'History deletion did not report success'; end if;
  v_count:=public.test_my_quiz_session_count();
  if v_count<>0 then raise exception 'Quiz history was not deleted'; end if;
  v_used:=public.test_current_quiz_usage();
  if v_used<>1 then raise exception 'History deletion incorrectly reset the Quiz allowance ledger'; end if;
end;
$deletion$;

-- Security grants: anonymous has no Quiz RPC execute rights; authenticated has wrappers.
do $security$
begin
  if has_function_privilege('anon','public.start_my_quiz(text)','EXECUTE')
     or has_function_privilege('anon','public.submit_my_quiz(uuid)','EXECUTE')
     or has_function_privilege('anon','public.get_my_quiz_review(uuid)','EXECUTE') then
    raise exception 'Anonymous role can execute a Quiz RPC';
  end if;
  if not has_function_privilege('authenticated','public.start_my_quiz(text)','EXECUTE')
     or not has_function_privilege('authenticated','public.submit_my_quiz(uuid)','EXECUTE') then
    raise exception 'Authenticated role is missing Quiz RPC execute grants';
  end if;
  if has_table_privilege('authenticated','private.quiz_question_bank','SELECT')
     or has_table_privilege('authenticated','private.quiz_sessions','SELECT')
     or has_table_privilege('authenticated','private.quiz_session_questions','SELECT')
     or has_table_privilege('authenticated','private.quiz_daily_question_reservations','SELECT') then
    raise exception 'Authenticated role has direct Quiz table access';
  end if;
  if not (
    select relrowsecurity
    from pg_catalog.pg_class
    where oid='private.quiz_daily_question_reservations'::regclass
  ) then
    raise exception 'Daily question reservation ledger does not have RLS enabled';
  end if;
end;
$security$;

reset role;
rollback;
