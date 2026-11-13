-- Synthetic identifiers used only by disposable migration/concurrency tests.
-- Never apply this fixture to a hosted Supabase project.

insert into private.learning_content_catalog
  (activity_type,content_id,topic_id,difficulty,language_code,is_active)
values
  ('permanent_lesson','legacy-01','sentence-basics','beginner','en',true),
  ('permanent_lesson','legacy-02','sentence-basics','beginner','en',true),
  ('permanent_lesson','legacy-03','sentence-basics','beginner','en',true),
  ('permanent_lesson','legacy-04','sentence-basics','beginner','en',true),
  ('permanent_lesson','legacy-05','sentence-basics','beginner','en',true),
  ('permanent_lesson','legacy-06','sentence-basics','beginner','en',true),
  ('permanent_lesson','start-free-1','sentence-basics','beginner','en',true),
  ('permanent_lesson','start-free-2','sentence-basics','beginner','en',true),
  ('permanent_lesson','start-free-3','sentence-basics','beginner','en',true),
  ('permanent_lesson','start-free-4','sentence-basics','beginner','en',true),
  ('permanent_lesson','start-free-5','sentence-basics','beginner','en',true),
  ('permanent_lesson','concurrent-01','sentence-basics','beginner','en',true),
  ('permanent_lesson','concurrent-02','sentence-basics','beginner','en',true),
  ('permanent_lesson','concurrent-03','sentence-basics','beginner','en',true),
  ('permanent_lesson','concurrent-04','sentence-basics','beginner','en',true),
  ('permanent_lesson','concurrent-05','sentence-basics','beginner','en',true),
  ('permanent_lesson','concurrent-06','sentence-basics','beginner','en',true),
  ('permanent_lesson','history-delete-race','sentence-basics','beginner','en',true),
  ('permanent_lesson','replay-delete-race','sentence-basics','beginner','en',true),
  ('daily_topic','daily-topic-concurrency-01',null,null,'en',true)
on conflict (activity_type,content_id,language_code) do update
set topic_id=excluded.topic_id,difficulty=excluded.difficulty,is_active=excluded.is_active;
