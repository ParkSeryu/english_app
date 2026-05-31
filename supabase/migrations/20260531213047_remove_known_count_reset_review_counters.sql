-- Remove the legacy remembered aggregate and restart visible review counters.
-- due_at, interval_days, last_result, and last_reviewed_at are intentionally
-- preserved so existing review scheduling remains intact.

drop index if exists public.expression_progress_user_queue_idx;
drop index if exists public.expressions_owner_queue_idx;

update public.expression_progress
set unknown_count = 0,
    hard_count = 0,
    okay_count = 0,
    easy_count = 0,
    review_count = 0,
    updated_at = now();

update public.expressions
set unknown_count = 0,
    review_count = 0,
    updated_at = now();

alter table public.expression_progress
  drop column if exists known_count;

alter table public.expressions
  drop column if exists known_count;

create index if not exists expression_progress_user_queue_idx
  on public.expression_progress (user_id, unknown_count desc, last_reviewed_at asc nulls first, updated_at asc);

create index if not exists expressions_owner_queue_idx
  on public.expressions (owner_id, unknown_count desc, last_reviewed_at asc nulls first, source_order asc);

notify pgrst, 'reload schema';
