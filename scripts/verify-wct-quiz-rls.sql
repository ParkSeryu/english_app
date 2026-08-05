-- WCT review quiz sets are service-created, owner-readable, and server-scored.
set role service_role;
insert into public.wct_books (id, owner_id, title, level_label)
values
  (
    '49000000-0000-4000-8000-0000000000aa',
    '00000000-0000-4000-8000-0000000000aa',
    'WCT Standard Fixture',
    'Pre Novice'
  ),
  (
    '49000000-0000-4000-8000-0000000000bb',
    '00000000-0000-4000-8000-0000000000bb',
    'WCT Standard Fixture',
    'Pre Novice'
  );

insert into public.wct_days (id, book_id, day_number, short_label)
values
  (
    '49100000-0000-4000-8000-0000000000aa',
    '49000000-0000-4000-8000-0000000000aa',
    1,
    'Owner A'
  ),
  (
    '49100000-0000-4000-8000-0000000000bb',
    '49000000-0000-4000-8000-0000000000bb',
    1,
    'Owner B'
  );

with generated_questions as (
  select jsonb_agg(jsonb_build_object(
    'id', 'q' || number,
    'kind', case when number <= 3 then 'translation' else 'pattern' end,
    'prompt', 'P' || number,
    'choices', jsonb_build_array(
      jsonb_build_object('id', 'a' || number, 'text', 'A' || number),
      jsonb_build_object('id', 'b' || number, 'text', 'B' || number),
      jsonb_build_object('id', 'c' || number, 'text', 'C' || number),
      jsonb_build_object('id', 'd' || number, 'text', 'D' || number)
    ),
    'correctChoiceId', 'a' || number,
    'explanation', 'E' || number
  ) order by number) as payload
  from generate_series(1, 5) number
)
insert into public.wct_quiz_sets (
  id, owner_id, lesson_key, source_kind, source_id,
  generator_version, source_hash, questions
)
select
  quiz.id,
  quiz.owner_id,
  'wct-book:wct-standard-fixture:day:1',
  'wct_day',
  quiz.source_id,
  'wct-review-v1',
  repeat(quiz.hash_character, 64),
  generated_questions.payload
from generated_questions
cross join (values
  (
    '50000000-0000-4000-8000-0000000000aa'::uuid,
    '00000000-0000-4000-8000-0000000000aa'::uuid,
    '49100000-0000-4000-8000-0000000000aa',
    'a'
  ),
  (
    '50000000-0000-4000-8000-0000000000bb'::uuid,
    '00000000-0000-4000-8000-0000000000bb'::uuid,
    '49100000-0000-4000-8000-0000000000bb',
    'b'
  )
) quiz(id, owner_id, source_id, hash_character);
reset role;

set role anon;
set request.jwt.claim.sub = '';
do $$
begin
  begin
    perform count(*) from public.wct_quiz_sets;
    raise exception 'anon WCT quiz select unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end $$;
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000aa';
do $$
declare
  result jsonb;
  row_count integer;
  stored_score integer;
begin
  select count(*) into row_count from public.wct_quiz_sets;
  if row_count <> 1 then
    raise exception 'owner A quiz sets expected 1, got %', row_count;
  end if;

  begin
    insert into public.wct_quiz_sets (
      owner_id, lesson_key, source_kind, source_id,
      generator_version, source_hash, questions
    ) values (
      '00000000-0000-4000-8000-0000000000aa', 'browser-quiz',
      'wct_day', 'browser', 'wct-review-v1', repeat('c', 64), '[]'::jsonb
    );
    raise exception 'authenticated WCT quiz insert unexpectedly succeeded';
  exception when insufficient_privilege or check_violation or with_check_option_violation then
    null;
  end;

  begin
    insert into public.wct_quiz_progress (
      quiz_set_id, user_id, latest_score, completed_at
    ) values (
      '50000000-0000-4000-8000-0000000000aa',
      '00000000-0000-4000-8000-0000000000aa',
      5,
      now()
    );
    raise exception 'authenticated WCT quiz progress insert unexpectedly succeeded';
  exception when insufficient_privilege or check_violation or with_check_option_violation then
    null;
  end;

  result := public.submit_wct_quiz_attempt(
    '50000000-0000-4000-8000-0000000000aa',
    '[
      {"questionId":"q1","choiceId":"a1"},
      {"questionId":"q2","choiceId":"a2"},
      {"questionId":"q3","choiceId":"a3"},
      {"questionId":"q4","choiceId":"a4"},
      {"questionId":"q5","choiceId":"a5"}
    ]'::jsonb
  );
  if (result->>'score')::integer <> 5 then
    raise exception 'trusted WCT quiz score expected 5, got %', result->>'score';
  end if;

  select count(*), max(latest_score) into row_count, stored_score
  from public.wct_quiz_progress;
  if row_count <> 1 or stored_score <> 5 then
    raise exception 'owner A latest WCT quiz score was not stored';
  end if;

  begin
    perform public.submit_wct_quiz_attempt(
      '50000000-0000-4000-8000-0000000000aa',
      '[
        {"questionId":"q1","choiceId":"a1"},
        {"questionId":"q1","choiceId":"a1"},
        {"questionId":"q3","choiceId":"a3"},
        {"questionId":"q4","choiceId":"a4"},
        {"questionId":"q5","choiceId":"a5"}
      ]'::jsonb
    );
    raise exception 'duplicate WCT quiz answers unexpectedly succeeded';
  exception when others then
    if sqlerrm not like '%Each question must be answered once%' then raise; end if;
  end;

  begin
    perform public.submit_wct_quiz_attempt(
      '50000000-0000-4000-8000-0000000000aa',
      '[
        {"questionId":"q1","choiceId":"missing"},
        {"questionId":"q2","choiceId":"a2"},
        {"questionId":"q3","choiceId":"a3"},
        {"questionId":"q4","choiceId":"a4"},
        {"questionId":"q5","choiceId":"a5"}
      ]'::jsonb
    );
    raise exception 'unknown WCT quiz choice unexpectedly succeeded';
  exception when others then
    if sqlerrm not like '%Unknown WCT quiz question or choice%' then raise; end if;
  end;

  result := public.submit_wct_quiz_attempt(
    '50000000-0000-4000-8000-0000000000aa',
    '[
      {"questionId":"q1","choiceId":"b1"},
      {"questionId":"q2","choiceId":"b2"},
      {"questionId":"q3","choiceId":"b3"},
      {"questionId":"q4","choiceId":"b4"},
      {"questionId":"q5","choiceId":"b5"}
    ]'::jsonb
  );
  select count(*), max(latest_score) into row_count, stored_score
  from public.wct_quiz_progress;
  if row_count <> 1 or stored_score <> 0 then
    raise exception 'latest WCT quiz score was not replaced';
  end if;
end $$;
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000bb';
do $$
begin
  begin
    perform public.submit_wct_quiz_attempt(
      '50000000-0000-4000-8000-0000000000aa',
      '[
        {"questionId":"q1","choiceId":"a1"},
        {"questionId":"q2","choiceId":"a2"},
        {"questionId":"q3","choiceId":"a3"},
        {"questionId":"q4","choiceId":"a4"},
        {"questionId":"q5","choiceId":"a5"}
      ]'::jsonb
    );
    raise exception 'owner B submitted owner A WCT quiz';
  exception when others then
    if sqlerrm not like '%WCT quiz not found%' then raise; end if;
  end;
end $$;
reset role;

select 'WCT quiz RLS verification passed' as result;

-- Premium v1 keeps its relationless scoring path and raw four-choice payload.
set role service_role;
insert into public.wct_quiz_sets (
  id, owner_id, lesson_key, source_kind, source_id,
  generator_version, source_hash, questions
)
select
  '49400000-0000-4000-8000-0000000000aa',
  '00000000-0000-4000-8000-0000000000aa',
  'wct-premium:checkpoint-a-fixture',
  'wct_premium',
  'checkpoint-a-fixture',
  'wct-review-v1',
  repeat('f', 64),
  jsonb_agg(jsonb_build_object(
    'id', 'premium-q' || number,
    'kind', case when number <= 3 then 'translation' else 'pattern' end,
    'prompt', 'Premium prompt ' || number,
    'choices', jsonb_build_array(
      jsonb_build_object('id', 'premium-q' || number || '-a', 'text', 'A'),
      jsonb_build_object('id', 'premium-q' || number || '-b', 'text', 'B'),
      jsonb_build_object('id', 'premium-q' || number || '-c', 'text', 'C'),
      jsonb_build_object('id', 'premium-q' || number || '-d', 'text', 'D')
    ),
    'correctChoiceId', 'premium-q' || number || '-a',
    'explanation', 'Premium explanation ' || number
  ) order by number)
from generate_series(1, 5) number;
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000aa';
do $$
declare
  v_result jsonb;
begin
  v_result := public.submit_wct_quiz_attempt(
    '49400000-0000-4000-8000-0000000000aa',
    '[
      {"questionId":"premium-q1","choiceId":"premium-q1-a"},
      {"questionId":"premium-q2","choiceId":"premium-q2-a"},
      {"questionId":"premium-q3","choiceId":"premium-q3-a"},
      {"questionId":"premium-q4","choiceId":"premium-q4-a"},
      {"questionId":"premium-q5","choiceId":"premium-q5-a"}
    ]'::jsonb
  );
  if (v_result->>'score')::integer <> 5 then
    raise exception 'Premium v1 scoring changed under checkpoint A';
  end if;
end $$;
reset role;

-- Checkpoint A synchronizes complete v2 books atomically and resets only changed sets.
set role service_role;
insert into public.wct_books (id, owner_id, title, level_label)
values (
  '49200000-0000-4000-8000-0000000000aa',
  '00000000-0000-4000-8000-0000000000aa',
  'WCT V2 Sync',
  'Pre Novice'
);

insert into public.wct_days (id, book_id, day_number, short_label)
values
  (
    '49300000-0000-4000-8000-000000000001',
    '49200000-0000-4000-8000-0000000000aa',
    1,
    'V2 One'
  ),
  (
    '49300000-0000-4000-8000-000000000002',
    '49200000-0000-4000-8000-0000000000aa',
    2,
    'V2 Two'
  );

do $$
declare
  v_books jsonb;
  v_changed jsonb;
  v_invalid jsonb;
  v_sets jsonb := '[]'::jsonb;
  v_questions jsonb;
  v_result jsonb;
  v_day integer;
  v_first_id uuid;
  v_first_created_at timestamptz;
  v_count integer;
begin
  for v_day in 1..2 loop
    select jsonb_agg(
      jsonb_build_object(
        'id', format('v2-day-%s-q%s', v_day, number),
        'kind', case when number <= 3 then 'translation' else 'pattern' end,
        'format', (array[
          'multiple_choice', 'fill_blank', 'multiple_choice',
          'fill_blank', 'true_false'
        ])[number],
        'prompt', format('V2 Day %s prompt %s', v_day, number),
        'choices', case when number = 5 then
          jsonb_build_array(
            jsonb_build_object('id', format('v2-day-%s-q%s-o', v_day, number), 'text', 'O'),
            jsonb_build_object('id', format('v2-day-%s-q%s-x', v_day, number), 'text', 'X')
          )
        else
          jsonb_build_array(
            jsonb_build_object('id', format('v2-day-%s-q%s-a', v_day, number), 'text', format('A%s-%s', v_day, number)),
            jsonb_build_object('id', format('v2-day-%s-q%s-b', v_day, number), 'text', format('B%s-%s', v_day, number)),
            jsonb_build_object('id', format('v2-day-%s-q%s-c', v_day, number), 'text', format('C%s-%s', v_day, number)),
            jsonb_build_object('id', format('v2-day-%s-q%s-d', v_day, number), 'text', format('D%s-%s', v_day, number))
          )
        end,
        'correctChoiceId', format('v2-day-%s-q%s-%s', v_day, number, case when number = 5 then 'o' else 'a' end),
        'explanation', format('V2 Day %s explanation %s', v_day, number),
        'feedback', jsonb_build_object(
          'correctSentence', format('V2 Day %s sentence %s', v_day, number),
          'pattern', format('V2 Day %s pattern %s', v_day, number),
          'reason', format('V2 Day %s reason %s', v_day, number)
        )
      ) order by number
    )
    into v_questions
    from generate_series(1, 5) number;

    v_sets := v_sets || jsonb_build_array(jsonb_build_object(
      'lessonKey', format('wct-book:wct-v2-sync:day:%s', v_day),
      'sourceKind', 'wct_day',
      'sourceId', format('49300000-0000-4000-8000-%s', lpad(v_day::text, 12, '0')),
      'generatorVersion', 'wct-review-v2',
      'sourceHash', repeat(v_day::text, 64),
      'questions', v_questions
    ));
  end loop;
  v_books := jsonb_build_array(jsonb_build_object(
    'bookId', '49200000-0000-4000-8000-0000000000aa',
    'sets', v_sets
  ));

  v_result := public.sync_wct_standard_quiz_sets(
    '00000000-0000-4000-8000-0000000000aa',
    v_books
  );
  if v_result <> '{
    "createdCount":2,
    "updatedCount":0,
    "unchangedCount":0,
    "resetQuizProgressCount":0,
    "resetPopProgressCount":0
  }'::jsonb then
    raise exception 'initial v2 sync counts were wrong: %', v_result;
  end if;

  select id, created_at into v_first_id, v_first_created_at
  from public.wct_quiz_sets
  where owner_id = '00000000-0000-4000-8000-0000000000aa'
    and lesson_key = 'wct-book:wct-v2-sync:day:1';

  insert into public.wct_quiz_progress (
    quiz_set_id, user_id, latest_score, completed_at
  ) values (
    v_first_id,
    '00000000-0000-4000-8000-0000000000aa',
    5,
    clock_timestamp()
  );
  insert into public.wct_pop_quiz_progress (
    owner_id, book_id, seed, questions, status
  ) values (
    '00000000-0000-4000-8000-0000000000aa',
    '49200000-0000-4000-8000-0000000000aa',
    'sync-preserve',
    jsonb_build_array(jsonb_build_object('fixture', true)),
    'in_progress'
  );

  v_result := public.sync_wct_standard_quiz_sets(
    '00000000-0000-4000-8000-0000000000aa',
    v_books
  );
  if v_result <> '{
    "createdCount":0,
    "updatedCount":0,
    "unchangedCount":2,
    "resetQuizProgressCount":0,
    "resetPopProgressCount":0
  }'::jsonb then
    raise exception 'unchanged v2 sync counts were wrong: %', v_result;
  end if;
  select count(*) into v_count from public.wct_quiz_progress
  where quiz_set_id = v_first_id;
  if v_count <> 1 then raise exception 'unchanged sync deleted Day progress'; end if;
  select count(*) into v_count from public.wct_pop_quiz_progress
  where book_id = '49200000-0000-4000-8000-0000000000aa';
  if v_count <> 1 then raise exception 'unchanged sync deleted Pop progress'; end if;

  begin
    perform public.sync_wct_standard_quiz_sets(
      '00000000-0000-4000-8000-0000000000aa',
      jsonb_set(v_books, '{0,sets,0,questions,0,prompt}', '"collision"')
    );
    raise exception 'same-version/hash semantic collision unexpectedly synced';
  exception when others then
    if sqlerrm not like '%generator/version integrity collision%' then raise; end if;
  end;

  v_changed := jsonb_set(v_books, '{0,sets,0,sourceHash}', to_jsonb(repeat('d', 64)));
  v_changed := jsonb_set(v_changed, '{0,sets,0,questions,0,prompt}', '"changed prompt"');
  v_result := public.sync_wct_standard_quiz_sets(
    '00000000-0000-4000-8000-0000000000aa',
    v_changed
  );
  if v_result <> '{
    "createdCount":0,
    "updatedCount":1,
    "unchangedCount":1,
    "resetQuizProgressCount":1,
    "resetPopProgressCount":1
  }'::jsonb then
    raise exception 'changed v2 sync counts were wrong: %', v_result;
  end if;
  if not exists (
    select 1 from public.wct_quiz_sets
    where id = v_first_id and created_at = v_first_created_at
      and source_hash = repeat('d', 64)
  ) then
    raise exception 'changed sync did not preserve set identity and created_at';
  end if;

  insert into public.wct_quiz_progress (
    quiz_set_id, user_id, latest_score, completed_at
  ) values (
    v_first_id,
    '00000000-0000-4000-8000-0000000000aa',
    4,
    clock_timestamp()
  );
  insert into public.wct_pop_quiz_progress (
    owner_id, book_id, seed, questions, status
  ) values (
    '00000000-0000-4000-8000-0000000000aa',
    '49200000-0000-4000-8000-0000000000aa',
    'sync-rollback',
    jsonb_build_array(jsonb_build_object('fixture', true)),
    'in_progress'
  );

  v_invalid := jsonb_set(v_changed, '{0,sets,0,sourceHash}', to_jsonb(repeat('e', 64)));
  v_invalid := jsonb_set(v_invalid, '{0,sets,0,questions,0,prompt}', '"must rollback"');
  v_invalid := jsonb_set(v_invalid, '{0,sets,1,sourceKind}', '"wct_premium"');
  begin
    perform public.sync_wct_standard_quiz_sets(
      '00000000-0000-4000-8000-0000000000aa',
      v_invalid
    );
    raise exception 'invalid second set unexpectedly synced';
  exception when others then
    if sqlerrm not like '%invalid WCT standard quiz set%' then raise; end if;
  end;
  if not exists (
    select 1 from public.wct_quiz_sets
    where id = v_first_id and source_hash = repeat('d', 64)
  ) then
    raise exception 'invalid second set failed to roll back the first update';
  end if;
  select count(*) into v_count from public.wct_quiz_progress
  where quiz_set_id = v_first_id;
  if v_count <> 1 then raise exception 'rollback did not preserve Day progress'; end if;
  select count(*) into v_count from public.wct_pop_quiz_progress
  where book_id = '49200000-0000-4000-8000-0000000000aa';
  if v_count <> 1 then raise exception 'rollback did not preserve Pop progress'; end if;

  begin
    perform public.sync_wct_standard_quiz_sets(
      '00000000-0000-4000-8000-0000000000bb',
      v_changed
    );
    raise exception 'service role synced a book for its non-owner';
  exception when others then
    if sqlerrm not like '%does not belong to WCT quiz owner%' then raise; end if;
  end;
end $$;
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000aa';
do $$
begin
  begin
    perform public.sync_wct_standard_quiz_sets(
      '00000000-0000-4000-8000-0000000000aa',
      '[]'::jsonb
    );
    raise exception 'authenticated sync unexpectedly executed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set role anon;
set request.jwt.claim.sub = '';
do $$
begin
  begin
    perform public.sync_wct_standard_quiz_sets(
      '00000000-0000-4000-8000-0000000000aa',
      '[]'::jsonb
    );
    raise exception 'anonymous sync unexpectedly executed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select 'WCT v2 sync verification passed' as result;

-- JSON-null v2 formats must be rejected even when the request equals the source.
set role service_role;
update public.wct_quiz_sets
set questions = jsonb_set(questions, '{0,format}', 'null'::jsonb)
where owner_id = '00000000-0000-4000-8000-0000000000aa'
  and lesson_key = 'wct-book:wct-v2-sync:day:1';
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
      'band', case day.day_number when 1 then 'early' else 'middle' end,
      'question', quiz.questions->(case day.day_number when 1 then 0 else 1 end)
    ) order by day.day_number
  )
  into v_malformed_questions
  from public.wct_quiz_sets quiz
  join public.wct_days day on day.id::text = quiz.source_id
  where day.book_id = '49200000-0000-4000-8000-0000000000aa';

  begin
    perform public.start_wct_pop_quiz(
      '49200000-0000-4000-8000-0000000000aa',
      'null-v2-format',
      v_malformed_questions
    );
    raise exception 'null-format v2 source unexpectedly started';
  exception when others then
    if sqlerrm not like '%versions cannot be mixed%' then raise; end if;
  end;
end $$;
reset role;

set role service_role;
update public.wct_quiz_sets
set questions = jsonb_set(questions, '{0,format}', '"multiple_choice"'::jsonb)
where owner_id = '00000000-0000-4000-8000-0000000000aa'
  and lesson_key = 'wct-book:wct-v2-sync:day:1';
reset role;

select 'WCT v2 null-format rejection verification passed' as result;
