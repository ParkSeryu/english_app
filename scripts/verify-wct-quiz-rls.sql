-- WCT review quiz sets are service-created, owner-readable, and server-scored.
set role service_role;
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
  'wct-book:wct-prenovice:day:1',
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
    'day-owner-a',
    'a'
  ),
  (
    '50000000-0000-4000-8000-0000000000bb'::uuid,
    '00000000-0000-4000-8000-0000000000bb'::uuid,
    'day-owner-b',
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
