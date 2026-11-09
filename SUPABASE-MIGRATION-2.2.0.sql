-- SwiftDictionary Update 2.2.0 — additive English lesson progress schema
-- Apply once to the intended Supabase project after reviewing its current schema.
create table public.lesson_progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
  lesson_id text not null check (char_length(lesson_id) between 1 and 120),
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint lesson_progress_unique_user_lesson unique (user_id,difficulty,lesson_id),
  constraint lesson_progress_completion_consistent check (
    (status='in_progress' and completed_at is null) or
    (status='completed' and completed_at is not null)
  )
);
create index lesson_progress_user_updated_idx on public.lesson_progress(user_id,updated_at desc);
alter table public.lesson_progress enable row level security;
revoke all on public.lesson_progress from anon,authenticated;
grant select,insert,update on public.lesson_progress to authenticated;
create policy "Users can read their own lesson progress" on public.lesson_progress
  for select to authenticated using ((select auth.uid())=user_id);
create policy "Users can start their own lessons" on public.lesson_progress
  for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users can update their own lesson progress" on public.lesson_progress
  for update to authenticated using ((select auth.uid())=user_id)
  with check ((select auth.uid())=user_id);

create table public.lesson_practice_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
  lesson_id text not null check (char_length(lesson_id) between 1 and 120),
  topic_id text not null check (char_length(topic_id) between 1 and 120),
  correct_count integer not null check (correct_count>=0),
  question_count integer not null check (question_count>0 and correct_count<=question_count),
  attempted_at timestamptz not null default now()
);
create index lesson_practice_results_user_attempted_idx on public.lesson_practice_results(user_id,attempted_at desc);
alter table public.lesson_practice_results enable row level security;
revoke all on public.lesson_practice_results from anon,authenticated;
grant select,insert on public.lesson_practice_results to authenticated;
create policy "Users can read their own lesson practice summaries" on public.lesson_practice_results
  for select to authenticated using ((select auth.uid())=user_id);
create policy "Users can record their own lesson practice summaries" on public.lesson_practice_results
  for insert to authenticated with check ((select auth.uid())=user_id);

create or replace function public.record_lesson_start_allowance()
returns trigger language plpgsql security invoker set search_path=''
as $function$
begin
  if auth.uid() is null or auth.uid()<>new.user_id then
    raise exception 'Authentication required for own lesson progress' using errcode='42501';
  end if;
  insert into public.learning_activity_log(user_id,activity_type,language_code)
  values(new.user_id,'lesson','en');
  return new;
end;
$function$;
create trigger lesson_progress_charge_on_first_start after insert on public.lesson_progress
  for each row execute function public.record_lesson_start_allowance();

create or replace function public.guard_lesson_progress_update()
returns trigger language plpgsql security invoker set search_path=''
as $function$
begin
  if new.user_id is distinct from old.user_id or new.difficulty is distinct from old.difficulty
     or new.lesson_id is distinct from old.lesson_id or new.started_at is distinct from old.started_at then
    raise exception 'Lesson identity and start time cannot be changed' using errcode='42501';
  end if;
  if old.status='completed' and new.status<>'completed' then
    raise exception 'Completed lessons cannot be reopened as incomplete' using errcode='23514';
  end if;
  if old.status='in_progress' and new.status='completed' and new.completed_at is null then
    raise exception 'Completion timestamp is required' using errcode='23514';
  end if;
  new.updated_at:=now();
  return new;
end;
$function$;
create trigger lesson_progress_update_guard before update on public.lesson_progress
  for each row execute function public.guard_lesson_progress_update();
