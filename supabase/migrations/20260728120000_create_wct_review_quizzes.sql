create table public.wct_quiz_sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lesson_key text not null check (length(btrim(lesson_key)) between 1 and 240),
  source_kind text not null check (source_kind in ('wct_day', 'wct_premium')),
  source_id text not null check (length(btrim(source_id)) between 1 and 240),
  generator_version text not null check (
    length(btrim(generator_version)) between 1 and 80
  ),
  source_hash text not null check (source_hash ~ '^[0-9a-f]{64}$'),
  questions jsonb not null check (
    jsonb_typeof(questions) = 'array'
    and jsonb_array_length(questions) = 5
  ),
  created_at timestamptz not null default now(),
  unique (owner_id, lesson_key)
);

create table public.wct_quiz_progress (
  quiz_set_id uuid not null references public.wct_quiz_sets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  latest_score integer not null check (latest_score between 0 and 5),
  completed_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (quiz_set_id, user_id)
);

create index wct_quiz_sets_owner_created_idx
on public.wct_quiz_sets(owner_id, created_at desc);

create index wct_quiz_progress_user_updated_idx
on public.wct_quiz_progress(user_id, updated_at desc);

alter table public.wct_quiz_sets enable row level security;
alter table public.wct_quiz_progress enable row level security;
alter table public.wct_quiz_sets force row level security;
alter table public.wct_quiz_progress force row level security;

create policy "wct_quiz_sets_select_own"
on public.wct_quiz_sets
for select to authenticated
using (owner_id = auth.uid());

create policy "wct_quiz_progress_select_own"
on public.wct_quiz_progress
for select to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.wct_quiz_sets quiz
    where quiz.id = wct_quiz_progress.quiz_set_id
      and quiz.owner_id = auth.uid()
  )
);

grant select on public.wct_quiz_sets, public.wct_quiz_progress to authenticated;
revoke insert, update, delete
on public.wct_quiz_sets, public.wct_quiz_progress
from authenticated;
revoke all on public.wct_quiz_sets, public.wct_quiz_progress from anon;
grant all on public.wct_quiz_sets, public.wct_quiz_progress to service_role;

create or replace function public.submit_wct_quiz_attempt(
  p_quiz_set_id uuid,
  p_answers jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_questions jsonb;
  v_answer_count integer;
  v_question_count integer;
  v_score integer;
  v_completed_at timestamptz := clock_timestamp();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select questions
  into v_questions
  from public.wct_quiz_sets
  where id = p_quiz_set_id
    and owner_id = v_user_id;

  if not found then
    raise exception 'WCT quiz not found';
  end if;

  if p_answers is null
    or jsonb_typeof(p_answers) is distinct from 'array'
    or jsonb_array_length(p_answers) <> 5 then
    raise exception 'Exactly five answers are required';
  end if;

  select count(distinct question->>'id')
  into v_question_count
  from jsonb_array_elements(v_questions) question;

  if v_question_count <> 5 then
    raise exception 'Stored WCT quiz is invalid';
  end if;

  select count(distinct answer->>'questionId')
  into v_answer_count
  from jsonb_array_elements(p_answers) answer;

  if v_answer_count <> 5 then
    raise exception 'Each question must be answered once';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) answer
    where not exists (
      select 1
      from jsonb_array_elements(v_questions) question
      where question->>'id' = answer->>'questionId'
        and exists (
          select 1
          from jsonb_array_elements(question->'choices') choice
          where choice->>'id' = answer->>'choiceId'
        )
    )
  ) then
    raise exception 'Unknown WCT quiz question or choice';
  end if;

  select count(*)
  into v_score
  from jsonb_array_elements(p_answers) answer
  join jsonb_array_elements(v_questions) question
    on question->>'id' = answer->>'questionId'
  where question->>'correctChoiceId' = answer->>'choiceId';

  insert into public.wct_quiz_progress (
    quiz_set_id,
    user_id,
    latest_score,
    completed_at,
    updated_at
  ) values (
    p_quiz_set_id,
    v_user_id,
    v_score,
    v_completed_at,
    v_completed_at
  )
  on conflict (quiz_set_id, user_id) do update
  set latest_score = excluded.latest_score,
      completed_at = excluded.completed_at,
      updated_at = excluded.updated_at;

  return jsonb_build_object(
    'score', v_score,
    'total', 5,
    'completedAt', v_completed_at
  );
end;
$$;

revoke all on function public.submit_wct_quiz_attempt(uuid, jsonb)
from public, anon, service_role;

grant execute on function public.submit_wct_quiz_attempt(uuid, jsonb)
to authenticated;

notify pgrst, 'reload schema';
