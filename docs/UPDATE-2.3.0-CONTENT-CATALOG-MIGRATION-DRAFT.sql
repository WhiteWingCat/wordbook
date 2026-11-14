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
  rotation_order integer,
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

alter table private.learning_content_catalog
  add column if not exists rotation_order integer;

create index if not exists learning_content_catalog_topic_idx
  on private.learning_content_catalog(activity_type, topic_id, difficulty, language_code)
  where is_active;

create unique index if not exists learning_content_catalog_discovery_order_idx
  on private.learning_content_catalog(rotation_order)
  where activity_type = 'daily_discovery' and is_active;

alter table private.learning_content_catalog enable row level security;
revoke all on table private.learning_content_catalog from public, anon, authenticated;
grant usage on schema private to authenticated;

comment on table private.learning_content_catalog is
  'Server-only allowlist of stable SwiftDictionary learning content IDs and topic mappings. No answer-level data is stored.';

-- Deactivate any retired/legacy Discovery rows before publishing the ordered rotation.
update private.learning_content_catalog
set is_active = false,
    rotation_order = null,
    updated_at = pg_catalog.now()
where activity_type = 'daily_discovery';

insert into private.learning_content_catalog
  (activity_type, content_id, rotation_order, topic_id, difficulty, language_code, is_active)
values
  ('daily_topic','topic-present-perfect-01',null,'verb-tenses','intermediate','en',true),
  ('daily_topic','topic-articles-01',null,'nouns-and-articles','beginner','en',true),
  ('daily_topic','topic-quantity-01',null,'nouns-and-quantity','beginner','en',true),
  ('daily_topic','topic-sentence-order-01',null,'sentence-basics','beginner','en',true),
  ('daily_topic','topic-collocations-01',null,'collocations','intermediate','en',true),
  ('daily_topic','topic-present-routines-01',null,'verb-tenses','beginner','en',true),
  ('daily_topic','topic-present-continuous-01',null,'verb-tenses','beginner','en',true),
  ('daily_topic','topic-past-continuous-01',null,'verb-tenses','intermediate','en',true),
  ('daily_topic','topic-prepositions-time-01',null,'sentence-basics','beginner','en',true),
  ('daily_topic','topic-pronouns-01',null,'sentence-basics','beginner','en',true),
  ('daily_topic','topic-articles-the-01',null,'nouns-and-articles','intermediate','en',true),
  ('daily_topic','topic-quantity-many-much-01',null,'nouns-and-quantity','beginner','en',true),
  ('daily_topic','topic-everyday-vocabulary-01',null,'everyday-vocabulary','beginner','en',true),
  ('daily_topic','topic-everyday-vocabulary-02',null,'everyday-vocabulary','beginner','en',true),
  ('daily_topic','topic-phrasal-verbs-01',null,'phrasal-verbs','intermediate','en',true),
  ('daily_topic','topic-phrasal-verbs-02',null,'phrasal-verbs','intermediate','en',true),
  ('daily_topic','topic-word-formation-01',null,'word-formation','intermediate','en',true),
  ('daily_topic','topic-word-formation-02',null,'word-formation','intermediate','en',true),
  ('daily_topic','topic-conditionals-01',null,'conditional-sentences','intermediate','en',true),
  ('daily_topic','topic-conditionals-02',null,'conditional-sentences','intermediate','en',true),
  ('daily_topic','topic-advanced-inversion-01',null,'advanced-grammar','advanced','en',true),
  ('daily_topic','topic-advanced-modals-01',null,'advanced-grammar','advanced','en',true),
  ('daily_topic','topic-idioms-01',null,'idioms-fixed-expressions','intermediate','en',true),
  ('daily_topic','topic-idioms-02',null,'idioms-fixed-expressions','intermediate','en',true),
  ('daily_topic','topic-academic-01',null,'academic-professional-english','advanced','en',true),
  ('daily_topic','topic-academic-02',null,'academic-professional-english','advanced','en',true),
  ('daily_topic','topic-precise-vocabulary-01',null,'precise-vocabulary','advanced','en',true),
  ('daily_topic','topic-precise-vocabulary-02',null,'precise-vocabulary','advanced','en',true),
  ('daily_application','application-verb-patterns-01',null,'verb-tenses','intermediate','en',true),
  ('daily_application','application-articles-01',null,'nouns-and-articles','beginner','en',true),
  ('daily_application','application-quantity-01',null,'nouns-and-quantity','beginner','en',true),
  ('daily_application','application-say-tell-01',null,'sentence-basics','intermediate','en',true),
  ('daily_application','application-collocations-01',null,'collocations','intermediate','en',true),
  ('daily_application','application-present-routine-02',null,'verb-tenses','beginner','en',true),
  ('daily_application','application-present-continuous-02',null,'verb-tenses','beginner','en',true),
  ('daily_application','application-past-continuous-02',null,'verb-tenses','intermediate','en',true),
  ('daily_application','application-prepositions-time-01',null,'sentence-basics','beginner','en',true),
  ('daily_application','application-pronouns-01',null,'sentence-basics','beginner','en',true),
  ('daily_application','application-articles-the-02',null,'nouns-and-articles','intermediate','en',true),
  ('daily_application','application-many-much-02',null,'nouns-and-quantity','beginner','en',true),
  ('daily_application','application-everyday-vocabulary-02',null,'everyday-vocabulary','beginner','en',true),
  ('daily_application','application-frequency-01',null,'everyday-vocabulary','beginner','en',true),
  ('daily_application','application-phrasal-separable-02',null,'phrasal-verbs','intermediate','en',true),
  ('daily_application','application-phrasal-meaning-02',null,'phrasal-verbs','intermediate','en',true),
  ('daily_application','application-word-family-02',null,'word-formation','intermediate','en',true),
  ('daily_application','application-prefix-02',null,'word-formation','intermediate','en',true),
  ('daily_application','application-first-conditional-02',null,'conditional-sentences','intermediate','en',true),
  ('daily_application','application-second-conditional-02',null,'conditional-sentences','intermediate','en',true),
  ('daily_application','application-modals-02',null,'advanced-grammar','advanced','en',true),
  ('daily_application','application-inversion-02',null,'advanced-grammar','advanced','en',true),
  ('daily_application','application-idioms-02',null,'idioms-fixed-expressions','intermediate','en',true),
  ('daily_application','application-academic-02',null,'academic-professional-english','advanced','en',true),
  ('daily_application','application-precise-02',null,'precise-vocabulary','advanced','en',true),
  ('daily_discovery','discovery-word-meticulous-01',1,null,null,'en',true),
  ('daily_discovery','discovery-word-reluctant-01',2,null,null,'en',true),
  ('daily_discovery','discovery-word-plausible-01',3,null,null,'en',true),
  ('daily_discovery','discovery-word-fleeting-01',4,null,null,'en',true),
  ('daily_discovery','discovery-word-cumbersome-01',5,null,null,'en',true),
  ('daily_discovery','discovery-word-quaint-01',6,null,null,'en',true),
  ('daily_discovery','discovery-word-weary-01',7,null,null,'en',true),
  ('daily_discovery','discovery-word-subtle-01',8,null,null,'en',true),
  ('daily_discovery','discovery-word-obsolete-01',9,null,null,'en',true),
  ('daily_discovery','discovery-word-resilient-01',10,null,null,'en',true),
  ('daily_discovery','discovery-word-bewildered-01',11,null,null,'en',true),
  ('daily_discovery','discovery-word-scarce-01',12,null,null,'en',true),
  ('daily_discovery','discovery-word-articulate-01',13,null,null,'en',true),
  ('daily_discovery','discovery-word-astute-01',14,null,null,'en',true),
  ('daily_discovery','discovery-word-candid-01',15,null,null,'en',true),
  ('daily_discovery','discovery-word-coherent-01',16,null,null,'en',true),
  ('daily_discovery','discovery-word-concise-01',17,null,null,'en',true),
  ('daily_discovery','discovery-word-diligent-01',18,null,null,'en',true),
  ('daily_discovery','discovery-word-elusive-01',19,null,null,'en',true),
  ('daily_discovery','discovery-word-empathetic-01',20,null,null,'en',true),
  ('daily_discovery','discovery-word-feasible-01',21,null,null,'en',true),
  ('daily_discovery','discovery-word-frugal-01',22,null,null,'en',true),
  ('daily_discovery','discovery-word-genuine-01',23,null,null,'en',true),
  ('daily_discovery','discovery-word-impartial-01',24,null,null,'en',true),
  ('daily_discovery','discovery-word-inevitable-01',25,null,null,'en',true),
  ('daily_discovery','discovery-word-innovative-01',26,null,null,'en',true),
  ('daily_discovery','discovery-word-intuitive-01',27,null,null,'en',true),
  ('daily_discovery','discovery-word-versatile-01',28,null,null,'en',true),
  ('daily_discovery','discovery-word-ambiguous-01',29,null,null,'en',true),
  ('daily_discovery','discovery-word-arbitrary-01',30,null,null,'en',true),
  ('daily_discovery','discovery-word-assertive-01',31,null,null,'en',true),
  ('daily_discovery','discovery-word-authentic-01',32,null,null,'en',true),
  ('daily_discovery','discovery-word-benevolent-01',33,null,null,'en',true),
  ('daily_discovery','discovery-word-conventional-01',34,null,null,'en',true),
  ('daily_discovery','discovery-word-credible-01',35,null,null,'en',true),
  ('daily_discovery','discovery-word-deliberate-01',36,null,null,'en',true),
  ('daily_discovery','discovery-word-distinct-01',37,null,null,'en',true),
  ('daily_discovery','discovery-word-efficient-01',38,null,null,'en',true),
  ('daily_discovery','discovery-word-elaborate-01',39,null,null,'en',true),
  ('daily_discovery','discovery-word-evident-01',40,null,null,'en',true),
  ('daily_discovery','discovery-word-exceptional-01',41,null,null,'en',true),
  ('daily_discovery','discovery-word-flexible-01',42,null,null,'en',true),
  ('daily_discovery','discovery-word-hesitant-01',43,null,null,'en',true),
  ('daily_discovery','discovery-word-humble-01',44,null,null,'en',true),
  ('daily_discovery','discovery-word-immense-01',45,null,null,'en',true),
  ('daily_discovery','discovery-word-intricate-01',46,null,null,'en',true),
  ('daily_discovery','discovery-word-logical-01',47,null,null,'en',true),
  ('daily_discovery','discovery-word-modest-01',48,null,null,'en',true),
  ('daily_discovery','discovery-word-obscure-01',49,null,null,'en',true),
  ('daily_discovery','discovery-word-optimistic-01',50,null,null,'en',true),
  ('daily_discovery','discovery-word-persistent-01',51,null,null,'en',true),
  ('daily_discovery','discovery-word-profound-01',52,null,null,'en',true),
  ('daily_discovery','discovery-word-remarkable-01',53,null,null,'en',true),
  ('daily_discovery','discovery-word-resourceful-01',54,null,null,'en',true),
  ('daily_discovery','discovery-word-sincere-01',55,null,null,'en',true),
  ('daily_discovery','discovery-word-sufficient-01',56,null,null,'en',true),
  ('daily_discovery','discovery-word-temporary-01',57,null,null,'en',true),
  ('daily_discovery','discovery-word-transparent-01',58,null,null,'en',true),
  ('daily_discovery','discovery-word-unique-01',59,null,null,'en',true),
  ('daily_discovery','discovery-word-worthwhile-01',60,null,null,'en',true),
  ('daily_discovery','discovery-word-abundant-01',61,null,null,'en',true),
  ('daily_discovery','discovery-word-accessible-01',62,null,null,'en',true),
  ('daily_discovery','discovery-word-accurate-01',63,null,null,'en',true),
  ('daily_discovery','discovery-word-adaptable-01',64,null,null,'en',true),
  ('daily_discovery','discovery-word-adjacent-01',65,null,null,'en',true),
  ('daily_discovery','discovery-word-cautious-01',66,null,null,'en',true),
  ('daily_discovery','discovery-word-compelling-01',67,null,null,'en',true),
  ('daily_discovery','discovery-word-competent-01',68,null,null,'en',true),
  ('daily_discovery','discovery-word-considerate-01',69,null,null,'en',true),
  ('daily_discovery','discovery-word-consistent-01',70,null,null,'en',true),
  ('daily_discovery','discovery-word-constructive-01',71,null,null,'en',true),
  ('daily_discovery','discovery-word-crucial-01',72,null,null,'en',true),
  ('daily_discovery','discovery-word-diverse-01',73,null,null,'en',true),
  ('daily_discovery','discovery-word-frequent-01',74,null,null,'en',true),
  ('daily_discovery','discovery-word-generous-01',75,null,null,'en',true),
  ('daily_discovery','discovery-word-gradual-01',76,null,null,'en',true),
  ('daily_discovery','discovery-word-hostile-01',77,null,null,'en',true),
  ('daily_discovery','discovery-word-relevant-01',78,null,null,'en',true),
  ('daily_discovery','discovery-word-reliable-01',79,null,null,'en',true),
  ('daily_discovery','discovery-word-significant-01',80,null,null,'en',true),
  ('daily_discovery','discovery-word-straightforward-01',81,null,null,'en',true),
  ('daily_discovery','discovery-word-sustainable-01',82,null,null,'en',true),
  ('daily_discovery','discovery-word-tentative-01',83,null,null,'en',true),
  ('daily_discovery','discovery-word-thorough-01',84,null,null,'en',true),
  ('daily_discovery','discovery-word-valid-01',85,null,null,'en',true),
  ('daily_discovery','discovery-word-vulnerable-01',86,null,null,'en',true),
  ('daily_discovery','discovery-word-wary-01',87,null,null,'en',true),
  ('daily_discovery','discovery-word-vivid-01',88,null,null,'en',true),
  ('daily_discovery','discovery-word-adequate-01',89,null,null,'en',true),
  ('daily_discovery','discovery-word-compatible-01',90,null,null,'en',true),
  ('daily_discovery','discovery-word-comprehensive-01',91,null,null,'en',true),
  ('daily_discovery','discovery-word-astounding-01',92,null,null,'en',true),
  ('daily_discovery','discovery-word-intriguing-01',93,null,null,'en',true),
  ('permanent_lesson','b-sentence',null,'sentence-basics','beginner','en',true),
  ('permanent_lesson','b-present',null,'verb-tenses','beginner','en',true),
  ('permanent_lesson','b-articles',null,'nouns-and-articles','beginner','en',true),
  ('permanent_lesson','b-verb-combinations',null,'everyday-vocabulary','beginner','en',true),
  ('permanent_lesson','b-countable-nouns',null,'nouns-and-quantity','beginner','en',true),
  ('permanent_lesson','i-perfect',null,'verb-tenses','intermediate','en',true),
  ('permanent_lesson','i-phrasal',null,'phrasal-verbs','intermediate','en',true),
  ('permanent_lesson','i-collocations',null,'collocations','intermediate','en',true),
  ('permanent_lesson','i-word-families',null,'word-formation','intermediate','en',true),
  ('permanent_lesson','i-conditionals',null,'conditional-sentences','intermediate','en',true),
  ('permanent_lesson','a-inversion',null,'advanced-grammar','advanced','en',true),
  ('permanent_lesson','a-idioms',null,'idioms-fixed-expressions','advanced','en',true),
  ('permanent_lesson','a-hedging',null,'academic-professional-english','advanced','en',true),
  ('permanent_lesson','a-near-synonyms',null,'precise-vocabulary','advanced','en',true),
  ('permanent_lesson','a-mixed-conditionals',null,'advanced-grammar','advanced','en',true)
on conflict (activity_type, content_id, language_code) do update
set rotation_order = excluded.rotation_order,
    topic_id = excluded.topic_id,
    difficulty = excluded.difficulty,
    is_active = excluded.is_active,
    updated_at = pg_catalog.now();

do $constraint$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'learning_content_catalog_rotation_order_shape'
      and conrelid = 'private.learning_content_catalog'::regclass
  ) then
    alter table private.learning_content_catalog
      add constraint learning_content_catalog_rotation_order_shape
      check (
        (activity_type = 'daily_discovery' and (
          (is_active and rotation_order between 1 and 93)
          or (not is_active and rotation_order is null)
        ))
        or (activity_type <> 'daily_discovery' and rotation_order is null)
      );
  end if;
end;
$constraint$;

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
  v_discovery_order integer;
  v_discovery_pool_size integer;
  v_discovery_day date;
  v_discovery_day_offset integer;
  v_discovery_first_order integer;
  v_discovery_slot integer;
  v_discovery_plan text;
  v_discovery_allowed_slots integer;
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

    v_discovery_day := v_discovery_parts[2]::date;
    if v_discovery_day <> (pg_catalog.now() at time zone 'UTC')::date then
      return false;
    end if;

    select c.rotation_order into v_discovery_order
    from private.learning_content_catalog c
    where c.activity_type = 'daily_discovery'
      and c.content_id = v_discovery_parts[1]
      and c.topic_id is null
      and c.difficulty is null
      and c.language_code = p_language_code
      and c.is_active
      and c.rotation_order between 1 and 93;

    if v_discovery_order is null then
      return false;
    end if;

    select pg_catalog.count(*) into v_discovery_pool_size
    from private.learning_content_catalog c
    where c.activity_type = 'daily_discovery'
      and c.language_code = p_language_code
      and c.is_active
      and c.rotation_order between 1 and 93;

    if v_discovery_pool_size <> 93 or pg_catalog.mod(v_discovery_pool_size,3) <> 0 then
      return false;
    end if;

    v_discovery_day_offset := v_discovery_day - date '2026-11-15';
    v_discovery_first_order :=
      pg_catalog.mod(pg_catalog.mod(v_discovery_day_offset * 3,v_discovery_pool_size)
        + v_discovery_pool_size,v_discovery_pool_size) + 1;
    v_discovery_slot :=
      pg_catalog.mod(v_discovery_order - v_discovery_first_order + v_discovery_pool_size,
        v_discovery_pool_size);

    select case
      when e.status = 'active'
       and (e.valid_from is null or pg_catalog.now() >= e.valid_from)
       and (e.valid_until is null or pg_catalog.now() < e.valid_until)
      then e.plan_code
      else 'free'
    end
    into v_discovery_plan
    from public.user_entitlements e
    where e.user_id = auth.uid();

    if not found then
      v_discovery_plan := 'free';
    end if;

    select l.daily_limit into v_discovery_allowed_slots
    from public.learning_plan_limits l
    where l.plan_code = v_discovery_plan
      and l.activity_type = 'daily_discovery'
      and l.is_enabled;

    if not found or v_discovery_allowed_slots is null then
      return false;
    end if;

    -- Free is allowed only schedule slot 1; Premium can use all three slots.
    return v_discovery_slot >= 0
      and v_discovery_slot < least(v_discovery_allowed_slots,3);
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
