-- Track remembered reviews by subjective difficulty while preserving the existing
-- total known/unknown counters.
alter table public.expression_progress
  add column if not exists hard_count integer not null default 0 check (hard_count >= 0),
  add column if not exists manageable_count integer not null default 0 check (manageable_count >= 0);

-- Historical known reviews cannot be split between hard/manageable. Keep the
-- displayed detail total aligned by classifying unsplit historical known reviews
-- as manageable.
update public.expression_progress
set manageable_count = known_count
where known_count > 0
  and hard_count = 0
  and manageable_count = 0;

comment on column public.expression_progress.hard_count is 'Number of remembered reviews marked hard by this learner.';
comment on column public.expression_progress.manageable_count is 'Number of remembered reviews marked manageable/non-hard by this learner.';

notify pgrst, 'reload schema';
