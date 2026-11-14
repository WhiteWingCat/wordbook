-- SwiftDictionary Update 2.3.0 — approved learning content catalogue.
-- Contains stable identifiers and topic mappings only. It deliberately stores
-- no question text, selected answers, or per-question response history.
-- Apply before the allowance and Daily Learning migration drafts.

begin;

create table if not exists private.learning_content_catalog (
  activity_type text not null check (
    activity_type in ('daily_topic','daily_application','daily_discovery','permanent_lesson')
  ),
  content_id text not null check (char_length(content_id) between 1 and 120),
  topic_id text,
  difficulty text check (difficulty is null or difficulty in ('beginner','intermediate','advanced')),
  language_code text not null check (language_code = 'en'),
  is_active boolean not null default true,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  primary key (activity_type, content_id, language_code),
  constraint learning_content_catalog_topic_shape check (
    (activity_type = 'daily_discovery' and topic_id is null and difficulty is null)
    or
    (activity_type <> 'daily_discovery' and topic_id is not null and difficulty is not null)
  )
);

create index if not exists learning_content_catalog_topic_idx
  on private.learning_content_catalog(activity_type, topic_id, difficulty, language_code)
  where is_active;

alter table private.learning_content_catalog enable row level security;
revoke all on table private.learning_content_catalog from public, anon, authenticated;
grant usage on schema private to authenticated;

comment on table private.learning_content_catalog is
  'Server-only allowlist of stable SwiftDictionary learning content IDs and topic mappings. No answer-level data is stored.';

insert into private.learning_content_catalog
  (activity_type, content_id, topic_id, difficulty, language_code, is_active)
values
  ('daily_topic','topic-present-perfect-01','verb-tenses','intermediate','en',true),
  ('daily_topic','topic-articles-01','nouns-and-articles','beginner','en',true),
  ('daily_topic','topic-quantity-01','nouns-and-quantity','beginner','en',true),
  ('daily_topic','topic-sentence-order-01','sentence-basics','beginner','en',true),
  ('daily_topic','topic-collocations-01','collocations','intermediate','en',true),
  ('daily_topic','topic-present-routines-01','verb-tenses','beginner','en',true),
  ('daily_topic','topic-present-continuous-01','verb-tenses','beginner','en',true),
  ('daily_topic','topic-past-continuous-01','verb-tenses','intermediate','en',true),
  ('daily_topic','topic-prepositions-time-01','sentence-basics','beginner','en',true),
  ('daily_topic','topic-pronouns-01','sentence-basics','beginner','en',true),
  ('daily_topic','topic-articles-the-01','nouns-and-articles','intermediate','en',true),
  ('daily_topic','topic-quantity-many-much-01','nouns-and-quantity','beginner','en',true),
  ('daily_topic','topic-everyday-vocabulary-01','everyday-vocabulary','beginner','en',true),
  ('daily_topic','topic-everyday-vocabulary-02','everyday-vocabulary','beginner','en',true),
  ('daily_topic','topic-phrasal-verbs-01','phrasal-verbs','intermediate','en',true),
  ('daily_topic','topic-phrasal-verbs-02','phrasal-verbs','intermediate','en',true),
  ('daily_topic','topic-word-formation-01','word-formation','intermediate','en',true),
  ('daily_topic','topic-word-formation-02','word-formation','intermediate','en',true),
  ('daily_topic','topic-conditionals-01','conditional-sentences','intermediate','en',true),
  ('daily_topic','topic-conditionals-02','conditional-sentences','intermediate','en',true),
  ('daily_topic','topic-advanced-inversion-01','advanced-grammar','advanced','en',true),
  ('daily_topic','topic-advanced-modals-01','advanced-grammar','advanced','en',true),
  ('daily_topic','topic-idioms-01','idioms-fixed-expressions','intermediate','en',true),
  ('daily_topic','topic-idioms-02','idioms-fixed-expressions','intermediate','en',true),
  ('daily_topic','topic-academic-01','academic-professional-english','advanced','en',true),
  ('daily_topic','topic-academic-02','academic-professional-english','advanced','en',true),
  ('daily_topic','topic-precise-vocabulary-01','precise-vocabulary','advanced','en',true),
  ('daily_topic','topic-precise-vocabulary-02','precise-vocabulary','advanced','en',true),
  ('daily_application','application-verb-patterns-01','verb-tenses','intermediate','en',true),
  ('daily_application','application-articles-01','nouns-and-articles','beginner','en',true),
  ('daily_application','application-quantity-01','nouns-and-quantity','beginner','en',true),
  ('daily_application','application-say-tell-01','sentence-basics','intermediate','en',true),
  ('daily_application','application-collocations-01','collocations','intermediate','en',true),
  ('daily_application','application-present-routine-02','verb-tenses','beginner','en',true),
  ('daily_application','application-present-continuous-02','verb-tenses','beginner','en',true),
  ('daily_application','application-past-continuous-02','verb-tenses','intermediate','en',true),
  ('daily_application','application-prepositions-time-01','sentence-basics','beginner','en',true),
  ('daily_application','application-pronouns-01','sentence-basics','beginner','en',true),
  ('daily_application','application-articles-the-02','nouns-and-articles','intermediate','en',true),
  ('daily_application','application-many-much-02','nouns-and-quantity','beginner','en',true),
  ('daily_application','application-everyday-vocabulary-02','everyday-vocabulary','beginner','en',true),
  ('daily_application','application-frequency-01','everyday-vocabulary','beginner','en',true),
  ('daily_application','application-phrasal-separable-02','phrasal-verbs','intermediate','en',true),
  ('daily_application','application-phrasal-meaning-02','phrasal-verbs','intermediate','en',true),
  ('daily_application','application-word-family-02','word-formation','intermediate','en',true),
  ('daily_application','application-prefix-02','word-formation','intermediate','en',true),
  ('daily_application','application-first-conditional-02','conditional-sentences','intermediate','en',true),
  ('daily_application','application-second-conditional-02','conditional-sentences','intermediate','en',true),
  ('daily_application','application-modals-02','advanced-grammar','advanced','en',true),
  ('daily_application','application-inversion-02','advanced-grammar','advanced','en',true),
  ('daily_application','application-idioms-02','idioms-fixed-expressions','intermediate','en',true),
  ('daily_application','application-academic-02','academic-professional-english','advanced','en',true),
  ('daily_application','application-precise-02','precise-vocabulary','advanced','en',true),
  ('daily_discovery','discovery-word-meticulous-01',null,null,'en',true),
  ('daily_discovery','discovery-word-reluctant-01',null,null,'en',true),
  ('daily_discovery','discovery-word-plausible-01',null,null,'en',true),
  ('daily_discovery','discovery-word-fleeting-01',null,null,'en',true),
  ('daily_discovery','discovery-word-cumbersome-01',null,null,'en',true),
  ('daily_discovery','discovery-word-quaint-01',null,null,'en',true),
  ('daily_discovery','discovery-word-weary-01',null,null,'en',true),
  ('daily_discovery','discovery-word-subtle-01',null,null,'en',true),
  ('daily_discovery','discovery-word-obsolete-01',null,null,'en',true),
  ('daily_discovery','discovery-word-resilient-01',null,null,'en',true),
  ('daily_discovery','discovery-word-bewildered-01',null,null,'en',true),
  ('daily_discovery','discovery-word-scarce-01',null,null,'en',true),
  ('daily_discovery','discovery-word-articulate-01',null,null,'en',true),
  ('daily_discovery','discovery-word-astute-01',null,null,'en',true),
  ('daily_discovery','discovery-word-candid-01',null,null,'en',true),
  ('daily_discovery','discovery-word-coherent-01',null,null,'en',true),
  ('daily_discovery','discovery-word-concise-01',null,null,'en',true),
  ('daily_discovery','discovery-word-diligent-01',null,null,'en',true),
  ('daily_discovery','discovery-word-elusive-01',null,null,'en',true),
  ('daily_discovery','discovery-word-empathetic-01',null,null,'en',true),
  ('daily_discovery','discovery-word-feasible-01',null,null,'en',true),
  ('daily_discovery','discovery-word-frugal-01',null,null,'en',true),
  ('daily_discovery','discovery-word-genuine-01',null,null,'en',true),
  ('daily_discovery','discovery-word-impartial-01',null,null,'en',true),
  ('daily_discovery','discovery-word-inevitable-01',null,null,'en',true),
  ('daily_discovery','discovery-word-innovative-01',null,null,'en',true),
  ('daily_discovery','discovery-word-intuitive-01',null,null,'en',true),
  ('daily_discovery','discovery-word-versatile-01',null,null,'en',true),
  ('daily_discovery','discovery-word-ambiguous-01',null,null,'en',true),
  ('daily_discovery','discovery-word-arbitrary-01',null,null,'en',true),
  ('daily_discovery','discovery-word-assertive-01',null,null,'en',true),
  ('daily_discovery','discovery-word-authentic-01',null,null,'en',true),
  ('daily_discovery','discovery-word-benevolent-01',null,null,'en',true),
  ('daily_discovery','discovery-word-conventional-01',null,null,'en',true),
  ('daily_discovery','discovery-word-credible-01',null,null,'en',true),
  ('daily_discovery','discovery-word-deliberate-01',null,null,'en',true),
  ('daily_discovery','discovery-word-distinct-01',null,null,'en',true),
  ('daily_discovery','discovery-word-efficient-01',null,null,'en',true),
  ('daily_discovery','discovery-word-elaborate-01',null,null,'en',true),
  ('daily_discovery','discovery-word-evident-01',null,null,'en',true),
  ('daily_discovery','discovery-word-exceptional-01',null,null,'en',true),
  ('daily_discovery','discovery-word-flexible-01',null,null,'en',true),
  ('daily_discovery','discovery-word-hesitant-01',null,null,'en',true),
  ('daily_discovery','discovery-word-humble-01',null,null,'en',true),
  ('daily_discovery','discovery-word-immense-01',null,null,'en',true),
  ('daily_discovery','discovery-word-intricate-01',null,null,'en',true),
  ('daily_discovery','discovery-word-logical-01',null,null,'en',true),
  ('daily_discovery','discovery-word-modest-01',null,null,'en',true),
  ('daily_discovery','discovery-word-obscure-01',null,null,'en',true),
  ('daily_discovery','discovery-word-optimistic-01',null,null,'en',true),
  ('daily_discovery','discovery-word-persistent-01',null,null,'en',true),
  ('daily_discovery','discovery-word-profound-01',null,null,'en',true),
  ('daily_discovery','discovery-word-remarkable-01',null,null,'en',true),
  ('daily_discovery','discovery-word-resourceful-01',null,null,'en',true),
  ('daily_discovery','discovery-word-sincere-01',null,null,'en',true),
  ('daily_discovery','discovery-word-sufficient-01',null,null,'en',true),
  ('daily_discovery','discovery-word-temporary-01',null,null,'en',true),
  ('daily_discovery','discovery-word-transparent-01',null,null,'en',true),
  ('daily_discovery','discovery-word-unique-01',null,null,'en',true),
  ('daily_discovery','discovery-word-worthwhile-01',null,null,'en',true),
  ('daily_discovery','discovery-word-abundant-01',null,null,'en',true),
  ('daily_discovery','discovery-word-accessible-01',null,null,'en',true),
  ('daily_discovery','discovery-word-accurate-01',null,null,'en',true),
  ('daily_discovery','discovery-word-adaptable-01',null,null,'en',true),
  ('daily_discovery','discovery-word-adjacent-01',null,null,'en',true),
  ('daily_discovery','discovery-word-cautious-01',null,null,'en',true),
  ('daily_discovery','discovery-word-compelling-01',null,null,'en',true),
  ('daily_discovery','discovery-word-competent-01',null,null,'en',true),
  ('daily_discovery','discovery-word-considerate-01',null,null,'en',true),
  ('daily_discovery','discovery-word-consistent-01',null,null,'en',true),
  ('daily_discovery','discovery-word-constructive-01',null,null,'en',true),
  ('daily_discovery','discovery-word-crucial-01',null,null,'en',true),
  ('daily_discovery','discovery-word-diverse-01',null,null,'en',true),
  ('daily_discovery','discovery-word-frequent-01',null,null,'en',true),
  ('daily_discovery','discovery-word-generous-01',null,null,'en',true),
  ('daily_discovery','discovery-word-gradual-01',null,null,'en',true),
  ('daily_discovery','discovery-word-hostile-01',null,null,'en',true),
  ('daily_discovery','discovery-word-relevant-01',null,null,'en',true),
  ('daily_discovery','discovery-word-reliable-01',null,null,'en',true),
  ('daily_discovery','discovery-word-significant-01',null,null,'en',true),
  ('daily_discovery','discovery-word-straightforward-01',null,null,'en',true),
  ('daily_discovery','discovery-word-sustainable-01',null,null,'en',true),
  ('daily_discovery','discovery-word-tentative-01',null,null,'en',true),
  ('daily_discovery','discovery-word-thorough-01',null,null,'en',true),
  ('daily_discovery','discovery-word-valid-01',null,null,'en',true),
  ('daily_discovery','discovery-word-vulnerable-01',null,null,'en',true),
  ('daily_discovery','discovery-word-wary-01',null,null,'en',true),
  ('daily_discovery','discovery-word-vivid-01',null,null,'en',true),
  ('daily_discovery','discovery-word-adequate-01',null,null,'en',true),
  ('daily_discovery','discovery-word-compatible-01',null,null,'en',true),
  ('daily_discovery','discovery-word-comprehensive-01',null,null,'en',true),
  ('daily_discovery','discovery-word-astounding-01',null,null,'en',true),
  ('daily_discovery','discovery-word-intriguing-01',null,null,'en',true),
  ('permanent_lesson','b-sentence','sentence-basics','beginner','en',true),
  ('permanent_lesson','b-present','verb-tenses','beginner','en',true),
  ('permanent_lesson','b-articles','nouns-and-articles','beginner','en',true),
  ('permanent_lesson','b-verb-combinations','everyday-vocabulary','beginner','en',true),
  ('permanent_lesson','b-countable-nouns','nouns-and-quantity','beginner','en',true),
  ('permanent_lesson','i-perfect','verb-tenses','intermediate','en',true),
  ('permanent_lesson','i-phrasal','phrasal-verbs','intermediate','en',true),
  ('permanent_lesson','i-collocations','collocations','intermediate','en',true),
  ('permanent_lesson','i-word-families','word-formation','intermediate','en',true),
  ('permanent_lesson','i-conditionals','conditional-sentences','intermediate','en',true),
  ('permanent_lesson','a-inversion','advanced-grammar','advanced','en',true),
  ('permanent_lesson','a-idioms','idioms-fixed-expressions','advanced','en',true),
  ('permanent_lesson','a-hedging','academic-professional-english','advanced','en',true),
  ('permanent_lesson','a-near-synonyms','precise-vocabulary','advanced','en',true),
  ('permanent_lesson','a-mixed-conditionals','advanced-grammar','advanced','en',true)
on conflict (activity_type, content_id, language_code) do update
set topic_id = excluded.topic_id,
    difficulty = excluded.difficulty,
    is_active = excluded.is_active,
    updated_at = pg_catalog.now();

create or replace function private.is_approved_learning_content(
  p_activity_type text,
  p_content_id text,
  p_topic_id text,
  p_difficulty text,
  p_language_code text,
  p_source text default 'daily'
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_revision_parts text[];
  v_discovery_parts text[];
begin
  if auth.uid() is null
     or p_content_id is null
     or p_language_code is null then
    return false;
  end if;

  if p_activity_type = 'daily_discovery' then
    if p_source <> 'daily' or p_topic_id is not null or p_difficulty is not null then
      return false;
    end if;
    v_discovery_parts := pg_catalog.regexp_match(
      p_content_id,
      '^([a-z0-9-]+):([0-9]{4}-[0-9]{2}-[0-9]{2})$'
    );
    if v_discovery_parts is null then
      return false;
    end if;
    return exists (
      select 1
      from private.learning_content_catalog c
      where c.activity_type = 'daily_discovery'
        and c.content_id = v_discovery_parts[1]
        and c.topic_id is null
        and c.difficulty is null
        and c.language_code = p_language_code
        and c.is_active
    );
  end if;

  if p_activity_type = 'daily_revision' then
    if p_source <> 'adaptive_revision' or p_topic_id is null then
      return false;
    end if;

    v_revision_parts := pg_catalog.regexp_match(
      p_content_id,
      '^revision:([a-z0-9-]+):([a-z0-9-]+):([0-9]{4}-[0-9]{2}-[0-9]{2}):([1-9][0-9]*)$'
    );
    if v_revision_parts is null or v_revision_parts[1] <> p_topic_id then
      return false;
    end if;

    return exists (
      select 1
      from private.learning_content_catalog c
      where c.activity_type = 'daily_application'
        and c.content_id = v_revision_parts[2]
        and c.topic_id = v_revision_parts[1]
        and c.difficulty = p_difficulty
        and c.language_code = p_language_code
        and c.is_active
    );
  end if;

  if p_activity_type not in (
       'daily_topic','daily_application','daily_discovery','permanent_lesson'
     )
     or p_source <> 'daily' then
    return false;
  end if;

  -- Lesson-start trigger calls this with a null topic; lesson completion RPCs
  -- provide the topic and must match it exactly.
  if p_activity_type = 'permanent_lesson' and p_topic_id is null then
    return exists (
      select 1
      from private.learning_content_catalog c
      where c.activity_type = p_activity_type
        and c.content_id = p_content_id
        and c.difficulty = p_difficulty
        and c.language_code = p_language_code
        and c.is_active
    );
  end if;

  return exists (
    select 1
    from private.learning_content_catalog c
    where c.activity_type = p_activity_type
      and c.content_id = p_content_id
      and c.topic_id is not distinct from p_topic_id
      and c.difficulty is not distinct from p_difficulty
      and c.language_code = p_language_code
      and c.is_active
  );
end;
$function$;

revoke all on function private.is_approved_learning_content(text,text,text,text,text,text)
  from public, anon;
grant execute on function private.is_approved_learning_content(text,text,text,text,text,text)
  to authenticated;

create or replace function private.guard_lesson_progress_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or auth.uid() <> new.user_id then
    raise exception 'Authentication required for own lesson progress'
      using errcode = '42501';
  end if;

  if not private.is_approved_learning_content(
    'permanent_lesson', new.lesson_id, null, new.difficulty, 'en', 'daily'
  ) then
    raise exception 'Lesson is not part of the approved learning catalogue'
      using errcode = '22023';
  end if;

  return new;
end;
$function$;

revoke all on function private.guard_lesson_progress_insert()
  from public, anon, authenticated;

drop trigger if exists lesson_progress_validate_catalogue on public.lesson_progress;
create trigger lesson_progress_validate_catalogue
before insert on public.lesson_progress
for each row execute function private.guard_lesson_progress_insert();

commit;
