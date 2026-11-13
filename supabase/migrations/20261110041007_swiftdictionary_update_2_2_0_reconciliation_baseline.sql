-- SwiftDictionary Update 2.2.0 schema reconciliation baseline
-- The 2.2.0 lesson schema was deployed before a corresponding migration-history
-- entry was recorded. This migration DOES NOT recreate or modify those objects.
-- It verifies the deployed baseline and records this reconciliation point.
-- Known implementation drift from SUPABASE-MIGRATION-2.2.0.sql is documented
-- in docs/UPDATE-2.3.0-TECHNICAL-DESIGN.md; later migrations must build on the
-- inspected live definitions, not blindly replay the original additive script.

do $reconcile$
declare
  v_missing text[] := array[]::text[];
begin
  if to_regclass('public.lesson_progress') is null then
    v_missing := array_append(v_missing, 'public.lesson_progress');
  end if;
  if to_regclass('public.lesson_practice_results') is null then
    v_missing := array_append(v_missing, 'public.lesson_practice_results');
  end if;
  if to_regclass('public.learning_activity_log') is null then
    v_missing := array_append(v_missing, 'public.learning_activity_log');
  end if;
  if to_regclass('public.learning_plan_limits') is null then
    v_missing := array_append(v_missing, 'public.learning_plan_limits');
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.lesson_progress'::regclass
      and tgname = 'lesson_progress_charge_on_first_start'
      and not tgisinternal
  ) then
    v_missing := array_append(v_missing, 'lesson_progress_charge_on_first_start trigger');
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.lesson_progress'::regclass
      and tgname = 'lesson_progress_update_guard'
      and not tgisinternal
  ) then
    v_missing := array_append(v_missing, 'lesson_progress_update_guard trigger');
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.learning_activity_log'::regclass
      and tgname = 'enforce_learning_daily_limit_before_insert'
      and not tgisinternal
  ) then
    v_missing := array_append(v_missing, 'enforce_learning_daily_limit_before_insert trigger');
  end if;

  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'lesson_progress'
      and c.relrowsecurity
  ) then
    v_missing := array_append(v_missing, 'RLS enabled on lesson_progress');
  end if;

  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'lesson_practice_results'
      and c.relrowsecurity
  ) then
    v_missing := array_append(v_missing, 'RLS enabled on lesson_practice_results');
  end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'record_lesson_start_allowance'
  ) then
    v_missing := array_append(v_missing, 'record_lesson_start_allowance() function');
  end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'guard_lesson_progress_update'
  ) then
    v_missing := array_append(v_missing, 'guard_lesson_progress_update() function');
  end if;

  if cardinality(v_missing) > 0 then
    raise exception 'Update 2.2.0 reconciliation failed; missing: %',
      array_to_string(v_missing, ', ');
  end if;
end
$reconcile$;
