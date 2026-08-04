-- WCT Pop Quiz attempts are owner-readable and writable only through authenticated RPCs.
set role service_role;

insert into public.wct_books (id, owner_id, title, level_label)
values
  (
    '60000000-0000-4000-8000-0000000000aa',
    '00000000-0000-4000-8000-0000000000aa',
    'WCT Pop Quiz RLS',
    'Pre Novice'
  ),
  (
    '60000000-0000-4000-8000-0000000000ab',
    '00000000-0000-4000-8000-0000000000aa',
    'Unsupported WCT Pop Quiz RLS',
    'Premium'
  );

insert into public.wct_days (
  id, book_id, day_number, short_label
)
select
  ('61000000-0000-4000-8000-' || lpad(number::text, 12, '0'))::uuid,
  '60000000-0000-4000-8000-0000000000aa',
  number,
  'Pop ' || number
from generate_series(1, 12) number;

insert into public.wct_quiz_sets (
  id,
  owner_id,
  lesson_key,
  source_kind,
  source_id,
  generator_version,
  source_hash,
  questions
)
select
  ('62000000-0000-4000-8000-' || lpad(day_number::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-0000000000aa',
  'wct-pop-quiz-rls:' || day_number,
  'wct_day',
  ('61000000-0000-4000-8000-' || lpad(day_number::text, 12, '0')),
  'wct-pop-quiz-rls-v1',
  repeat('c', 64),
  questions.payload
from generate_series(1, 12) day_number
cross join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', 'q' || day_number || '-' || question_number,
      'kind', case
        when day_number <= 6 or (day_number = 7 and question_number = 1)
          then 'translation'
        else 'pattern'
      end,
      'prompt', 'Prompt ' || day_number || '-' || question_number,
      'choices', jsonb_build_array(
        jsonb_build_object('id', 'q' || day_number || '-' || question_number || '-a', 'text', 'A'),
        jsonb_build_object('id', 'q' || day_number || '-' || question_number || '-b', 'text', 'B'),
        jsonb_build_object('id', 'q' || day_number || '-' || question_number || '-c', 'text', 'C'),
        jsonb_build_object('id', 'q' || day_number || '-' || question_number || '-d', 'text', 'D')
      ),
      'correctChoiceId', 'q' || day_number || '-' || question_number || '-a',
      'explanation', 'Explanation ' || day_number || '-' || question_number
    )
    order by question_number
  ) as payload
  from generate_series(1, 5) question_number
) questions;

reset role;

set role anon;
set request.jwt.claim.sub = '';
do $$
begin
  begin
    perform count(*) from public.wct_pop_quiz_progress;
    raise exception 'anon WCT Pop Quiz select unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end $$;
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000aa';
do $$
declare
  v_questions jsonb;
  v_result jsonb;
  v_attempt_id uuid;
  v_item jsonb;
  v_choice_id text;
  v_position integer := 0;
  v_row_count integer;
  v_invalid jsonb;
  v_duplicate_day_question jsonb;
  v_reordered jsonb;
begin
  select jsonb_agg(
    jsonb_build_object(
      'sourceQuizSetId', quiz.id,
      'dayId', day.id,
      'dayNumber', day.day_number,
      'dayLabel', format('Day %s (%s)', day.day_number, btrim(day.short_label)),
      'dayTopic', day.short_label,
      'band', case
        when day.day_number <= 4 then 'early'
        when day.day_number <= 8 then 'middle'
        else 'late'
      end,
      'question', source_question
    )
    order by day.day_number, position
  )
  into v_questions
  from public.wct_quiz_sets quiz
  join public.wct_days day on day.id::text = quiz.source_id
  cross join lateral jsonb_array_elements(quiz.questions)
    with ordinality question(source_question, position)
  where quiz.owner_id = '00000000-0000-4000-8000-0000000000aa'
    and day.book_id = '60000000-0000-4000-8000-0000000000aa'
    and position = 1;

  select jsonb_build_object(
    'sourceQuizSetId', quiz.id,
    'dayId', day.id,
    'dayNumber', day.day_number,
    'dayLabel', format('Day %s (%s)', day.day_number, btrim(day.short_label)),
    'dayTopic', day.short_label,
    'band', 'early',
    'question', source_question
  )
  into v_duplicate_day_question
  from public.wct_quiz_sets quiz
  join public.wct_days day on day.id::text = quiz.source_id
  cross join lateral jsonb_array_elements(quiz.questions)
    with ordinality question(source_question, position)
  where quiz.owner_id = '00000000-0000-4000-8000-0000000000aa'
    and day.book_id = '60000000-0000-4000-8000-0000000000aa'
    and day.day_number = 1
    and position = 2;

  begin
    perform public.start_wct_pop_quiz(
      '60000000-0000-4000-8000-0000000000ab',
      'unsupported-level',
      v_questions
    );
    raise exception 'unsupported-level WCT Pop Quiz unexpectedly started';
  exception when others then
    if sqlerrm not like '%only available for Prenovice and Novice%' then
      raise;
    end if;
  end;

  begin
    perform public.start_wct_pop_quiz(
      '60000000-0000-4000-8000-0000000000aa',
      'missing-day',
      v_questions - 11
    );
    raise exception 'missing-Day WCT Pop Quiz unexpectedly started';
  exception when others then
    if sqlerrm not like '%One WCT Pop Quiz question per Day is required%' then
      raise;
    end if;
  end;

  v_invalid := jsonb_set(v_questions, '{11}', v_duplicate_day_question);
  begin
    perform public.start_wct_pop_quiz(
      '60000000-0000-4000-8000-0000000000aa',
      'duplicated-day',
      v_invalid
    );
    raise exception 'duplicated-Day WCT Pop Quiz unexpectedly started';
  exception when others then
    if sqlerrm not like '%One WCT Pop Quiz question per Day is required%' then
      raise;
    end if;
  end;

  v_invalid := jsonb_set(v_questions, '{0,band}', '"middle"'::jsonb);
  begin
    perform public.start_wct_pop_quiz(
      '60000000-0000-4000-8000-0000000000aa',
      'forged-band',
      v_invalid
    );
    raise exception 'forged-band WCT Pop Quiz unexpectedly started';
  exception when others then
    if sqlerrm not like '%bands do not match ordered Days%' then raise; end if;
  end;

  begin
    perform public.start_wct_pop_quiz(
      '60000000-0000-4000-8000-0000000000aa',
      'tampered',
      jsonb_set(v_questions, '{0,question,correctChoiceId}', '"fake"'::jsonb)
    );
    raise exception 'tampered WCT Pop Quiz source unexpectedly started';
  exception when others then
    if sqlerrm not like '%Unknown WCT Pop Quiz source question%' then
      raise;
    end if;
  end;

  v_result := public.start_wct_pop_quiz(
    '60000000-0000-4000-8000-0000000000aa',
    'seed-a',
    v_questions
  );
  v_attempt_id := (v_result->>'attempt_id')::uuid;

  if v_result->>'status' <> 'in_progress'
    or (v_result->>'current_index')::integer <> 0 then
    raise exception 'WCT Pop Quiz did not start at question zero';
  end if;

  v_result := public.start_wct_pop_quiz(
    '60000000-0000-4000-8000-0000000000aa',
    'ignored-seed',
    v_questions
  );
  if (v_result->>'attempt_id')::uuid <> v_attempt_id
    or v_result->>'seed' <> 'seed-a' then
    raise exception 'in-progress WCT Pop Quiz was not resumed';
  end if;

  for v_item in
    select item
    from jsonb_array_elements(v_questions) with ordinality question(item, position)
    order by position
  loop
    v_position := v_position + 1;
    if v_position <= 2 then
      v_choice_id := v_item->'question'->'choices'->1->>'id';
    else
      v_choice_id := v_item->'question'->>'correctChoiceId';
    end if;

    v_result := public.confirm_wct_pop_quiz_answer(
      '60000000-0000-4000-8000-0000000000aa',
      v_attempt_id,
      v_item->'question'->>'id',
      v_choice_id
    );

    if (v_result->>'currentIndex')::integer <> v_position then
      raise exception 'WCT Pop Quiz current index did not advance';
    end if;

    if v_position = 1 then
      v_result := public.confirm_wct_pop_quiz_answer(
        '60000000-0000-4000-8000-0000000000aa',
        v_attempt_id,
        v_item->'question'->>'id',
        v_choice_id
      );
      if (v_result->>'currentIndex')::integer <> 1 then
        raise exception 'WCT Pop Quiz answer replay was not idempotent';
      end if;

      begin
        perform public.confirm_wct_pop_quiz_answer(
          '60000000-0000-4000-8000-0000000000aa',
          v_attempt_id,
          v_item->'question'->>'id',
          v_item->'question'->'choices'->2->>'id'
        );
        raise exception 'changed WCT Pop Quiz answer unexpectedly succeeded';
      exception when others then
        if sqlerrm not like '%already confirmed%' then raise; end if;
      end;
    end if;
  end loop;

  v_result := public.complete_wct_pop_quiz(
    '60000000-0000-4000-8000-0000000000aa',
    v_attempt_id
  );
  if (v_result->>'score')::integer <> jsonb_array_length(v_questions) - 2
    or (v_result->>'total')::integer <> jsonb_array_length(v_questions)
    or jsonb_array_length(v_result->'incorrectDays') <> 2
    or v_result->'incorrectDays'->0->>'dayId' <> '61000000-0000-4000-8000-000000000001' then
    raise exception 'WCT Pop Quiz completion was not server-derived';
  end if;

  v_result := public.complete_wct_pop_quiz(
    '60000000-0000-4000-8000-0000000000aa',
    v_attempt_id
  );
  if (v_result->>'score')::integer <> jsonb_array_length(v_questions) - 2
    or (v_result->>'total')::integer <> jsonb_array_length(v_questions) then
    raise exception 'WCT Pop Quiz completion replay changed the score';
  end if;

  select jsonb_agg(item order by position desc)
  into v_reordered
  from jsonb_array_elements(v_questions)
    with ordinality question(item, position);

  begin
    perform public.start_wct_pop_quiz(
      '60000000-0000-4000-8000-0000000000aa',
      'identical-retake',
      v_reordered
    );
    raise exception 'identical WCT Pop Quiz retake unexpectedly started';
  exception when others then
    if sqlerrm not like '%retake must use different questions%' then raise; end if;
  end;

  select count(*) into v_row_count from public.wct_pop_quiz_progress;
  if v_row_count <> 1 then
    raise exception 'owner A expected one WCT Pop Quiz row, got %', v_row_count;
  end if;

  begin
    insert into public.wct_pop_quiz_progress (
      owner_id, book_id, seed, questions, status
    ) values (
      '00000000-0000-4000-8000-0000000000aa',
      '60000000-0000-4000-8000-0000000000aa',
      'direct',
      v_questions,
      'in_progress'
    );
    raise exception 'authenticated WCT Pop Quiz insert unexpectedly succeeded';
  exception when insufficient_privilege or check_violation or with_check_option_violation then
    null;
  end;
end $$;
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000bb';
do $$
declare
  v_row_count integer;
begin
  select count(*) into v_row_count from public.wct_pop_quiz_progress;
  if v_row_count <> 0 then
    raise exception 'owner B saw owner A WCT Pop Quiz progress';
  end if;

  begin
    perform public.complete_wct_pop_quiz(
      '60000000-0000-4000-8000-0000000000aa',
      '63000000-0000-4000-8000-0000000000aa'
    );
    raise exception 'owner B completed owner A WCT Pop Quiz';
  exception when others then
    if sqlerrm not like '%attempt not found%' then raise; end if;
  end;
end $$;
reset role;

select 'WCT Pop Quiz RLS verification passed' as result;
