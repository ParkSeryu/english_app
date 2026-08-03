create table public.wct_pop_quiz_progress (
  owner_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.wct_books(id) on delete cascade,
  attempt_id uuid not null default gen_random_uuid(),
  seed text not null check (length(btrim(seed)) between 1 and 240),
  questions jsonb not null check (
    jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) = 20
  ),
  answers jsonb not null default '[]'::jsonb check (
    jsonb_typeof(answers) = 'array' and jsonb_array_length(answers) <= 20
  ),
  current_index integer not null default 0 check (current_index between 0 and 20),
  status text not null check (status in ('in_progress', 'completed')),
  latest_score integer check (latest_score between 0 and 20),
  incorrect_days jsonb not null default '[]'::jsonb check (
    jsonb_typeof(incorrect_days) = 'array'
  ),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (owner_id, book_id)
);

create index wct_pop_quiz_progress_owner_updated_idx
on public.wct_pop_quiz_progress(owner_id, updated_at desc);

alter table public.wct_pop_quiz_progress enable row level security;
alter table public.wct_pop_quiz_progress force row level security;

create policy "wct_pop_quiz_progress_select_own"
on public.wct_pop_quiz_progress
for select to authenticated
using (owner_id = auth.uid());

grant select on public.wct_pop_quiz_progress to authenticated;
revoke insert, update, delete
on public.wct_pop_quiz_progress
from authenticated;
revoke all on public.wct_pop_quiz_progress from anon;
grant all on public.wct_pop_quiz_progress to service_role;

create or replace function public.start_wct_pop_quiz(
  p_book_id uuid,
  p_seed text,
  p_questions jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt public.wct_pop_quiz_progress%rowtype;
  v_book_level text;
  v_question_count integer;
  v_translation_count integer;
  v_pattern_count integer;
  v_early_count integer;
  v_middle_count integer;
  v_late_count integer;
  v_max_day_count integer;
  v_requested_signature text;
  v_existing_signature text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select regexp_replace(
    lower(coalesce(level_label, '')),
    '[[:space:]]+',
    '',
    'g'
  )
  into v_book_level
  from public.wct_books
  where id = p_book_id
    and owner_id = v_user_id;

  if not found then
    raise exception 'WCT book not found';
  end if;
  if v_book_level not in ('prenovice', 'novice') then
    raise exception 'Pop Quiz is only available for Prenovice and Novice';
  end if;

  if p_seed is null or length(btrim(p_seed)) not between 1 and 240 then
    raise exception 'Invalid WCT Pop Quiz seed';
  end if;

  if p_questions is null or jsonb_typeof(p_questions) is distinct from 'array' then
    raise exception 'Exactly 20 WCT Pop Quiz questions are required';
  end if;
  if jsonb_array_length(p_questions) <> 20 then
    raise exception 'Exactly 20 WCT Pop Quiz questions are required';
  end if;

  select
    count(distinct item->'question'->>'id'),
    count(*) filter (where item->'question'->>'kind' = 'translation'),
    count(*) filter (where item->'question'->>'kind' = 'pattern'),
    count(*) filter (where item->>'band' = 'early'),
    count(*) filter (where item->>'band' = 'middle'),
    count(*) filter (where item->>'band' = 'late')
  into
    v_question_count,
    v_translation_count,
    v_pattern_count,
    v_early_count,
    v_middle_count,
    v_late_count
  from jsonb_array_elements(p_questions) item;

  if v_question_count <> 20 then
    raise exception 'WCT Pop Quiz question IDs must be distinct';
  end if;
  if v_translation_count <> 12 or v_pattern_count <> 8 then
    raise exception 'WCT Pop Quiz type quotas must match';
  end if;
  if v_early_count <> 7 or v_middle_count <> 7 or v_late_count <> 6 then
    raise exception 'WCT Pop Quiz band quotas must match';
  end if;

  select coalesce(max(day_count), 0)
  into v_max_day_count
  from (
    select count(*)::integer as day_count
    from jsonb_array_elements(p_questions) item
    group by item->>'dayId'
  ) day_counts;

  if v_max_day_count > 2 then
    raise exception 'A WCT Day may contribute at most two questions';
  end if;

  if exists (
    with ordered_days as (
      select
        id,
        row_number() over (order by day_number) as day_position,
        count(*) over () as day_count
      from public.wct_days
      where book_id = p_book_id
    ),
    banded_days as (
      select
        id,
        case
          when day_position <= ceiling(day_count::numeric / 3) then 'early'
          when day_position <= (
            ceiling(day_count::numeric / 3)
            + ceiling(
              (day_count - ceiling(day_count::numeric / 3))::numeric / 2
            )
          ) then 'middle'
          else 'late'
        end as expected_band
      from ordered_days
    )
    select 1
    from jsonb_array_elements(p_questions) item
    join banded_days on banded_days.id::text = item->>'dayId'
    where item->>'band' is distinct from expected_band
  ) then
    raise exception 'WCT Pop Quiz bands do not match ordered Days';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_questions) item
    where jsonb_typeof(item) is distinct from 'object'
      or nullif(item->>'sourceQuizSetId', '') is null
      or nullif(item->>'dayId', '') is null
      or jsonb_typeof(item->'question') is distinct from 'object'
      or not exists (
        select 1
        from public.wct_quiz_sets quiz
        join public.wct_days day
          on day.id::text = quiz.source_id
         and day.book_id = p_book_id
        cross join lateral jsonb_array_elements(quiz.questions) source_question
        where quiz.id::text = item->>'sourceQuizSetId'
          and quiz.owner_id = v_user_id
          and quiz.source_kind = 'wct_day'
          and day.id::text = item->>'dayId'
          and day.day_number::text = item->>'dayNumber'
          and format('Day %s (%s)', day.day_number, btrim(day.short_label)) = item->>'dayLabel'
          and source_question = item->'question'
      )
  ) then
    raise exception 'Unknown WCT Pop Quiz source question';
  end if;

  select string_agg(signature, '|' order by signature)
  into v_requested_signature
  from (
    select concat(
      item->>'sourceQuizSetId',
      ':',
      item->'question'->>'id'
    ) as signature
    from jsonb_array_elements(p_questions) item
  ) requested;

  select *
  into v_attempt
  from public.wct_pop_quiz_progress
  where owner_id = v_user_id
    and book_id = p_book_id
  for update;

  if found then
    if v_attempt.status = 'in_progress' then
      return to_jsonb(v_attempt);
    end if;

    select string_agg(signature, '|' order by signature)
    into v_existing_signature
    from (
      select concat(
        item->>'sourceQuizSetId',
        ':',
        item->'question'->>'id'
      ) as signature
      from jsonb_array_elements(v_attempt.questions) item
    ) existing;

    if v_existing_signature = v_requested_signature then
      raise exception 'WCT Pop Quiz retake must use different questions';
    end if;
  end if;

  insert into public.wct_pop_quiz_progress (
    owner_id,
    book_id,
    attempt_id,
    seed,
    questions,
    answers,
    current_index,
    status,
    latest_score,
    incorrect_days,
    started_at,
    completed_at,
    updated_at
  ) values (
    v_user_id,
    p_book_id,
    gen_random_uuid(),
    btrim(p_seed),
    p_questions,
    '[]'::jsonb,
    0,
    'in_progress',
    null,
    '[]'::jsonb,
    clock_timestamp(),
    null,
    clock_timestamp()
  )
  on conflict (owner_id, book_id) do update
  set attempt_id = gen_random_uuid(),
      seed = excluded.seed,
      questions = excluded.questions,
      answers = '[]'::jsonb,
      current_index = 0,
      status = 'in_progress',
      latest_score = null,
      incorrect_days = '[]'::jsonb,
      started_at = excluded.started_at,
      completed_at = null,
      updated_at = excluded.updated_at
  where wct_pop_quiz_progress.status = 'completed'
  returning * into v_attempt;

  if not found then
    select *
    into v_attempt
    from public.wct_pop_quiz_progress
    where owner_id = v_user_id
      and book_id = p_book_id;
  end if;

  return to_jsonb(v_attempt);
end;
$$;

create or replace function public.confirm_wct_pop_quiz_answer(
  p_book_id uuid,
  p_attempt_id uuid,
  p_question_id text,
  p_choice_id text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt public.wct_pop_quiz_progress%rowtype;
  v_question jsonb;
  v_existing_answer jsonb;
  v_answer jsonb;
  v_confirmed_at timestamptz := clock_timestamp();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_attempt
  from public.wct_pop_quiz_progress
  where owner_id = v_user_id
    and book_id = p_book_id
    and attempt_id = p_attempt_id
  for update;

  if not found then
    raise exception 'WCT Pop Quiz attempt not found';
  end if;

  select answer
  into v_existing_answer
  from jsonb_array_elements(v_attempt.answers) answer
  where answer->>'questionId' = p_question_id;

  if found then
    if v_existing_answer->>'choiceId' is distinct from p_choice_id then
      raise exception 'WCT Pop Quiz answer is already confirmed';
    end if;
    select item->'question'
    into v_question
    from jsonb_array_elements(v_attempt.questions) item
    where item->'question'->>'id' = p_question_id;

    return jsonb_build_object(
      'answer', v_existing_answer,
      'isCorrect', v_question->>'correctChoiceId' = p_choice_id,
      'correctChoiceId', v_question->>'correctChoiceId',
      'currentIndex', v_attempt.current_index
    );
  end if;

  if v_attempt.status <> 'in_progress' then
    raise exception 'WCT Pop Quiz attempt is completed';
  end if;

  v_question := v_attempt.questions->v_attempt.current_index->'question';
  if v_question is null or v_question->>'id' is distinct from p_question_id then
    raise exception 'WCT Pop Quiz question is not current';
  end if;
  if not exists (
    select 1
    from jsonb_array_elements(v_question->'choices') choice
    where choice->>'id' = p_choice_id
  ) then
    raise exception 'Unknown WCT Pop Quiz question or choice';
  end if;

  v_answer := jsonb_build_object(
    'questionId', p_question_id,
    'choiceId', p_choice_id,
    'confirmedAt', v_confirmed_at
  );

  update public.wct_pop_quiz_progress
  set answers = answers || jsonb_build_array(v_answer),
      current_index = current_index + 1,
      updated_at = v_confirmed_at
  where owner_id = v_user_id
    and book_id = p_book_id;

  return jsonb_build_object(
    'answer', v_answer,
    'isCorrect', v_question->>'correctChoiceId' = p_choice_id,
    'correctChoiceId', v_question->>'correctChoiceId',
    'currentIndex', v_attempt.current_index + 1
  );
end;
$$;

create or replace function public.complete_wct_pop_quiz(
  p_book_id uuid,
  p_attempt_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt public.wct_pop_quiz_progress%rowtype;
  v_score integer;
  v_incorrect_days jsonb;
  v_completed_at timestamptz := clock_timestamp();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_attempt
  from public.wct_pop_quiz_progress
  where owner_id = v_user_id
    and book_id = p_book_id
    and attempt_id = p_attempt_id
  for update;

  if not found then
    raise exception 'WCT Pop Quiz attempt not found';
  end if;

  if v_attempt.status = 'completed' then
    return jsonb_build_object(
      'score', v_attempt.latest_score,
      'total', 20,
      'incorrectDays', v_attempt.incorrect_days,
      'completedAt', v_attempt.completed_at
    );
  end if;

  if v_attempt.current_index <> 20
    or jsonb_array_length(v_attempt.answers) <> 20 then
    raise exception 'WCT Pop Quiz answers are incomplete';
  end if;

  select count(*)
  into v_score
  from jsonb_array_elements(v_attempt.questions) item
  join jsonb_array_elements(v_attempt.answers) answer
    on answer->>'questionId' = item->'question'->>'id'
  where answer->>'choiceId' = item->'question'->>'correctChoiceId';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'dayId', incorrect.day_id,
        'dayNumber', incorrect.day_number,
        'dayLabel', incorrect.day_label
      ) order by incorrect.first_position
    ),
    '[]'::jsonb
  )
  into v_incorrect_days
  from (
    select
      item->>'dayId' as day_id,
      min((item->>'dayNumber')::integer) as day_number,
      min(item->>'dayLabel') as day_label,
      min(position) as first_position
    from jsonb_array_elements(v_attempt.questions) with ordinality question(item, position)
    join jsonb_array_elements(v_attempt.answers) answer
      on answer->>'questionId' = item->'question'->>'id'
    where answer->>'choiceId' <> item->'question'->>'correctChoiceId'
    group by item->>'dayId'
  ) incorrect;

  update public.wct_pop_quiz_progress
  set status = 'completed',
      latest_score = v_score,
      incorrect_days = v_incorrect_days,
      completed_at = v_completed_at,
      updated_at = v_completed_at
  where owner_id = v_user_id
    and book_id = p_book_id;

  return jsonb_build_object(
    'score', v_score,
    'total', 20,
    'incorrectDays', v_incorrect_days,
    'completedAt', v_completed_at
  );
end;
$$;

revoke all on function public.start_wct_pop_quiz(uuid, text, jsonb)
from public, anon, service_role;
revoke all on function public.confirm_wct_pop_quiz_answer(uuid, uuid, text, text)
from public, anon, service_role;
revoke all on function public.complete_wct_pop_quiz(uuid, uuid)
from public, anon, service_role;

grant execute on function public.start_wct_pop_quiz(uuid, text, jsonb)
to authenticated;
grant execute on function public.confirm_wct_pop_quiz_answer(uuid, uuid, text, text)
to authenticated;
grant execute on function public.complete_wct_pop_quiz(uuid, uuid)
to authenticated;

notify pgrst, 'reload schema';
