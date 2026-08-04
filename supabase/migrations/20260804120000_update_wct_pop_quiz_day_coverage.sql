alter table public.wct_pop_quiz_progress
  drop constraint wct_pop_quiz_progress_questions_check,
  drop constraint wct_pop_quiz_progress_answers_check,
  drop constraint wct_pop_quiz_progress_current_index_check,
  drop constraint wct_pop_quiz_progress_latest_score_check;

alter table public.wct_pop_quiz_progress
  add constraint wct_pop_quiz_progress_questions_check check (
    jsonb_typeof(questions) = 'array'
    and jsonb_array_length(questions) between 1 and 100
  ),
  add constraint wct_pop_quiz_progress_answers_check check (
    jsonb_typeof(answers) = 'array'
    and jsonb_array_length(answers) <= jsonb_array_length(questions)
  ),
  add constraint wct_pop_quiz_progress_current_index_check check (
    current_index between 0 and jsonb_array_length(questions)
  ),
  add constraint wct_pop_quiz_progress_latest_score_check check (
    latest_score is null or latest_score between 0 and jsonb_array_length(questions)
  );

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
  v_day_count integer;
  v_question_count integer;
  v_question_day_count integer;
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

  select count(*)::integer
  into v_day_count
  from public.wct_days day
  join public.wct_books book on book.id = day.book_id
  where day.book_id = p_book_id
    and book.owner_id = v_user_id;

  if v_day_count not between 1 and 100
    or p_questions is null
    or jsonb_typeof(p_questions) is distinct from 'array'
    or jsonb_array_length(p_questions) <> v_day_count then
    raise exception 'One WCT Pop Quiz question per Day is required';
  end if;

  select
    count(distinct item->'question'->>'id'),
    count(distinct item->>'dayId')
  into v_question_count, v_question_day_count
  from jsonb_array_elements(p_questions) item;

  if v_question_count <> v_day_count then
    raise exception 'WCT Pop Quiz question IDs must be distinct';
  end if;
  if v_question_day_count <> v_day_count
    or exists (
      select 1
      from public.wct_days day
      where day.book_id = p_book_id
        and not exists (
          select 1
          from jsonb_array_elements(p_questions) item
          where item->>'dayId' = day.id::text
        )
    ) then
    raise exception 'One WCT Pop Quiz question per Day is required';
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
      or coalesce(item->'question'->>'kind', '') not in ('translation', 'pattern')
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
          and day.short_label = item->>'dayTopic'
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
  v_total integer;
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

  v_total := jsonb_array_length(v_attempt.questions);

  if v_attempt.current_index <> v_total
    or jsonb_array_length(v_attempt.answers) <> v_total then
    raise exception 'WCT Pop Quiz answers are incomplete';
  end if;

  if v_attempt.status = 'completed' then
    return jsonb_build_object(
      'score', v_attempt.latest_score,
      'total', v_total,
      'incorrectDays', v_attempt.incorrect_days,
      'completedAt', v_attempt.completed_at
    );
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
    'total', v_total,
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
