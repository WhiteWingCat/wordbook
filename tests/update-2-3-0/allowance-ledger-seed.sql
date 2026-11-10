-- Seed legacy completion history before the allowance-ledger migration runs.
-- This simulates pre-existing rows that must be reconciled into the compact ledger.
insert into auth.users(id)
values ('88888888-8888-4888-8888-888888888888');

insert into auth.sessions(id,user_id,created_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','88888888-8888-4888-8888-888888888888',now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','88888888-8888-4888-8888-888888888888',now() - interval '1 hour'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','88888888-8888-4888-8888-888888888888',now(),now() - interval '1 minute');

insert into public.profiles(user_id,display_name)
values ('88888888-8888-4888-8888-888888888888','Keep Profile');

insert into public.user_preferences(user_id, timezone)
values ('88888888-8888-4888-8888-888888888888','UTC');

insert into public.user_entitlements(user_id,plan_code,status)
values ('88888888-8888-4888-8888-888888888888','free','active');

alter table public.learning_activity_log disable trigger enforce_learning_daily_limit;

insert into public.learning_activity_log
  (user_id,activity_type,language_code,event_type,created_at)
values
  ('88888888-8888-4888-8888-888888888888','lesson','en','completed',now() - interval '10 minutes'),
  ('88888888-8888-4888-8888-888888888888','lesson','en','completed',now() - interval '5 minutes');

alter table public.learning_activity_log enable trigger enforce_learning_daily_limit;
