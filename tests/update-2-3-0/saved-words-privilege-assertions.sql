-- Least-privilege checks for the saved-word table. Disposable databases only.
do $$
begin
  if has_table_privilege('anon','public.saved_words','SELECT')
     or has_table_privilege('anon','public.saved_words','INSERT')
     or has_table_privilege('anon','public.saved_words','UPDATE')
     or has_table_privilege('anon','public.saved_words','DELETE')
     or has_table_privilege('anon','public.saved_words','TRUNCATE') then
    raise exception 'Anonymous role retains privileges on saved_words';
  end if;

  if not has_table_privilege('authenticated','public.saved_words','SELECT')
     or not has_table_privilege('authenticated','public.saved_words','INSERT')
     or not has_table_privilege('authenticated','public.saved_words','DELETE') then
    raise exception 'Authenticated role is missing a required saved_words privilege';
  end if;

  if has_sequence_privilege('anon','public.saved_words_id_seq','USAGE')
     or has_sequence_privilege('anon','public.saved_words_id_seq','SELECT')
     or has_sequence_privilege('anon','public.saved_words_id_seq','UPDATE') then
    raise exception 'Anonymous role retains privileges on the saved_words identity sequence';
  end if;

  if not has_sequence_privilege('authenticated','public.saved_words_id_seq','USAGE')
     or has_sequence_privilege('authenticated','public.saved_words_id_seq','SELECT')
     or has_sequence_privilege('authenticated','public.saved_words_id_seq','UPDATE') then
    raise exception 'Authenticated saved_words identity sequence privileges are not minimal';
  end if;

  if has_table_privilege('authenticated','public.saved_words','UPDATE')
     or has_table_privilege('authenticated','public.saved_words','TRUNCATE')
     or has_table_privilege('authenticated','public.saved_words','REFERENCES')
     or has_table_privilege('authenticated','public.saved_words','TRIGGER') then
    raise exception 'Authenticated role retains unnecessary saved_words privileges';
  end if;

  if not (select relrowsecurity from pg_catalog.pg_class where oid='public.saved_words'::regclass) then
    raise exception 'saved_words must keep RLS enabled';
  end if;

  if not exists (select 1 from pg_catalog.pg_policies where schemaname='public' and tablename='saved_words' and cmd='SELECT')
     or not exists (select 1 from pg_catalog.pg_policies where schemaname='public' and tablename='saved_words' and cmd='INSERT')
     or not exists (select 1 from pg_catalog.pg_policies where schemaname='public' and tablename='saved_words' and cmd='DELETE') then
    raise exception 'saved_words owner-scoped RLS policies are incomplete';
  end if;

  if exists (select 1 from pg_catalog.pg_policies where schemaname='public' and tablename='saved_words' and cmd='UPDATE') then
    raise exception 'Unexpected saved_words UPDATE policy exists';
  end if;
end;
$$;
