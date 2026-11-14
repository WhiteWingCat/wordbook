-- SwiftDictionary Update 2.4.0 — Quiz question-bank and session foundation.
-- This migration is intentionally schema-only: no question content is published
-- and no production allowance values are changed here.
--
-- Security model:
--   * All Quiz content, answer keys, sessions and issued-question records live
--     in the non-exposed private schema.
--   * Client access is mediated by narrowly scoped RPCs added in later stages.
--   * The answer key is never part of a client-facing table or public view.
--   * Issued question uniqueness is enforced by a database unique constraint,
--     not browser storage or client-generated sequence IDs.

begin;

create table if not exists private.quiz_question_bank (
  question_id text not null
    check (pg_catalog.char_length(question_id) between 1 and 120),
  revision integer not null default 1
    check (revision > 0),
  learning_language_code text not null
    references public.languages(code),
  translation_language_code text not null
    references public.languages(code),
  source_lesson_id text not null
    check (pg_catalog.char_length(source_lesson_id) between 1 and 120),
  topic_id text not null
    check (pg_catalog.char_length(topic_id) between 1 and 120),
  difficulty text not null
    check (difficulty in ('beginner', 'intermediate', 'advanced')),
  prompt_learning text not null
    check (pg_catalog.char_length(pg_catalog.btrim(prompt_learning)) > 0),
  prompt_translation text not null
    check (pg_catalog.char_length(pg_catalog.btrim(prompt_translation)) > 0),
  options jsonb not null
    check (pg_catalog.jsonb_typeof(options) = 'array'
       and pg_catalog.jsonb_array_length(options) = 4),
  correct_option_id text not null
    check (pg_catalog.char_length(correct_option_id) between 1 and 32),
  explanation_learning text not null
    check (pg_catalog.char_length(pg_catalog.btrim(explanation_learning)) > 0),
  explanation_translation text not null
    check (pg_catalog.char_length(pg_catalog.btrim(explanation_translation)) > 0),
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'retired')),
  approved_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  primary key (question_id, revision),
  constraint quiz_question_bank_approval_timestamp_check
    check ((status = 'approved' and approved_at is not null)
        or (status <> 'approved' and approved_at is null))
);

comment on table private.quiz_question_bank is
  'Private, versioned Quiz content bank. Correct answers and explanations are server-only; clients receive sanitised session snapshots after an authenticated RPC is implemented.';

create unique index if not exists quiz_question_bank_one_approved_revision_idx
  on private.quiz_question_bank(question_id)
  where status = 'approved';

create index if not exists quiz_question_bank_eligibility_idx
  on private.quiz_question_bank
    (learning_language_code, translation_language_code, difficulty, topic_id)
  where status = 'approved';

create index if not exists quiz_question_bank_source_lesson_idx
  on private.quiz_question_bank
    (learning_language_code, source_lesson_id, difficulty)
  where status = 'approved';

create table if not exists private.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  difficulty text not null
    check (difficulty in ('beginner', 'intermediate', 'advanced')),
  learning_language_code text not null references public.languages(code),
  translation_language_code text not null references public.languages(code),
  question_count integer not null
    check (
      (difficulty = 'beginner' and question_count = 10)
      or (difficulty = 'intermediate' and question_count = 15)
      or (difficulty = 'advanced' and question_count = 20)
    ),
  -- The selected composition is frozen for audit/review and exact-ratio checks.
  source_composition jsonb not null
    check (pg_catalog.jsonb_typeof(source_composition) = 'object'),
  local_date date not null,
  timezone text not null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  current_position integer not null default 1
    check (current_position between 1 and question_count),
  correct_count integer,
  percentage integer,
  started_at timestamptz not null default pg_catalog.now(),
  completed_at timestamptz,
  abandoned_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint quiz_sessions_result_shape_check check (
    (status = 'completed'
      and correct_count is not null
      and percentage is not null
      and correct_count between 0 and question_count
      and percentage = pg_catalog.round(correct_count * 100.0 / question_count)::integer
      and completed_at is not null
      and abandoned_at is null)
    or
    (status = 'in_progress'
      and correct_count is null
      and percentage is null
      and completed_at is null
      and abandoned_at is null)
    or
    (status = 'abandoned'
      and correct_count is null
      and percentage is null
      and completed_at is null
      and abandoned_at is not null)
  ),
  constraint quiz_sessions_id_user_unique unique (id, user_id)
);

comment on table private.quiz_sessions is
  'Private account-scoped Quiz sessions. Session snapshots preserve language, question composition, local allowance date and result history.';

create unique index if not exists quiz_sessions_one_active_per_user_idx
  on private.quiz_sessions(user_id)
  where status = 'in_progress';

create index if not exists quiz_sessions_user_history_idx
  on private.quiz_sessions(user_id, started_at desc);

create index if not exists quiz_sessions_allowance_day_idx
  on private.quiz_sessions(user_id, local_date, status);

create table if not exists private.quiz_session_questions (
  id bigint generated always as identity primary key,
  session_id uuid not null,
  user_id uuid not null,
  local_date date not null,
  question_id text not null,
  question_revision integer not null,
  position integer not null check (position > 0),
  -- Persist the shuffled option order; each ID must correspond to one of the
  -- four option IDs in the immutable question-bank revision.
  option_order text[] not null
    check (pg_catalog.cardinality(option_order) = 4),
  -- Snapshots are private and immutable after session creation. The answer key
  -- is retained only here for server-side scoring and completed review.
  prompt_learning_snapshot text not null,
  prompt_translation_snapshot text not null,
  options_snapshot jsonb not null
    check (pg_catalog.jsonb_typeof(options_snapshot) = 'array'
       and pg_catalog.jsonb_array_length(options_snapshot) = 4),
  correct_option_id_snapshot text not null,
  explanation_learning_snapshot text not null,
  explanation_translation_snapshot text not null,
  selected_option_id text,
  answered_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  constraint quiz_session_questions_session_fk
    foreign key (session_id, user_id)
    references private.quiz_sessions(id, user_id) on delete cascade,
  constraint quiz_session_questions_bank_fk
    foreign key (question_id, question_revision)
    references private.quiz_question_bank(question_id, revision),
  constraint quiz_session_questions_position_unique
    unique (session_id, position),
  constraint quiz_session_questions_session_question_unique
    unique (session_id, question_id),
  -- Critical same-day no-repeat guarantee across all difficulty levels and
  -- even after a session is abandoned. The row is retained for the local day.
  constraint quiz_session_questions_no_same_day_repeat
    unique (user_id, local_date, question_id)
);

comment on table private.quiz_session_questions is
  'Private issued-question ledger and immutable session snapshots. Unique user/local_date/question constraint prevents same-day reuse across sessions and difficulty levels.';

create index if not exists quiz_session_questions_user_day_idx
  on private.quiz_session_questions(user_id, local_date);

create index if not exists quiz_session_questions_session_order_idx
  on private.quiz_session_questions(session_id, position);

-- The same question can have only one active approved revision. Enforce the
-- four-option identity contract and exactly one matching correct option.
create or replace function private.validate_quiz_question_bank_row()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_option_ids text[];
  v_option jsonb;
begin
  if pg_catalog.jsonb_typeof(new.options) <> 'array'
     or pg_catalog.jsonb_array_length(new.options) <> 4 then
    raise exception 'Quiz questions must have exactly four answer options'
      using errcode = '23514';
  end if;

  select pg_catalog.array_agg(x.option_id order by x.ordinality)
  into v_option_ids
  from pg_catalog.jsonb_array_elements(new.options)
       with ordinality as e(value, ordinality)
  cross join lateral (
    select e.value ->> 'id' as option_id
  ) x;

  if v_option_ids is null
     or pg_catalog.array_position(v_option_ids, null) is not null
     or (select pg_catalog.count(distinct option_id)
         from pg_catalog.unnest(v_option_ids) as u(option_id)) <> 4
     or not (new.correct_option_id = any(v_option_ids)) then
    raise exception 'Quiz options must have four unique IDs and exactly one matching correct option ID'
      using errcode = '23514';
  end if;

  for v_option in
    select value from pg_catalog.jsonb_array_elements(new.options)
  loop
    if pg_catalog.jsonb_typeof(v_option) <> 'object'
       or nullif(pg_catalog.btrim(v_option ->> 'id'), '') is null
       or pg_catalog.nullif(pg_catalog.btrim(v_option ->> 'learning_text'), '') is null
       or pg_catalog.nullif(pg_catalog.btrim(v_option ->> 'translation_text'), '') is null then
      raise exception 'Each Quiz option requires id, learning_text and translation_text'
        using errcode = '23514';
    end if;
  end loop;

  if new.status = 'approved' then
    new.approved_at := coalesce(new.approved_at, pg_catalog.now());
  else
    new.approved_at := null;
  end if;

  new.updated_at := pg_catalog.now();
  return new;
end;
$function$;

revoke all on function private.validate_quiz_question_bank_row()
  from public, anon, authenticated;

drop trigger if exists validate_quiz_question_bank_row
  on private.quiz_question_bank;
create trigger validate_quiz_question_bank_row
before insert or update on private.quiz_question_bank
for each row execute function private.validate_quiz_question_bank_row();

-- Prevent mutation of question/session snapshots and issued-question identity
-- after creation. Later RPCs may update only selected_option_id/answered_at.
create or replace function private.guard_quiz_session_question_update()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.session_id is distinct from old.session_id
     or new.user_id is distinct from old.user_id
     or new.local_date is distinct from old.local_date
     or new.question_id is distinct from old.question_id
     or new.question_revision is distinct from old.question_revision
     or new.position is distinct from old.position
     or new.option_order is distinct from old.option_order
     or new.prompt_learning_snapshot is distinct from old.prompt_learning_snapshot
     or new.prompt_translation_snapshot is distinct from old.prompt_translation_snapshot
     or new.options_snapshot is distinct from old.options_snapshot
     or new.correct_option_id_snapshot is distinct from old.correct_option_id_snapshot
     or new.explanation_learning_snapshot is distinct from old.explanation_learning_snapshot
     or new.explanation_translation_snapshot is distinct from old.explanation_translation_snapshot then
    raise exception 'Quiz question identity and snapshots are immutable'
      using errcode = '42501';
  end if;

  if old.selected_option_id is not null
     and new.selected_option_id is distinct from old.selected_option_id then
    raise exception 'A saved Quiz answer cannot be changed through direct table access'
      using errcode = '42501';
  end if;

  if new.selected_option_id is not null
     and not (new.selected_option_id = any(new.option_order)) then
    raise exception 'Selected option does not belong to this Quiz question'
      using errcode = '23514';
  end if;

  return new;
end;
$function$;

revoke all on function private.guard_quiz_session_question_update()
  from public, anon, authenticated;

drop trigger if exists guard_quiz_session_question_update
  on private.quiz_session_questions;
create trigger guard_quiz_session_question_update
before update on private.quiz_session_questions
for each row execute function private.guard_quiz_session_question_update();

-- Validate that the persisted shuffled option order is a permutation of
-- the four snapshotted options. This runs on insert and update.
create or replace function private.validate_quiz_session_question_row()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_snapshot_ids text[];
  v_distinct_count integer;
begin
  if pg_catalog.jsonb_typeof(new.options_snapshot) <> 'array'
     or pg_catalog.jsonb_array_length(new.options_snapshot) <> 4
     or pg_catalog.cardinality(new.option_order) <> 4
     or pg_catalog.array_position(new.option_order, null) is not null then
    raise exception 'Quiz session questions require four ordered answer options'
      using errcode = '23514';
  end if;

  select pg_catalog.array_agg(x.option_id order by x.ordinality),
         pg_catalog.count(distinct x.option_id)::integer
  into v_snapshot_ids, v_distinct_count
  from pg_catalog.jsonb_array_elements(new.options_snapshot)
       with ordinality as e(value, ordinality)
  cross join lateral (
    select e.value ->> 'id' as option_id, e.ordinality
  ) x;

  if v_distinct_count <> 4
     or v_snapshot_ids is null
     or pg_catalog.array_position(v_snapshot_ids, null) is not null
     or not (new.correct_option_id_snapshot = any(v_snapshot_ids))
     or not (new.option_order @> v_snapshot_ids
             and v_snapshot_ids @> new.option_order) then
    raise exception 'Quiz session option order must be a permutation of the four snapshotted option IDs'
      using errcode = '23514';
  end if;

  if new.selected_option_id is not null
     and not (new.selected_option_id = any(new.option_order)) then
    raise exception 'Selected option does not belong to this Quiz question'
      using errcode = '23514';
  end if;

  return new;
end;
$function$;

revoke all on function private.validate_quiz_session_question_row()
  from public, anon, authenticated;

drop trigger if exists validate_quiz_session_question_row
  on private.quiz_session_questions;
create trigger validate_quiz_session_question_row
before insert or update on private.quiz_session_questions
for each row execute function private.validate_quiz_session_question_row();

-- No direct Data API access. RLS is enabled as defence in depth even though
-- the schema is not exposed and all table privileges are revoked.
alter table private.quiz_question_bank enable row level security;
alter table private.quiz_sessions enable row level security;
alter table private.quiz_session_questions enable row level security;

revoke all on table private.quiz_question_bank
  from public, anon, authenticated;
revoke all on table private.quiz_sessions
  from public, anon, authenticated;
revoke all on table private.quiz_session_questions
  from public, anon, authenticated;

revoke all on sequence private.quiz_session_questions_id_seq
  from public, anon, authenticated;

commit;
