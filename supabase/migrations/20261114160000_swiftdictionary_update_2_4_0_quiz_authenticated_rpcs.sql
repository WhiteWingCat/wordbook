-- SwiftDictionary Update 2.4.0 — authenticated Quiz RPCs and session lifecycle.
-- This migration is feature-branch work only. It must be validated locally/CI
-- and reviewed before any production application.
--
-- All authoritative state remains private. Public SECURITY INVOKER wrappers
-- call narrow SECURITY DEFINER implementations which derive the owner from
-- auth.uid(); no RPC accepts a user ID from the browser.

begin;

-- Preserve curriculum mappings in each issued snapshot so later bank edits
-- cannot rewrite the topic evidence used by Dashboard and Daily Revision.
alter table private.quiz_session_questions
  add column if not exists source_lesson_id text,
  add column if not exists topic_id text,
  add column if not exists source_difficulty text;

update private.quiz_session_questions sq
set source_lesson_id = qb.source_lesson_id,
    topic_id = qb.topic_id,
    source_difficulty = qb.difficulty
from private.quiz_question_bank qb
where qb.question_id = sq.question_id
  and qb.revision = sq.question_revision
  and (sq.source_lesson_id is null or sq.topic_id is null or sq.source_difficulty is null);

alter table private.quiz_session_questions
  alter column source_lesson_id set not null,
  alter column topic_id set not null,
  alter column source_difficulty set not null;

do $constraints$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid='private.quiz_session_questions'::regclass
      and conname='quiz_session_questions_source_difficulty_check'
  ) then
    alter table private.quiz_session_questions
      add constraint quiz_session_questions_source_difficulty_check
      check (source_difficulty in ('beginner','intermediate','advanced'));
  end if;
end;
$constraints$;

create or replace function private.guard_quiz_session_question_metadata()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.source_lesson_id is distinct from old.source_lesson_id
     or new.topic_id is distinct from old.topic_id
     or new.source_difficulty is distinct from old.source_difficulty then
    raise exception 'Quiz curriculum snapshot metadata is immutable'
      using errcode = '42501';
  end if;
  return new;
end;
$function$;

revoke all on function private.guard_quiz_session_question_metadata()
  from public, anon, authenticated;
drop trigger if exists guard_quiz_session_question_metadata
  on private.quiz_session_questions;
create trigger guard_quiz_session_question_metadata
before update on private.quiz_session_questions
for each row execute function private.guard_quiz_session_question_metadata();

-- Resolve the caller's server-owned plan, timezone, allowance and local day.
create or replace function private.quiz_request_context()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_timezone text;
  v_plan text := 'free';
  v_limit integer;
  v_enabled boolean;
  v_used integer;
  v_local_date date;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
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
     or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = v_timezone) then
    raise exception 'A valid saved IANA timezone is required' using errcode = '22023';
  end if;

  select e.plan_code
    into v_plan
  from public.user_entitlements e
  where e.user_id = v_user
    and e.status = 'active'
    and (e.valid_from is null or e.valid_from <= pg_catalog.now())
    and (e.valid_until is null or e.valid_until > pg_catalog.now());

  v_plan := coalesce(v_plan, 'free');

  select l.daily_limit, l.is_enabled
    into v_limit, v_enabled
  from public.learning_plan_limits l
  where l.plan_code = v_plan
    and l.activity_type = 'quiz';

  if not found then
    v_limit := 0;
    v_enabled := false;
  end if;
  v_limit := coalesce(v_limit,0);
  v_enabled := coalesce(v_enabled,false);

  v_local_date := (pg_catalog.now() at time zone v_timezone)::date;
  v_used := private.current_learning_allowance_usage(v_user, 'quiz', v_timezone);

  return pg_catalog.jsonb_build_object(
    'user_id', v_user,
    'timezone', v_timezone,
    'local_date', v_local_date,
    'plan_code', v_plan,
    'daily_limit', v_limit,
    'plan_enabled', v_enabled and v_limit > 0,
    'used_count', v_used,
    'remaining_count', greatest(v_limit - v_used, 0)
  );
end;
$function$;

-- Internal payload builder. Answer keys and explanations are included only
-- for a completed session explicitly requested for read-only review.
create or replace function private.quiz_session_payload(
  p_session_id uuid,
  p_include_review boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_session private.quiz_sessions%rowtype;
  v_payload jsonb;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_session
  from private.quiz_sessions s
  where s.id = p_session_id and s.user_id = v_user;

  if not found then
    raise exception 'Quiz session not found' using errcode = 'P0002';
  end if;

  if p_include_review and v_session.status <> 'completed' then
    raise exception 'Only completed Quizzes can be reviewed' using errcode = '42501';
  end if;

  select
    pg_catalog.jsonb_build_object(
      'session_id', v_session.id,
      'difficulty', v_session.difficulty,
      'status', v_session.status,
      'question_count', v_session.question_count,
      'current_position', v_session.current_position,
      'learning_language_code', v_session.learning_language_code,
      'translation_language_code', v_session.translation_language_code,
      'source_composition', v_session.source_composition,
      'started_at', v_session.started_at,
      'completed_at', v_session.completed_at,
      'correct_count', case when v_session.status = 'completed' then v_session.correct_count else null end,
      'percentage', case when v_session.status = 'completed' then v_session.percentage else null end,
      'questions', coalesce(
        pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'question_id', q.question_id,
            'source_lesson_id', q.source_lesson_id,
            'topic_id', q.topic_id,
            'source_difficulty', q.source_difficulty,
            'position', q.position,
            'prompt_learning', q.prompt_learning_snapshot,
            'prompt_translation', q.prompt_translation_snapshot,
            'options', (
              select pg_catalog.jsonb_agg(
                pg_catalog.jsonb_build_object(
                  'id', o.value ->> 'id',
                  'learning_text', o.value ->> 'learning_text',
                  'translation_text', o.value ->> 'translation_text'
                )
                order by pg_catalog.array_position(q.option_order, o.value ->> 'id')
              )
              from pg_catalog.jsonb_array_elements(q.options_snapshot) as o(value)
            ),
            'selected_option_id', q.selected_option_id
          ) ||
          case when p_include_review then
            pg_catalog.jsonb_build_object(
              'correct_option_id', q.correct_option_id_snapshot,
              'is_correct', q.selected_option_id = q.correct_option_id_snapshot,
              'explanation_learning', q.explanation_learning_snapshot,
              'explanation_translation', q.explanation_translation_snapshot
            )
          else '{}'::jsonb end
          order by q.position
        ),
        '[]'::jsonb
      )
    )
  into v_payload
  from private.quiz_session_questions q
  where q.session_id = v_session.id and q.user_id = v_user;

  return v_payload;
end;
$function$;

-- Availability reports the hard bank gate, preferred target, current unseen
-- inventory, allowance and active-session state. It never returns answer keys.
create or replace function private.get_my_quiz_availability_impl()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_ctx jsonb := private.quiz_request_context();
  v_user uuid := (v_ctx ->> 'user_id')::uuid;
  v_timezone text := v_ctx ->> 'timezone';
  v_day date := (v_ctx ->> 'local_date')::date;
  v_translation text;
  v_learning text;
  v_active uuid;
  v_b integer := 0;
  v_i integer := 0;
  v_a integer := 0;
  v_rb integer := 0;
  v_ri integer := 0;
  v_ra integer := 0;
  v_beginner_min boolean;
  v_intermediate_min boolean;
  v_advanced_min boolean;
  v_beginner_target boolean;
  v_intermediate_target boolean;
  v_advanced_target boolean;
  v_beginner_fresh boolean;
  v_intermediate_fresh boolean;
  v_advanced_fresh boolean;
  v_can_start boolean;
begin
  select p.learning_language,p.translation_language
    into v_learning,v_translation
  from public.user_preferences p where p.user_id = v_user;

  select s.id into v_active
  from private.quiz_sessions s
  where s.user_id = v_user and s.status = 'in_progress';

  select
    count(*) filter (where q.difficulty = 'beginner')::integer,
    count(*) filter (where q.difficulty = 'intermediate')::integer,
    count(*) filter (where q.difficulty = 'advanced')::integer
  into v_b, v_i, v_a
  from private.quiz_question_bank q
  join private.learning_content_catalog c
    on c.activity_type = 'permanent_lesson'
   and c.content_id = q.source_lesson_id
   and c.language_code = q.learning_language_code
   and c.is_active
  where q.status = 'approved'
    and q.learning_language_code = 'en'
    and q.translation_language_code = v_translation;

  select
    count(*) filter (where q.difficulty = 'beginner')::integer,
    count(*) filter (where q.difficulty = 'intermediate')::integer,
    count(*) filter (where q.difficulty = 'advanced')::integer
  into v_rb, v_ri, v_ra
  from private.quiz_question_bank q
  join private.learning_content_catalog c
    on c.activity_type = 'permanent_lesson'
   and c.content_id = q.source_lesson_id
   and c.language_code = q.learning_language_code
   and c.is_active
  where q.status = 'approved'
    and q.learning_language_code = 'en'
    and q.translation_language_code = v_translation
    and not exists (
      select 1 from private.quiz_session_questions issued
      where issued.user_id = v_user
        and issued.local_date = v_day
        and issued.question_id = q.question_id
    );

  v_beginner_min := v_learning = 'en' and v_b >= 20;
  v_intermediate_min := v_learning = 'en' and v_i >= 24 and v_b >= 16;
  v_advanced_min := v_learning = 'en' and v_a >= 32 and v_i >= 8 and v_b >= 8;
  v_beginner_target := v_learning = 'en' and v_b >= 30;
  v_intermediate_target := v_learning = 'en' and v_i >= 36 and v_b >= 24;
  v_advanced_target := v_learning = 'en' and v_a >= 48 and v_i >= 12 and v_b >= 12;

  v_beginner_fresh := v_rb >= 10;
  v_intermediate_fresh :=
       (v_ri >= 12 and v_rb >= 3)
    or (v_ri >= 8 and v_rb >= 7)
    or (v_ri >= 7 and v_rb >= 8);
  v_advanced_fresh := v_ri >= 4 and (
       (v_ra >= 16)
    or (v_ra >= 15 and v_rb >= 1)
    or (v_ra >= 14 and v_rb >= 2)
    or (v_ra >= 13 and v_rb >= 3)
    or (v_ra >= 12 and v_rb >= 4)
  );

  v_can_start := coalesce((v_ctx ->> 'plan_enabled')::boolean,false)
                 and (v_ctx ->> 'remaining_count')::integer > 0
                 and v_active is null;

  return pg_catalog.jsonb_build_object(
    'timezone', v_timezone,
    'local_date', v_day,
    'plan_code', v_ctx ->> 'plan_code',
    'allowance', pg_catalog.jsonb_build_object(
      'daily_limit', (v_ctx ->> 'daily_limit')::integer,
      'used_count', (v_ctx ->> 'used_count')::integer,
      'remaining_count', (v_ctx ->> 'remaining_count')::integer
    ),
    'active_session_id', v_active,
    'difficulties', pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'difficulty', 'beginner',
        'question_count', 10,
        'bank_minimum_met', v_beginner_min,
        'bank_target_met', v_beginner_target,
        'bank_counts', pg_catalog.jsonb_build_object('beginner',v_b),
        'remaining_counts', pg_catalog.jsonb_build_object('beginner',v_rb),
        'available', v_beginner_min and v_beginner_fresh and v_can_start,
        'reason', case
          when v_active is not null then 'active_session_exists'
          when v_learning is distinct from 'en' then 'learning_course_not_supported'
          when not coalesce((v_ctx ->> 'plan_enabled')::boolean,false) then 'plan_not_enabled'
          when (v_ctx ->> 'remaining_count')::integer < 1 then 'allowance_exhausted'
          when not v_beginner_min then 'question_bank_below_minimum'
          when not v_beginner_fresh then 'fresh_questions_unavailable_today'
          else null end
      ),
      pg_catalog.jsonb_build_object(
        'difficulty', 'intermediate',
        'question_count', 15,
        'bank_minimum_met', v_intermediate_min,
        'bank_target_met', v_intermediate_target,
        'bank_counts', pg_catalog.jsonb_build_object('beginner',v_b,'intermediate',v_i),
        'remaining_counts', pg_catalog.jsonb_build_object('beginner',v_rb,'intermediate',v_ri),
        'available', v_intermediate_min and v_intermediate_fresh and v_can_start,
        'reason', case
          when v_active is not null then 'active_session_exists'
          when v_learning <> 'en' then 'learning_course_not_supported'
          when (v_ctx ->> 'remaining_count')::integer < 1 then 'allowance_exhausted'
          when not v_intermediate_min then 'question_bank_below_minimum'
          when not v_intermediate_fresh then 'fresh_questions_unavailable_today'
          else null end
      ),
      pg_catalog.jsonb_build_object(
        'difficulty', 'advanced',
        'question_count', 20,
        'bank_minimum_met', v_advanced_min,
        'bank_target_met', v_advanced_target,
        'bank_counts', pg_catalog.jsonb_build_object('beginner',v_b,'intermediate',v_i,'advanced',v_a),
        'remaining_counts', pg_catalog.jsonb_build_object('beginner',v_rb,'intermediate',v_ri,'advanced',v_ra),
        'available', v_advanced_min and v_advanced_fresh and v_can_start,
        'reason', case
          when v_active is not null then 'active_session_exists'
          when v_learning <> 'en' then 'learning_course_not_supported'
          when (v_ctx ->> 'remaining_count')::integer < 1 then 'allowance_exhausted'
          when not v_advanced_min then 'question_bank_below_minimum'
          when not v_advanced_fresh then 'fresh_questions_unavailable_today'
          else null end
      )
    )
  );
end;
$function$;

create or replace function private.start_my_quiz_impl(p_difficulty text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_ctx jsonb;
  v_user uuid;
  v_timezone text;
  v_day date;
  v_translation text;
  v_learning text;
  v_active uuid;
  v_question_count integer;
  v_b integer := 0;
  v_i integer := 0;
  v_a integer := 0;
  v_comp jsonb;
  v_topic_counts jsonb := '{}'::jsonb;
  v_selected_ids text[] := '{}'::text[];
  v_selected_revisions integer[] := '{}'::integer[];
  v_topic_cap integer;
  v_added integer;
  v_needed integer;
  v_source text;
  v_q record;
  v_topic_count integer;
  v_topic_total integer;
  v_session uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_difficulty is null or p_difficulty not in ('beginner','intermediate','advanced') then
    raise exception 'Invalid Quiz difficulty' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 0));
  v_ctx := private.quiz_request_context();
  v_timezone := v_ctx ->> 'timezone';
  v_day := (v_ctx ->> 'local_date')::date;

  select p.learning_language,p.translation_language
    into v_learning,v_translation
  from public.user_preferences p where p.user_id = v_user;

  if v_learning is distinct from 'en' then
    raise exception 'Quiz currently supports the English learning course only'
      using errcode='42501', detail='learning_course_not_supported';
  end if;

  select s.id into v_active
  from private.quiz_sessions s
  where s.user_id = v_user and s.status = 'in_progress';

  if v_active is not null then
    return pg_catalog.jsonb_build_object(
      'status','active_session_exists',
      'session',private.quiz_session_payload(v_active,false)
    );
  end if;

  if not coalesce((v_ctx ->> 'plan_enabled')::boolean,false) then
    raise exception 'Quiz is currently unavailable for this plan'
      using errcode='42501',detail='plan_not_enabled';
  end if;

  if (v_ctx ->> 'remaining_count')::integer < 1 then
    raise exception 'Daily Quiz completion allowance exhausted'
      using errcode = 'P0001',
            detail = pg_catalog.jsonb_build_object(
              'activity_type','quiz',
              'daily_limit',(v_ctx ->> 'daily_limit')::integer,
              'used',(v_ctx ->> 'used_count')::integer,
              'timezone',v_timezone
            )::text;
  end if;

  select
    count(*) filter (where q.difficulty = 'beginner')::integer,
    count(*) filter (where q.difficulty = 'intermediate')::integer,
    count(*) filter (where q.difficulty = 'advanced')::integer
  into v_b,v_i,v_a
  from private.quiz_question_bank q
  join private.learning_content_catalog c
    on c.activity_type='permanent_lesson'
   and c.content_id=q.source_lesson_id
   and c.language_code=q.learning_language_code
   and c.is_active
  where q.status='approved'
    and q.learning_language_code='en'
    and q.translation_language_code=v_translation;

  if p_difficulty='beginner' then
    v_question_count := 10;
    if v_b < 20 then
      raise exception 'Beginner Quiz question bank is below the two-session minimum'
        using errcode='P0001', detail='question_bank_below_minimum';
    end if;
    v_comp := '{"beginner":10}'::jsonb;
  elsif p_difficulty='intermediate' then
    v_question_count := 15;
    if v_i < 24 or v_b < 16 then
      raise exception 'Intermediate Quiz question bank is below the two-session minimum'
        using errcode='P0001', detail='question_bank_below_minimum';
    end if;
    case floor(pg_catalog.random()*3)::integer
      when 0 then v_comp := '{"beginner":3,"intermediate":12}'::jsonb;
      when 1 then v_comp := '{"beginner":7,"intermediate":8}'::jsonb;
      else v_comp := '{"beginner":8,"intermediate":7}'::jsonb;
    end case;
  else
    v_question_count := 20;
    if v_a < 32 or v_i < 8 or v_b < 8 then
      raise exception 'Advanced Quiz question bank is below the two-session minimum'
        using errcode='P0001', detail='question_bank_below_minimum';
    end if;
    v_b := floor(pg_catalog.random()*5)::integer;
    v_a := 16-v_b;
    v_comp := pg_catalog.jsonb_build_object(
      'beginner',v_b,'intermediate',4,'advanced',v_a
    );
  end if;

  -- Count currently unseen inventory for the exact selected composition.
  for v_source in select unnest(array['beginner','intermediate','advanced'])
  loop
    v_needed := coalesce((v_comp ->> v_source)::integer,0);
    if v_needed > 0 then
      select count(*)::integer into v_added
      from private.quiz_question_bank q
      join private.learning_content_catalog c
        on c.activity_type='permanent_lesson'
       and c.content_id=q.source_lesson_id
       and c.language_code=q.learning_language_code
       and c.is_active
      where q.status='approved'
        and q.learning_language_code='en'
        and q.translation_language_code=v_translation
        and q.difficulty=v_source
        and not exists (
          select 1 from private.quiz_session_questions issued
          where issued.user_id=v_user and issued.local_date=v_day
            and issued.question_id=q.question_id
        );
      if v_added < v_needed then
        raise exception 'Not enough unseen questions remain for a complete Quiz today'
          using errcode='P0001', detail='fresh_questions_unavailable_today';
      end if;
    end if;
  end loop;

  v_topic_cap := floor(v_question_count*0.40)::integer;
  for v_source in select unnest(array['beginner','intermediate','advanced'])
  loop
    v_needed := coalesce((v_comp ->> v_source)::integer,0);
    v_added := 0;
    if v_needed > 0 then
      for v_q in
        select q.question_id,q.revision,q.topic_id
        from private.quiz_question_bank q
        join private.learning_content_catalog c
          on c.activity_type='permanent_lesson'
         and c.content_id=q.source_lesson_id
         and c.language_code=q.learning_language_code
         and c.is_active
        where q.status='approved'
          and q.learning_language_code='en'
          and q.translation_language_code=v_translation
          and q.difficulty=v_source
          and not exists (
            select 1 from private.quiz_session_questions issued
            where issued.user_id=v_user and issued.local_date=v_day
              and issued.question_id=q.question_id
          )
        order by pg_catalog.random()
      loop
        v_topic_count := coalesce((v_topic_counts ->> v_q.topic_id)::integer,0);
        if v_topic_count < v_topic_cap then
          v_selected_ids := pg_catalog.array_append(v_selected_ids,v_q.question_id);
          v_selected_revisions := pg_catalog.array_append(v_selected_revisions,v_q.revision);
          v_topic_counts := pg_catalog.jsonb_set(
            v_topic_counts,
            array[v_q.topic_id],
            pg_catalog.to_jsonb(v_topic_count+1),
            true
          );
          v_added := v_added+1;
          exit when v_added >= v_needed;
        end if;
      end loop;
      if v_added < v_needed then
        raise exception 'Question pool cannot satisfy topic diversity for a complete Quiz'
          using errcode='P0001', detail='topic_coverage_unavailable';
      end if;
    end if;
  end loop;

  select coalesce(pg_catalog.sum((value #>> '{}')::integer),0)::integer,
         pg_catalog.count(*)::integer
  into v_topic_total,v_topic_count
  from pg_catalog.jsonb_each(v_topic_counts);

  if v_topic_total <> v_question_count or v_topic_count < 3 then
    raise exception 'Quiz requires at least three distinct topics'
      using errcode='P0001', detail='topic_coverage_unavailable';
  end if;

  insert into private.quiz_sessions(
    user_id,difficulty,learning_language_code,translation_language_code,
    question_count,source_composition,local_date,timezone,status
  ) values (
    v_user,p_difficulty,'en',v_translation,v_question_count,v_comp,v_day,v_timezone,'in_progress'
  ) returning id into v_session;

  with selected as (
    select q.*,
      pg_catalog.row_number() over(order by pg_catalog.random())::integer as new_position,
      array(
        select o.value ->> 'id'
        from pg_catalog.jsonb_array_elements(q.options) as o(value)
        order by pg_catalog.random()
      ) as shuffled_options
    from pg_catalog.generate_subscripts(v_selected_ids,1) as picked(idx)
    join private.quiz_question_bank q
      on q.question_id=v_selected_ids[picked.idx]
     and q.revision=v_selected_revisions[picked.idx]
  )
  insert into private.quiz_session_questions(
    session_id,user_id,local_date,question_id,question_revision,position,
    source_lesson_id,topic_id,source_difficulty,option_order,
    prompt_learning_snapshot,prompt_translation_snapshot,
    options_snapshot,correct_option_id_snapshot,
    explanation_learning_snapshot,explanation_translation_snapshot
  )
  select
    v_session,v_user,v_day,s.question_id,s.revision,s.new_position,
    s.source_lesson_id,s.topic_id,s.difficulty,s.shuffled_options,
    s.prompt_learning,s.prompt_translation,s.options,
    s.correct_option_id,s.explanation_learning,s.explanation_translation
  from selected s;

  return private.quiz_session_payload(v_session,false);
end;
$function$;

create or replace function private.get_my_active_quiz_impl()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_session uuid;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  select s.id into v_session
  from private.quiz_sessions s
  where s.user_id=v_user and s.status='in_progress';
  if v_session is null then return null; end if;
  return private.quiz_session_payload(v_session,false);
end;
$function$;

create or replace function private.save_my_quiz_answer_impl(
  p_session_id uuid,
  p_question_id text,
  p_selected_option_id text,
  p_current_position integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_status text;
  v_question_count integer;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if p_session_id is null or p_question_id is null
     or p_current_position is null then
    raise exception 'Session, question and current position are required'
      using errcode='22023';
  end if;

  select s.status,s.question_count into v_status,v_question_count
  from private.quiz_sessions s
  where s.id=p_session_id and s.user_id=v_user
  for update;

  if not found then
    raise exception 'Quiz session not found' using errcode='P0002';
  end if;
  if v_status <> 'in_progress' then
    raise exception 'Only an unfinished Quiz can be edited' using errcode='42501';
  end if;
  if p_current_position < 1 or p_current_position > v_question_count then
    raise exception 'Invalid current question position' using errcode='22023';
  end if;

  update private.quiz_session_questions q
  set selected_option_id=p_selected_option_id,
      answered_at=case when p_selected_option_id is null then null else pg_catalog.now() end
  where q.session_id=p_session_id
    and q.user_id=v_user
    and q.question_id=p_question_id
    and (p_selected_option_id is null or p_selected_option_id=any(q.option_order));

  if not found then
    raise exception 'Question or selected option does not belong to this Quiz'
      using errcode='22023';
  end if;

  update private.quiz_sessions s
  set current_position=p_current_position,updated_at=pg_catalog.now()
  where s.id=p_session_id and s.user_id=v_user;

  return private.quiz_session_payload(p_session_id,false);
end;
$function$;

create or replace function private.submit_my_quiz_impl(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_session private.quiz_sessions%rowtype;
  v_answered integer;
  v_correct integer;
  v_percentage integer;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,0));

  select * into v_session
  from private.quiz_sessions s
  where s.id=p_session_id and s.user_id=v_user
  for update;

  if not found then
    raise exception 'Quiz session not found' using errcode='P0002';
  end if;
  if v_session.status='completed' then
    return private.quiz_session_payload(p_session_id,true);
  end if;
  if v_session.status <> 'in_progress' then
    raise exception 'Abandoned Quizzes cannot be submitted' using errcode='42501';
  end if;

  select count(*) filter (where q.selected_option_id is not null)::integer,
         count(*) filter (where q.selected_option_id=q.correct_option_id_snapshot)::integer
  into v_answered,v_correct
  from private.quiz_session_questions q
  where q.session_id=p_session_id and q.user_id=v_user;

  if v_answered <> v_session.question_count then
    raise exception 'Answer every question before submitting'
      using errcode='P0001',detail='unanswered_questions';
  end if;

  v_percentage := pg_catalog.round(v_correct*100.0/v_session.question_count)::integer;

  -- The existing completion trigger enforces the current server-owned plan,
  -- timezone and allowance. If it rejects this insert, the entire transaction
  -- (including the session update) rolls back.
  insert into public.learning_activity_log(user_id,activity_type,language_code,event_type)
  values(v_user,'quiz',v_session.learning_language_code,'completed');

  update private.quiz_sessions s
  set status='completed',
      correct_count=v_correct,
      percentage=v_percentage,
      completed_at=pg_catalog.now(),
      updated_at=pg_catalog.now()
  where s.id=p_session_id and s.user_id=v_user;

  return private.quiz_session_payload(p_session_id,true);
end;
$function$;

create or replace function private.abandon_my_quiz_impl(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_status text;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,0));

  select s.status into v_status
  from private.quiz_sessions s
  where s.id=p_session_id and s.user_id=v_user
  for update;

  if not found then
    raise exception 'Quiz session not found' using errcode='P0002';
  end if;
  if v_status='completed' then
    raise exception 'Completed Quizzes cannot be abandoned' using errcode='42501';
  end if;
  if v_status='abandoned' then
    return pg_catalog.jsonb_build_object('session_id',p_session_id,'status','abandoned');
  end if;

  update private.quiz_sessions
  set status='abandoned',abandoned_at=pg_catalog.now(),updated_at=pg_catalog.now()
  where id=p_session_id and user_id=v_user;

  return pg_catalog.jsonb_build_object('session_id',p_session_id,'status','abandoned');
end;
$function$;

create or replace function private.get_my_quiz_history_impl(p_limit integer default 20)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'History limit must be between 1 and 100' using errcode='22023';
  end if;

  return coalesce((
    select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'session_id',s.id,
        'difficulty',s.difficulty,
        'question_count',s.question_count,
        'correct_count',s.correct_count,
        'percentage',s.percentage,
        'started_at',s.started_at,
        'completed_at',s.completed_at,
        'status',s.status
      ) order by s.completed_at desc
    )
    from (
      select * from private.quiz_sessions
      where user_id=v_user and status='completed'
      order by completed_at desc
      limit p_limit
    ) s
  ),'[]'::jsonb);
end;
$function$;

create or replace function private.get_my_quiz_review_impl(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_status text;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  select s.status into v_status
  from private.quiz_sessions s
  where s.id=p_session_id and s.user_id=v_user;
  if not found then
    raise exception 'Quiz session not found' using errcode='P0002';
  end if;
  if v_status <> 'completed' then
    raise exception 'Only completed Quizzes can be reviewed' using errcode='42501';
  end if;
  return private.quiz_session_payload(p_session_id,true);
end;
$function$;

-- Extend the existing owner-confirmed history deletion path. The allowance
-- ledger is deliberately retained, so deleting history cannot reset quota.
create or replace function private.delete_my_learning_history_impl()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_jwt jsonb;
  v_session_id uuid;
  v_session_created_at timestamptz;
  v_session_not_after timestamptz;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  v_jwt := auth.jwt();
  v_session_id := nullif(v_jwt ->> 'session_id','')::uuid;

  select s.created_at,s.not_after
  into v_session_created_at,v_session_not_after
  from auth.sessions s
  where s.id=v_session_id and s.user_id=v_user;

  if not found
     or v_session_created_at is null
     or v_session_created_at < pg_catalog.now()-interval '15 minutes'
     or v_session_created_at > pg_catalog.now()+interval '60 seconds'
     or (v_session_not_after is not null and v_session_not_after <= pg_catalog.now()) then
    raise exception 'Recent authentication required to delete learning history'
      using errcode='42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,0));

  delete from private.quiz_sessions where user_id=v_user;
  delete from public.daily_activity_sessions where user_id=v_user;
  delete from public.lesson_practice_results where user_id=v_user;
  delete from public.lesson_progress where user_id=v_user;
  delete from public.learning_activity_log where user_id=v_user;

  return pg_catalog.jsonb_build_object('deleted',true);
end;
$function$;

-- Public RPC wrappers are SECURITY INVOKER (the default). The implementation
-- functions remain in the non-exposed private schema and validate auth.uid().
create or replace function public.delete_my_learning_history()
returns jsonb language sql set search_path=''
as $function$ select private.delete_my_learning_history_impl(); $function$;

create or replace function public.get_my_quiz_availability()
returns jsonb language sql set search_path=''
as $function$ select private.get_my_quiz_availability_impl(); $function$;

create or replace function public.start_my_quiz(p_difficulty text)
returns jsonb language sql set search_path=''
as $function$ select private.start_my_quiz_impl(p_difficulty); $function$;

create or replace function public.get_my_active_quiz()
returns jsonb language sql set search_path=''
as $function$ select private.get_my_active_quiz_impl(); $function$;

create or replace function public.save_my_quiz_answer(
  p_session_id uuid,p_question_id text,p_selected_option_id text,p_current_position integer
)
returns jsonb language sql set search_path=''
as $function$
  select private.save_my_quiz_answer_impl(
    p_session_id,p_question_id,p_selected_option_id,p_current_position
  );
$function$;

create or replace function public.submit_my_quiz(p_session_id uuid)
returns jsonb language sql set search_path=''
as $function$ select private.submit_my_quiz_impl(p_session_id); $function$;

create or replace function public.abandon_my_quiz(p_session_id uuid)
returns jsonb language sql set search_path=''
as $function$ select private.abandon_my_quiz_impl(p_session_id); $function$;

create or replace function public.get_my_quiz_history(p_limit integer default 20)
returns jsonb language sql set search_path=''
as $function$ select private.get_my_quiz_history_impl(p_limit); $function$;

create or replace function public.get_my_quiz_review(p_session_id uuid)
returns jsonb language sql set search_path=''
as $function$ select private.get_my_quiz_review_impl(p_session_id); $function$;

-- Authenticated users need schema/function access for the invoker wrappers.
-- The private schema is not an exposed PostgREST schema; every implementation
-- still checks auth.uid() and does not accept a caller-supplied owner.
grant usage on schema private to authenticated;
grant execute on function private.delete_my_learning_history_impl() to authenticated;
revoke all on function private.delete_my_learning_history_impl() from public,anon;
grant execute on function private.quiz_request_context() to authenticated;
grant execute on function private.quiz_session_payload(uuid,boolean) to authenticated;
grant execute on function private.get_my_quiz_availability_impl() to authenticated;
grant execute on function private.start_my_quiz_impl(text) to authenticated;
grant execute on function private.get_my_active_quiz_impl() to authenticated;
grant execute on function private.save_my_quiz_answer_impl(uuid,text,text,integer) to authenticated;
grant execute on function private.submit_my_quiz_impl(uuid) to authenticated;
grant execute on function private.abandon_my_quiz_impl(uuid) to authenticated;
grant execute on function private.get_my_quiz_history_impl(integer) to authenticated;
grant execute on function private.get_my_quiz_review_impl(uuid) to authenticated;

revoke all on function private.quiz_request_context() from public,anon;
revoke all on function private.quiz_session_payload(uuid,boolean) from public,anon;
revoke all on function private.get_my_quiz_availability_impl() from public,anon;
revoke all on function private.start_my_quiz_impl(text) from public,anon;
revoke all on function private.get_my_active_quiz_impl() from public,anon;
revoke all on function private.save_my_quiz_answer_impl(uuid,text,text,integer) from public,anon;
revoke all on function private.submit_my_quiz_impl(uuid) from public,anon;
revoke all on function private.abandon_my_quiz_impl(uuid) from public,anon;
revoke all on function private.get_my_quiz_history_impl(integer) from public,anon;
revoke all on function private.get_my_quiz_review_impl(uuid) from public,anon;

revoke all on function public.delete_my_learning_history() from public,anon;
revoke all on function public.get_my_quiz_availability() from public,anon;
revoke all on function public.start_my_quiz(text) from public,anon;
revoke all on function public.get_my_active_quiz() from public,anon;
revoke all on function public.save_my_quiz_answer(uuid,text,text,integer) from public,anon;
revoke all on function public.submit_my_quiz(uuid) from public,anon;
revoke all on function public.abandon_my_quiz(uuid) from public,anon;
revoke all on function public.get_my_quiz_history(integer) from public,anon;
revoke all on function public.get_my_quiz_review(uuid) from public,anon;

grant execute on function public.delete_my_learning_history() to authenticated;
grant execute on function public.get_my_quiz_availability() to authenticated;
grant execute on function public.start_my_quiz(text) to authenticated;
grant execute on function public.get_my_active_quiz() to authenticated;
grant execute on function public.save_my_quiz_answer(uuid,text,text,integer) to authenticated;
grant execute on function public.submit_my_quiz(uuid) to authenticated;
grant execute on function public.abandon_my_quiz(uuid) to authenticated;
grant execute on function public.get_my_quiz_history(integer) to authenticated;
grant execute on function public.get_my_quiz_review(uuid) to authenticated;

commit;
