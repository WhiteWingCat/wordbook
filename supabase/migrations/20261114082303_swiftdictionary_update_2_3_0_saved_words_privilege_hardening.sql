-- SwiftDictionary Update 2.3.0 — least-privilege hardening for saved words.
-- Read-only production review found unnecessary anon and authenticated grants.
-- The browser only requires authenticated SELECT, INSERT (upsert DO NOTHING),
-- and DELETE. RLS policies continue to scope all rows to auth.uid().
-- Applied to the live SwiftDictionary Supabase project as migration 20261114082303.
begin;

revoke all privileges on table public.saved_words from public, anon, authenticated;
grant select, insert, delete on table public.saved_words to authenticated;
revoke all privileges on sequence public.saved_words_id_seq from public, anon, authenticated;
grant usage on sequence public.saved_words_id_seq to authenticated;

commit;
