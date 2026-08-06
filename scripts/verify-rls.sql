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
  'wct-review-v1',
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

  select count(*) into v_row_count from public.wct_pop_quiz_progress
  where book_id = '60000000-0000-4000-8000-0000000000aa';
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

set role service_role;
update public.wct_pop_quiz_progress
set answers = answers - (jsonb_array_length(answers) - 1),
    current_index = current_index - 1
where owner_id = '00000000-0000-4000-8000-0000000000aa'
  and book_id = '60000000-0000-4000-8000-0000000000aa';
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000aa';
do $$
declare
  v_attempt_id uuid;
begin
  select attempt_id
  into v_attempt_id
  from public.wct_pop_quiz_progress
  where owner_id = '00000000-0000-4000-8000-0000000000aa'
    and book_id = '60000000-0000-4000-8000-0000000000aa';

  begin
    perform public.complete_wct_pop_quiz(
      '60000000-0000-4000-8000-0000000000aa',
      v_attempt_id
    );
    raise exception 'malformed completed WCT Pop Quiz replay unexpectedly succeeded';
  exception when others then
    if sqlerrm not like '%WCT Pop Quiz answers are incomplete%' then raise; end if;
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

-- V2 Pop Quiz snapshots use explicit balanced formats and per-Day cyclic retakes.
set role service_role;
insert into public.wct_books (id, owner_id, title, level_label)
values (
  '64000000-0000-4000-8000-0000000000aa',
  '00000000-0000-4000-8000-0000000000aa',
  'WCT V2 Pop',
  'Novice'
);
insert into public.wct_days (id, book_id, day_number, short_label)
select
  ('64100000-0000-4000-8000-' || lpad(number::text, 12, '0'))::uuid,
  '64000000-0000-4000-8000-0000000000aa',
  number,
  'V2 Pop ' || number
from generate_series(1, 3) number;

insert into public.wct_quiz_sets (
  id, owner_id, lesson_key, source_kind, source_id,
  generator_version, source_hash, questions
)
select
  ('64200000-0000-4000-8000-' || lpad(day_number::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-0000000000aa',
  'wct-book:wct-v2-pop:day:' || day_number,
  'wct_day',
  '64100000-0000-4000-8000-' || lpad(day_number::text, 12, '0'),
  'wct-review-v2',
  repeat(day_number::text, 64),
  questions.payload
from generate_series(1, 3) day_number
cross join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', format('v2-pop-%s-q%s', day_number, question_number),
      'kind', case when question_number <= 3 then 'translation' else 'pattern' end,
      'format', (array[
        'multiple_choice', 'fill_blank', 'multiple_choice',
        'fill_blank', 'true_false'
      ])[question_number],
      'prompt', format('V2 Pop %s prompt %s', day_number, question_number),
      'choices', case when question_number = 5 then
        jsonb_build_array(
          jsonb_build_object('id', format('v2-pop-%s-q%s-o', day_number, question_number), 'text', 'O'),
          jsonb_build_object('id', format('v2-pop-%s-q%s-x', day_number, question_number), 'text', 'X')
        )
      else
        jsonb_build_array(
          jsonb_build_object('id', format('v2-pop-%s-q%s-a', day_number, question_number), 'text', format('A%s-%s', day_number, question_number)),
          jsonb_build_object('id', format('v2-pop-%s-q%s-b', day_number, question_number), 'text', format('B%s-%s', day_number, question_number)),
          jsonb_build_object('id', format('v2-pop-%s-q%s-c', day_number, question_number), 'text', format('C%s-%s', day_number, question_number)),
          jsonb_build_object('id', format('v2-pop-%s-q%s-d', day_number, question_number), 'text', format('D%s-%s', day_number, question_number))
        )
      end,
      'correctChoiceId', format('v2-pop-%s-q%s-%s', day_number, question_number, case when question_number = 5 then 'o' else 'a' end),
      'explanation', format('V2 Pop %s explanation %s', day_number, question_number),
      'feedback', jsonb_build_object(
        'correctSentence', format('V2 Pop %s sentence %s', day_number, question_number),
        'pattern', format('V2 Pop %s pattern %s', day_number, question_number),
        'reason', format('V2 Pop %s reason %s', day_number, question_number)
      )
    ) order by question_number
  ) as payload
  from generate_series(1, 5) question_number
) questions;
reset role;

-- A malformed directly inserted v2 source cannot exploit SQL NULL format checks.
set role service_role;
update public.wct_quiz_sets
set questions = jsonb_set(questions, '{0}', (questions->0) - 'format')
where id = '64200000-0000-4000-8000-000000000001';
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000aa';
do $$
declare
  v_malformed_questions jsonb;
begin
  select jsonb_agg(
    jsonb_build_object(
      'sourceQuizSetId', quiz.id,
      'dayId', day.id,
      'dayNumber', day.day_number,
      'dayLabel', format('Day %s (%s)', day.day_number, btrim(day.short_label)),
      'dayTopic', day.short_label,
      'band', case day.day_number when 1 then 'early' when 2 then 'middle' else 'late' end,
      'question', quiz.questions->(case day.day_number when 1 then 0 when 2 then 1 else 4 end)
    ) order by day.day_number
  )
  into v_malformed_questions
  from public.wct_quiz_sets quiz
  join public.wct_days day on day.id::text = quiz.source_id
  where day.book_id = '64000000-0000-4000-8000-0000000000aa';

  begin
    perform public.start_wct_pop_quiz(
      '64000000-0000-4000-8000-0000000000aa',
      'missing-v2-format',
      v_malformed_questions
    );
    raise exception 'missing-format v2 source unexpectedly started';
  exception when others then
    if sqlerrm not like '%versions cannot be mixed%' then raise; end if;
  end;
end $$;
reset role;

set role service_role;
update public.wct_quiz_sets
set questions = jsonb_set(questions, '{0,format}', '"multiple_choice"'::jsonb)
where id = '64200000-0000-4000-8000-000000000001';
reset role;

select 'WCT v2 missing-format rejection verification passed' as result;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000aa';
do $$
declare
  v_questions jsonb;
  v_cycle jsonb;
  v_invalid jsonb;
  v_result jsonb;
  v_attempt_id uuid;
  v_item jsonb;
  v_format_counts integer[];
begin
  select jsonb_agg(
    jsonb_build_object(
      'sourceQuizSetId', quiz.id,
      'dayId', day.id,
      'dayNumber', day.day_number,
      'dayLabel', format('Day %s (%s)', day.day_number, btrim(day.short_label)),
      'dayTopic', day.short_label,
      'band', case day.day_number when 1 then 'early' when 2 then 'middle' else 'late' end,
      'question', quiz.questions->(case day.day_number when 1 then 0 when 2 then 1 else 4 end)
    ) order by day.day_number
  )
  into v_questions
  from public.wct_quiz_sets quiz
  join public.wct_days day on day.id::text = quiz.source_id
  where day.book_id = '64000000-0000-4000-8000-0000000000aa';

  v_result := public.start_wct_pop_quiz(
    '64000000-0000-4000-8000-0000000000aa',
    'v2-first',
    v_questions
  );
  if v_result->'questions' <> v_questions then
    raise exception 'v2 Pop did not preserve the exact source snapshot';
  end if;
  select array[
    count(*) filter (where item->'question'->>'format' = 'multiple_choice'),
    count(*) filter (where item->'question'->>'format' = 'fill_blank'),
    count(*) filter (where item->'question'->>'format' = 'true_false')
  ] into v_format_counts
  from jsonb_array_elements(v_result->'questions') item;
  if v_format_counts <> array[1, 1, 1] then
    raise exception 'v2 Pop formats were not balanced: %', v_format_counts;
  end if;

  v_attempt_id := (v_result->>'attempt_id')::uuid;
  for v_item in select item from jsonb_array_elements(v_questions) item loop
    perform public.confirm_wct_pop_quiz_answer(
      '64000000-0000-4000-8000-0000000000aa',
      v_attempt_id,
      v_item->'question'->>'id',
      v_item->'question'->>'correctChoiceId'
    );
  end loop;
  perform public.complete_wct_pop_quiz(
    '64000000-0000-4000-8000-0000000000aa',
    v_attempt_id
  );

  v_invalid := jsonb_set(
    v_questions,
    '{0,sourceQuizSetId}',
    '"62000000-0000-4000-8000-000000000001"'
  );
  begin
    perform public.start_wct_pop_quiz(
      '64000000-0000-4000-8000-0000000000aa',
      'v2-mixed',
      v_invalid
    );
    raise exception 'mixed-version Pop inventory unexpectedly started';
  exception when others then
    if sqlerrm not like '%versions cannot be mixed%' then raise; end if;
  end;

  select jsonb_agg(
    jsonb_build_object(
      'sourceQuizSetId', quiz.id,
      'dayId', day.id,
      'dayNumber', day.day_number,
      'dayLabel', format('Day %s (%s)', day.day_number, btrim(day.short_label)),
      'dayTopic', day.short_label,
      'band', case day.day_number when 1 then 'early' when 2 then 'middle' else 'late' end,
      'question', quiz.questions->(case day.day_number when 1 then 1 when 2 then 4 else 0 end)
    ) order by day.day_number
  )
  into v_cycle
  from public.wct_quiz_sets quiz
  join public.wct_days day on day.id::text = quiz.source_id
  where day.book_id = '64000000-0000-4000-8000-0000000000aa';

  v_invalid := jsonb_set(v_cycle, '{0,question}', v_questions->0->'question');
  v_invalid := jsonb_set(v_invalid, '{2,question}', (
    select questions->1 from public.wct_quiz_sets
    where id = '64200000-0000-4000-8000-000000000003'
  ));
  begin
    perform public.start_wct_pop_quiz(
      '64000000-0000-4000-8000-0000000000aa',
      'v2-identical-question',
      v_invalid
    );
    raise exception 'identical-question v2 retake unexpectedly started';
  exception when others then
    if sqlerrm not like '%change every Day format and question%' then raise; end if;
  end;

  v_invalid := jsonb_set(v_cycle, '{0,question}', (
    select questions->2 from public.wct_quiz_sets
    where id = '64200000-0000-4000-8000-000000000001'
  ));
  v_invalid := jsonb_set(v_invalid, '{2,question}', (
    select questions->1 from public.wct_quiz_sets
    where id = '64200000-0000-4000-8000-000000000003'
  ));
  begin
    perform public.start_wct_pop_quiz(
      '64000000-0000-4000-8000-0000000000aa',
      'v2-identical-format',
      v_invalid
    );
    raise exception 'identical-format v2 retake unexpectedly started';
  exception when others then
    if sqlerrm not like '%change every Day format and question%' then raise; end if;
  end;

  v_invalid := jsonb_set(v_cycle, '{0,question,prompt}', '"forged"');
  begin
    perform public.start_wct_pop_quiz(
      '64000000-0000-4000-8000-0000000000aa',
      'v2-forged',
      v_invalid
    );
    raise exception 'forged v2 source unexpectedly started';
  exception when others then
    if sqlerrm not like '%Unknown WCT Pop Quiz source question%' then raise; end if;
  end;

  select jsonb_agg(item order by (item->>'dayNumber')::integer desc)
  into v_cycle
  from jsonb_array_elements(v_cycle) item;

  if (v_cycle->0->>'dayNumber')::integer
    <= (v_cycle->(jsonb_array_length(v_cycle) - 1)->>'dayNumber')::integer then
    raise exception 'v2 Pop shuffled-order fixture was not descending';
  end if;

  v_result := public.start_wct_pop_quiz(
    '64000000-0000-4000-8000-0000000000aa',
    'v2-cycle',
    v_cycle
  );
  if v_result->'questions' <> v_cycle then
    raise exception 'valid cyclic v2 retake did not preserve its snapshot';
  end if;
  v_attempt_id := (v_result->>'attempt_id')::uuid;
  for v_item in
    select item
    from jsonb_array_elements(v_cycle)
      with ordinality questions(item, position)
    order by position
  loop
    perform public.confirm_wct_pop_quiz_answer(
      '64000000-0000-4000-8000-0000000000aa',
      v_attempt_id,
      v_item->'question'->>'id',
      v_item->'question'->>'correctChoiceId'
    );
  end loop;
  v_result := public.complete_wct_pop_quiz(
    '64000000-0000-4000-8000-0000000000aa',
    v_attempt_id
  );
  if (v_result->>'score')::integer <> jsonb_array_length(v_cycle)
    or (v_result->>'total')::integer <> jsonb_array_length(v_cycle) then
    raise exception 'shuffled v2 Pop completion score was wrong: %', v_result;
  end if;

  select to_jsonb(progress)
  into v_result
  from public.wct_pop_quiz_progress progress
  where owner_id = '00000000-0000-4000-8000-0000000000aa'
    and book_id = '64000000-0000-4000-8000-0000000000aa';
  if v_result->>'status' <> 'completed'
    or (v_result->>'current_index')::integer <> jsonb_array_length(v_cycle)
    or (v_result->>'latest_score')::integer <> jsonb_array_length(v_cycle) then
    raise exception 'shuffled v2 Pop persisted completion was wrong: %', v_result;
  end if;
  perform set_config('test.wct_stale_pop_questions', v_cycle::text, false);
end $$;
reset role;

set role service_role;
do $$
declare
  v_books jsonb;
  v_questions jsonb;
  v_sets jsonb := '[]'::jsonb;
  v_result jsonb;
  v_day integer;
begin
  for v_day in 1..3 loop
    if v_day = 1 then
      select jsonb_agg(
        jsonb_set(
          jsonb_set(question, '{id}', to_jsonb('replacement-' || (question->>'id'))),
          '{choices}',
          (
            select jsonb_agg(
              jsonb_set(choice, '{id}', to_jsonb('replacement-' || (choice->>'id')))
              order by position
            )
            from jsonb_array_elements(question->'choices')
              with ordinality choices(choice, position)
          )
        ) order by position
      ) into v_questions
      from public.wct_quiz_sets quiz
      cross join lateral jsonb_array_elements(quiz.questions)
        with ordinality source(question, position)
      where quiz.id = '64200000-0000-4000-8000-000000000001';

      select jsonb_agg(
        jsonb_set(
          question,
          '{correctChoiceId}',
          to_jsonb('replacement-' || (question->>'correctChoiceId'))
        ) order by position
      ) into v_questions
      from jsonb_array_elements(v_questions) with ordinality source(question, position);
    else
      select questions into v_questions
      from public.wct_quiz_sets
      where id = (
        '64200000-0000-4000-8000-' || lpad(v_day::text, 12, '0')
      )::uuid;
    end if;

    v_sets := v_sets || jsonb_build_array(jsonb_build_object(
      'lessonKey', format('wct-book:wct-v2-pop:day:%s', v_day),
      'sourceKind', 'wct_day',
      'sourceId', format('64100000-0000-4000-8000-%s', lpad(v_day::text, 12, '0')),
      'generatorVersion', 'wct-review-v2',
      'sourceHash', case when v_day = 1 then repeat('d', 64) else repeat(v_day::text, 64) end,
      'questions', v_questions
    ));
  end loop;
  v_books := jsonb_build_array(jsonb_build_object(
    'bookId', '64000000-0000-4000-8000-0000000000aa',
    'sets', v_sets
  ));
  v_result := public.sync_wct_standard_quiz_sets(
    '00000000-0000-4000-8000-0000000000aa',
    v_books
  );
  if (v_result->>'updatedCount')::integer <> 1
    or (v_result->>'unchangedCount')::integer <> 2
    or (v_result->>'resetPopProgressCount')::integer <> 1 then
    raise exception 'v2 Pop reset sync counts were wrong: %', v_result;
  end if;
end $$;
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000aa';
do $$
begin
  begin
    perform public.start_wct_pop_quiz(
      '64000000-0000-4000-8000-0000000000aa',
      'stale-after-sync',
      current_setting('test.wct_stale_pop_questions')::jsonb
    );
    raise exception 'stale post-sync Pop snapshot unexpectedly started';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'WCT_POP_QUIZ_RESTART_REQUIRED' then raise; end if;
  end;
end $$;
reset role;

select 'WCT v2 Pop Quiz verification passed' as result;
