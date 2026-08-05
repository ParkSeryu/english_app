#!/usr/bin/env bash
set -euo pipefail

CONTAINER="${1:?usage: verify-wct-quiz-concurrency.sh <postgres-container>}"
OUT_DIR="$(mktemp -d)"
SYNC_OUT="$OUT_DIR/sync.out"
POP_OUT="$OUT_DIR/pop.out"
SUBMIT_SYNC_OUT="$OUT_DIR/submit-sync.out"
SUBMIT_OUT="$OUT_DIR/submit.out"

cleanup() {
  rm -f "$SYNC_OUT" "$POP_OUT" "$SUBMIT_SYNC_OUT" "$SUBMIT_OUT"
  rmdir "$OUT_DIR" 2>/dev/null || true
}
trap cleanup EXIT

psql_exec() {
  docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d postgres "$@"
}

wait_for_advisory_lock() {
  local application_name="$1"
  local attempts=0
  local lock_count
  while (( attempts < 50 )); do
    if ! lock_count="$(docker exec "$CONTAINER" psql -Atq -U postgres -d postgres -c \
      "select count(*) from pg_locks locks join pg_stat_activity activity on activity.pid = locks.pid where locks.locktype = 'advisory' and locks.granted and activity.application_name = '$application_name'")"; then
      attempts=$((attempts + 1))
      sleep 0.1
      continue
    fi
    if [[ "$lock_count" == "1" ]]; then
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 0.1
  done
  echo "timed out waiting for advisory lock held by $application_name" >&2
  return 1
}

psql_exec <<'SQL'
set role service_role;
insert into public.wct_books (id, owner_id, title, level_label)
values (
  '70000000-0000-4000-8000-0000000000aa',
  '00000000-0000-4000-8000-0000000000aa',
  'WCT Concurrency',
  'Pre Novice'
);
insert into public.wct_days (id, book_id, day_number, short_label)
values
  ('70100000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-0000000000aa', 1, 'Concurrent One'),
  ('70100000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-0000000000aa', 2, 'Concurrent Two');
reset role;

create function public.test_wct_v2_questions(p_prefix text, p_day integer)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select jsonb_agg(
    jsonb_build_object(
      'id', format('%s-day-%s-q%s', p_prefix, p_day, number),
      'kind', case when number <= 3 then 'translation' else 'pattern' end,
      'format', (array[
        'multiple_choice', 'fill_blank', 'multiple_choice',
        'fill_blank', 'true_false'
      ])[number],
      'prompt', format('%s Day %s prompt %s', p_prefix, p_day, number),
      'choices', case when number = 5 then
        jsonb_build_array(
          jsonb_build_object('id', format('%s-day-%s-q%s-o', p_prefix, p_day, number), 'text', 'O'),
          jsonb_build_object('id', format('%s-day-%s-q%s-x', p_prefix, p_day, number), 'text', 'X')
        )
      else
        jsonb_build_array(
          jsonb_build_object('id', format('%s-day-%s-q%s-a', p_prefix, p_day, number), 'text', format('A%s', number)),
          jsonb_build_object('id', format('%s-day-%s-q%s-b', p_prefix, p_day, number), 'text', format('B%s', number)),
          jsonb_build_object('id', format('%s-day-%s-q%s-c', p_prefix, p_day, number), 'text', format('C%s', number)),
          jsonb_build_object('id', format('%s-day-%s-q%s-d', p_prefix, p_day, number), 'text', format('D%s', number))
        )
      end,
      'correctChoiceId', format('%s-day-%s-q%s-%s', p_prefix, p_day, number, case when number = 5 then 'o' else 'a' end),
      'explanation', format('%s Day %s explanation %s', p_prefix, p_day, number),
      'feedback', jsonb_build_object(
        'correctSentence', format('%s Day %s sentence %s', p_prefix, p_day, number),
        'pattern', format('%s Day %s pattern %s', p_prefix, p_day, number),
        'reason', format('%s Day %s reason %s', p_prefix, p_day, number)
      )
    ) order by number
  )
  from generate_series(1, 5) number
$$;

create function public.test_wct_sync_payload(p_prefix text)
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  select jsonb_build_array(jsonb_build_object(
    'bookId', '70000000-0000-4000-8000-0000000000aa',
    'sets', jsonb_agg(jsonb_build_object(
      'lessonKey', format('wct-book:wct-concurrency:day:%s', day_number),
      'sourceKind', 'wct_day',
      'sourceId', format('70100000-0000-4000-8000-%s', lpad(day_number::text, 12, '0')),
      'generatorVersion', 'wct-review-v2',
      'sourceHash', repeat(case p_prefix
        when 'old' then 'a'
        when 'new-pop' then 'b'
        when 'submit-new' then 'c'
        else 'd'
      end, 64),
      'questions', public.test_wct_v2_questions(p_prefix, day_number)
    ) order by day_number)
  ))
  from generate_series(1, 2) day_number
$$;

create function public.test_wct_pop_payload(p_prefix text)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select jsonb_agg(jsonb_build_object(
    'sourceQuizSetId', format('70200000-0000-4000-8000-%s', lpad(day_number::text, 12, '0')),
    'dayId', format('70100000-0000-4000-8000-%s', lpad(day_number::text, 12, '0')),
    'dayNumber', day_number,
    'dayLabel', format('Day %s (Concurrent %s)', day_number, case day_number when 1 then 'One' else 'Two' end),
    'dayTopic', format('Concurrent %s', case day_number when 1 then 'One' else 'Two' end),
    'band', case day_number when 1 then 'early' else 'middle' end,
    'question', public.test_wct_v2_questions(p_prefix, day_number)->(day_number - 1)
  ) order by day_number)
  from generate_series(1, 2) day_number
$$;

set role service_role;
insert into public.wct_quiz_sets (
  id, owner_id, lesson_key, source_kind, source_id,
  generator_version, source_hash, questions
)
select
  ('70200000-0000-4000-8000-' || lpad(day_number::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-0000000000aa',
  format('wct-book:wct-concurrency:day:%s', day_number),
  'wct_day',
  format('70100000-0000-4000-8000-%s', lpad(day_number::text, 12, '0')),
  'wct-review-v2',
  repeat('a', 64),
  public.test_wct_v2_questions('old', day_number)
from generate_series(1, 2) day_number;
reset role;
SQL

timeout 12s docker exec -e PGAPPNAME=wct-sync-pop -i "$CONTAINER" \
  psql -v ON_ERROR_STOP=1 -U postgres -d postgres >"$SYNC_OUT" 2>&1 <<'SQL' &
begin;
set role service_role;
select public.sync_wct_standard_quiz_sets(
  '00000000-0000-4000-8000-0000000000aa',
  public.test_wct_sync_payload('new-pop')
);
select pg_sleep(3);
commit;
SQL
SYNC_PID=$!
if ! wait_for_advisory_lock "wct-sync-pop"; then
  wait "$SYNC_PID" || true
  cat "$SYNC_OUT" >&2
  exit 1
fi

timeout 12s docker exec -e PGAPPNAME=wct-pop-waiter -i "$CONTAINER" \
  psql -v ON_ERROR_STOP=1 -Atq -U postgres -d postgres >"$POP_OUT" 2>&1 <<'SQL' &
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000aa';
select result->'questions'->0->'question'->>'id'
from (
  select public.start_wct_pop_quiz(
    '70000000-0000-4000-8000-0000000000aa',
    'serialized-pop',
    public.test_wct_pop_payload('new-pop')
  ) as result
) started;
SQL
POP_PID=$!
sleep 0.4
if ! kill -0 "$POP_PID" 2>/dev/null; then
  echo "Pop start did not wait for the sync advisory lock" >&2
  cat "$POP_OUT" >&2
  exit 1
fi
if ! wait "$SYNC_PID"; then
  echo "synchronizing session failed" >&2
  cat "$SYNC_OUT" >&2
  exit 1
fi
if ! wait "$POP_PID"; then
  echo "serialized Pop session failed" >&2
  cat "$POP_OUT" >&2
  exit 1
fi
if ! grep -qx 'new-pop-day-1-q1' "$POP_OUT"; then
  echo "Pop start did not snapshot the new synchronized set" >&2
  cat "$POP_OUT" >&2
  exit 1
fi

psql_exec <<'SQL'
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000aa';
select public.submit_wct_quiz_attempt(
  '70200000-0000-4000-8000-000000000001',
  jsonb_build_array(
    jsonb_build_object('questionId', 'new-pop-day-1-q1', 'choiceId', 'new-pop-day-1-q1-a'),
    jsonb_build_object('questionId', 'new-pop-day-1-q2', 'choiceId', 'new-pop-day-1-q2-a'),
    jsonb_build_object('questionId', 'new-pop-day-1-q3', 'choiceId', 'new-pop-day-1-q3-a'),
    jsonb_build_object('questionId', 'new-pop-day-1-q4', 'choiceId', 'new-pop-day-1-q4-a'),
    jsonb_build_object('questionId', 'new-pop-day-1-q5', 'choiceId', 'new-pop-day-1-q5-o')
  )
);
reset role;
SQL

timeout 12s docker exec -e PGAPPNAME=wct-sync-submit -i "$CONTAINER" \
  psql -v ON_ERROR_STOP=1 -U postgres -d postgres >"$SUBMIT_SYNC_OUT" 2>&1 <<'SQL' &
begin;
set role service_role;
select public.sync_wct_standard_quiz_sets(
  '00000000-0000-4000-8000-0000000000aa',
  public.test_wct_sync_payload('submit-new')
);
select pg_sleep(3);
commit;
SQL
SUBMIT_SYNC_PID=$!
if ! wait_for_advisory_lock "wct-sync-submit"; then
  wait "$SUBMIT_SYNC_PID" || true
  cat "$SUBMIT_SYNC_OUT" >&2
  exit 1
fi

set +e
timeout 12s docker exec -e PGAPPNAME=wct-submit-waiter -i "$CONTAINER" \
  psql -v ON_ERROR_STOP=1 -U postgres -d postgres >"$SUBMIT_OUT" 2>&1 <<'SQL' &
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000aa';
select public.submit_wct_quiz_attempt(
  '70200000-0000-4000-8000-000000000001',
  jsonb_build_array(
    jsonb_build_object('questionId', 'new-pop-day-1-q1', 'choiceId', 'new-pop-day-1-q1-a'),
    jsonb_build_object('questionId', 'new-pop-day-1-q2', 'choiceId', 'new-pop-day-1-q2-a'),
    jsonb_build_object('questionId', 'new-pop-day-1-q3', 'choiceId', 'new-pop-day-1-q3-a'),
    jsonb_build_object('questionId', 'new-pop-day-1-q4', 'choiceId', 'new-pop-day-1-q4-a'),
    jsonb_build_object('questionId', 'new-pop-day-1-q5', 'choiceId', 'new-pop-day-1-q5-o')
  )
);
SQL
SUBMIT_PID=$!
set -e
sleep 0.4
if ! kill -0 "$SUBMIT_PID" 2>/dev/null; then
  echo "stale standard submission did not wait for the sync advisory lock" >&2
  cat "$SUBMIT_OUT" >&2
  exit 1
fi
if ! wait "$SUBMIT_SYNC_PID"; then
  echo "submit synchronization session failed" >&2
  cat "$SUBMIT_SYNC_OUT" >&2
  exit 1
fi
set +e
wait "$SUBMIT_PID"
SUBMIT_STATUS=$?
set -e
if [[ "$SUBMIT_STATUS" -eq 0 ]] || ! grep -q 'Unknown WCT quiz question or choice' "$SUBMIT_OUT"; then
  echo "stale standard submission did not fail after synchronized replacement" >&2
  cat "$SUBMIT_OUT" >&2
  exit 1
fi

PROGRESS_COUNT="$(docker exec "$CONTAINER" psql -Atq -U postgres -d postgres -c \
  "select count(*) from public.wct_quiz_progress where quiz_set_id = '70200000-0000-4000-8000-000000000001'")"
if [[ "$PROGRESS_COUNT" != "0" ]]; then
  echo "stale standard submission recreated deleted progress" >&2
  exit 1
fi

psql_exec <<'SQL'
drop function public.test_wct_pop_payload(text);
drop function public.test_wct_sync_payload(text);
drop function public.test_wct_v2_questions(text, integer);
SQL

echo "WCT quiz concurrency verification passed"
