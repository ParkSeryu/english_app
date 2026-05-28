-- Store review counts by the exact four memorization buttons:
-- 모름/again is tracked by existing unknown_count, while remembered buttons get
-- separate 어려움/알긴암/쉬움 counters.
alter table public.expression_progress
  add column if not exists okay_count integer not null default 0 check (okay_count >= 0),
  add column if not exists easy_count integer not null default 0 check (easy_count >= 0);

comment on column public.expression_progress.hard_count is 'Number of reviews marked 어려움 by this learner.';
comment on column public.expression_progress.okay_count is 'Number of reviews marked 알긴암 by this learner.';
comment on column public.expression_progress.easy_count is 'Number of reviews marked 쉬움 by this learner.';

-- The earlier manageable_count draft collapsed 알긴암 and 쉬움. Keep the applied
-- migration immutable, but remove the collapsed column from the final schema.
alter table public.expression_progress drop column if exists manageable_count;

notify pgrst, 'reload schema';
