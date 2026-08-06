#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CHECKPOINT_B="supabase/migrations/20260805130000_replace_wct_standard_quizzes_v2.sql"
MIGRATION_CUTOFF="20260805120000_add_wct_quiz_v2_compatibility.sql"
PRD_DIR="docs/prd/active/wct-quiz-quality-variety"
if [[ ! -d "$PRD_DIR" ]]; then
  PRD_DIR="docs/prd/complete/wct-quiz-quality-variety"
fi
ARTIFACT="$PRD_DIR/question-artifact.json"
APPROVAL="$PRD_DIR/audit-approval.json"

if [[ ! -f "$CHECKPOINT_B" ]]; then
  echo "Skipping WCT v2 data migration verification: $CHECKPOINT_B is absent."
  exit 0
fi

for required_file in "$ARTIFACT" "$APPROVAL" "supabase/migrations/$MIGRATION_CUTOFF"; do
  if [[ ! -f "$required_file" ]]; then
    echo "Required WCT v2 verification input is absent: $required_file" >&2
    exit 1
  fi
done

IMAGE="${POSTGRES_IMAGE:-postgres:16-alpine}"
COMMAND_TIMEOUT_SECONDS="${WCT_V2_VERIFY_TIMEOUT_SECONDS:-180}"
CONTAINER="english-review-wct-v2-data-$RANDOM-$$"
WORK_DIR="$(mktemp -d)"
FIXTURE_SQL="$WORK_DIR/fixture.sql"
EXPECTED_SQL="$WORK_DIR/expected.sql"
BASE_SQL="$WORK_DIR/base-through-a.sql"
HELPERS_SQL="$WORK_DIR/helpers.sql"
VALIDATE_FIXTURE_SQL="$WORK_DIR/validate-fixture.sql"
CAPTURE_BEFORE_SQL="$WORK_DIR/capture-before.sql"
SUCCESS_ASSERT_SQL="$WORK_DIR/assert-success.sql"
ROLLBACK_ASSERT_SQL="$WORK_DIR/assert-rollback.sql"
PREIMAGE_FAILURE_OUT="$WORK_DIR/preimage-failure.out"
POSTCONDITION_FAILURE_OUT="$WORK_DIR/postcondition-failure.out"
ZERO_TARGET_FAILURE_OUT="$WORK_DIR/zero-target-failure.out"

cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  rm -rf -- "$WORK_DIR"
}
trap cleanup EXIT

run_bounded() {
  timeout "${COMMAND_TIMEOUT_SECONDS}s" "$@"
}

NODE_BIN="${NODE_BINARY:-$(command -v node || true)}"
if [[ -z "$NODE_BIN" || ! -x "$NODE_BIN" ]]; then
  echo "A Linux Node.js executable is required for the approved fixture renderer." >&2
  exit 1
fi
export PATH="$(dirname "$NODE_BIN"):$PATH"

npm run wct:quiz-v2:fixture -- \
  --artifact "$ARTIFACT" \
  --approval "$APPROVAL" \
  --output "$FIXTURE_SQL"

"$NODE_BIN" --input-type=module - "$ARTIFACT" "$EXPECTED_SQL" <<'NODE'
import { readFileSync, writeFileSync } from "node:fs";

const [artifactPath, outputPath] = process.argv.slice(2);
const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
if (artifact.sets?.length !== 44
  || artifact.targetV1SetSnapshot?.length !== 44
  || artifact.sourceCorrectionManifest?.length !== 8
  || artifact.sets.reduce((total, set) => total + set.questions.length, 0) !== 220) {
  throw new Error("Approved WCT v2 artifact does not contain exact 44/220/8 inventory");
}

const literal = (value) => `'${String(value).replaceAll("'", "''")}'`;
const nullable = (value) => value === null ? "null" : literal(value);
const idByLesson = new Map(
  artifact.targetV1SetSnapshot.map((set) => [set.lessonKey, set.id])
);
const lines = [
  "create schema wct_v2_test;",
  `create table wct_v2_test.expected_books (
    id uuid primary key,
    owner_id uuid not null,
    level text not null,
    day_count integer not null
  );`,
  ...artifact.targetBooks.map((book) => `insert into wct_v2_test.expected_books
    (id, owner_id, level, day_count) values
    (${literal(book.id)}::uuid, ${literal(book.ownerId)}::uuid,
     ${literal(book.level)}, ${Number(book.dayCount)});`),
  `create table wct_v2_test.expected_sets (
    id uuid primary key,
    owner_id uuid not null,
    book_id uuid not null,
    lesson_key text not null,
    source_id text not null,
    source_hash text not null,
    questions jsonb not null
  );`,
  ...artifact.sets.map((set) => `insert into wct_v2_test.expected_sets
    (id, owner_id, book_id, lesson_key, source_id, source_hash, questions) values
    (${literal(idByLesson.get(set.lessonKey))}::uuid,
     ${literal(artifact.targetBooks.find((book) => book.id === set.bookId).ownerId)}::uuid,
     ${literal(set.bookId)}::uuid, ${literal(set.lessonKey)},
     ${literal(set.sourceId)}, ${literal(set.sourceHash)},
     ${literal(JSON.stringify(set.questions))}::jsonb);`),
  `create table wct_v2_test.expected_corrections (
    book_id uuid not null,
    day_id uuid not null,
    pattern_id uuid not null,
    example_id uuid primary key,
    old_english_text text not null,
    new_english_text text not null,
    old_meaning_ko text,
    new_meaning_ko text
  );`,
  ...artifact.sourceCorrectionManifest.map((row) => `insert into wct_v2_test.expected_corrections
    (book_id, day_id, pattern_id, example_id, old_english_text,
     new_english_text, old_meaning_ko, new_meaning_ko) values
    (${literal(row.bookId)}::uuid, ${literal(row.dayId)}::uuid,
     ${literal(row.patternId)}::uuid, ${literal(row.exampleId)}::uuid,
     ${literal(row.oldEnglishText)}, ${literal(row.newEnglishText)},
     ${nullable(row.oldMeaningKo)}, ${nullable(row.newMeaningKo)});`),
  `create table wct_v2_test.expected_premium (
    id uuid primary key,
    owner_id uuid not null,
    lesson_key text not null,
    source_kind text not null,
    source_id text not null,
    generator_version text not null,
    source_hash text not null,
    questions jsonb not null
  );`,
  ...artifact.premiumSetSnapshot.map((set) => `insert into wct_v2_test.expected_premium
    (id, owner_id, lesson_key, source_kind, source_id, generator_version,
     source_hash, questions) values
    (${literal(set.id)}::uuid, ${literal(set.ownerId)}::uuid,
     ${literal(set.lessonKey)}, ${literal(set.sourceKind)}, ${literal(set.sourceId)},
     ${literal(set.generatorVersion)}, ${literal(set.sourceHash)},
     ${literal(JSON.stringify(set.questions))}::jsonb);`)
];
writeFileSync(outputPath, `${lines.join("\n\n")}\n`, "utf8");
NODE

cat > "$BASE_SQL" <<'SQL'
\set ON_ERROR_STOP on
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);
create or replace function auth.uid()
returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

insert into auth.users (id)
values ('261f2e21-9532-446f-8694-0b2bc54df360')
on conflict do nothing;
SQL

checkpoint_a_found=false
while IFS= read -r migration; do
  migration_name="$(basename "$migration")"
  if [[ "$migration_name" > "$MIGRATION_CUTOFF" ]]; then
    continue
  fi
  cat "$migration" >> "$BASE_SQL"
  if [[ "$migration_name" == "$MIGRATION_CUTOFF" ]]; then
    checkpoint_a_found=true
  fi
done < <(printf '%s\n' supabase/migrations/*.sql | LC_ALL=C sort)
if [[ "$checkpoint_a_found" != true ]]; then
  echo "Checkpoint A was not included in the disposable replay." >&2
  exit 1
fi

cat > "$HELPERS_SQL" <<'SQL'
\set ON_ERROR_STOP on
with sentinel_parent as (
  select day.id as day_id
  from public.wct_days day
  join wct_v2_test.expected_books expected on expected.id = day.book_id
  where expected.level = 'prenovice'
  order by day.day_number, day.id
  limit 1
)
insert into public.wct_day_concepts (
  id, day_id, text, source_kind, sort_order
)
select
  '9f100000-0000-4000-8000-000000000001'::uuid,
  day_id,
  'fixture-sentinel-concept',
  'book',
  999999
from sentinel_parent;

with sentinel_parent as (
  select day.id as day_id, pattern.id as pattern_id
  from public.wct_days day
  join wct_v2_test.expected_books expected on expected.id = day.book_id
  join public.wct_patterns pattern on pattern.day_id = day.id
  where expected.level = 'prenovice'
  order by day.day_number, pattern.sort_order, pattern.id
  limit 1
)
insert into public.wct_important_notes (
  id, day_id, pattern_id, note_text, source_page, sort_order
)
select
  '9f100000-0000-4000-8000-000000000002'::uuid,
  day_id,
  pattern_id,
  'fixture-sentinel-note',
  null,
  999999
from sentinel_parent;

with sentinel_parent as (
  select day.id as day_id, pattern.id as pattern_id
  from public.wct_days day
  join wct_v2_test.expected_books expected on expected.id = day.book_id
  join public.wct_patterns pattern on pattern.day_id = day.id
  where expected.level = 'prenovice'
  order by day.day_number, pattern.sort_order, pattern.id
  limit 1
)
insert into public.wct_practice_prompts (
  id, day_id, pattern_id, prompt_text, meaning_ko, source_page, sort_order
)
select
  '9f100000-0000-4000-8000-000000000003'::uuid,
  day_id,
  pattern_id,
  'fixture-sentinel-practice',
  '검증용 연습 문장',
  null,
  999999
from sentinel_parent;

-- fixture-all-standard-progress
insert into public.wct_quiz_progress (
  quiz_set_id, user_id, latest_score, completed_at, updated_at
)
select
  expected.id,
  expected.owner_id,
  2,
  '2026-08-05T00:00:00Z'::timestamptz,
  '2026-08-05T00:00:00Z'::timestamptz
from wct_v2_test.expected_sets expected
on conflict (quiz_set_id, user_id) do update
set latest_score = excluded.latest_score,
    completed_at = excluded.completed_at,
    updated_at = excluded.updated_at;

create table wct_v2_test.snapshots (
  label text primary key,
  source_graph jsonb not null,
  source_graph_masked jsonb not null,
  standard_sets jsonb not null,
  premium_sets jsonb not null,
  target_quiz_progress jsonb not null,
  premium_progress jsonb not null,
  target_pop_progress jsonb not null
);

create or replace function wct_v2_test.capture_snapshot(p_label text)
returns void
language plpgsql
as $$
declare
  v_source_graph jsonb;
  v_source_graph_masked jsonb;
begin
  select jsonb_build_object(
    'books', coalesce((
      select jsonb_agg(to_jsonb(book) order by book.id)
      from public.wct_books book
      join wct_v2_test.expected_books expected on expected.id = book.id
    ), '[]'::jsonb),
    'days', coalesce((
      select jsonb_agg(to_jsonb(day) order by day.id)
      from public.wct_days day
      join wct_v2_test.expected_books expected on expected.id = day.book_id
    ), '[]'::jsonb),
    'concepts', coalesce((
      select jsonb_agg(to_jsonb(concept) order by concept.id)
      from public.wct_day_concepts concept
      join public.wct_days day on day.id = concept.day_id
      join wct_v2_test.expected_books expected on expected.id = day.book_id
    ), '[]'::jsonb),
    'patterns', coalesce((
      select jsonb_agg(to_jsonb(pattern) order by pattern.id)
      from public.wct_patterns pattern
      join public.wct_days day on day.id = pattern.day_id
      join wct_v2_test.expected_books expected on expected.id = day.book_id
    ), '[]'::jsonb),
    'examples', coalesce((
      select jsonb_agg(to_jsonb(example) order by example.id)
      from public.wct_examples example
      join public.wct_patterns pattern on pattern.id = example.pattern_id
      join public.wct_days day on day.id = pattern.day_id
      join wct_v2_test.expected_books expected on expected.id = day.book_id
    ), '[]'::jsonb),
    'importantNotes', coalesce((
      select jsonb_agg(to_jsonb(note) order by note.id)
      from public.wct_important_notes note
      join public.wct_days day on day.id = note.day_id
      join wct_v2_test.expected_books expected on expected.id = day.book_id
    ), '[]'::jsonb),
    'practicePrompts', coalesce((
      select jsonb_agg(to_jsonb(prompt) order by prompt.id)
      from public.wct_practice_prompts prompt
      join public.wct_days day on day.id = prompt.day_id
      join wct_v2_test.expected_books expected on expected.id = day.book_id
    ), '[]'::jsonb)
  ) into v_source_graph;

  select jsonb_set(
    v_source_graph,
    '{examples}',
    coalesce((
      select jsonb_agg(
        case when correction.example_id is null then to_jsonb(example)
          else (to_jsonb(example) - 'english_text' - 'meaning_ko')
            || jsonb_build_object(
              'english_text', '__approved_source_correction__',
              'meaning_ko', '__approved_source_correction__'
            )
        end
        order by example.id
      )
      from public.wct_examples example
      join public.wct_patterns pattern on pattern.id = example.pattern_id
      join public.wct_days day on day.id = pattern.day_id
      join wct_v2_test.expected_books expected on expected.id = day.book_id
      left join wct_v2_test.expected_corrections correction
        on correction.example_id = example.id
    ), '[]'::jsonb)
  ) into v_source_graph_masked;

  insert into wct_v2_test.snapshots (
    label, source_graph, source_graph_masked, standard_sets, premium_sets,
    target_quiz_progress, premium_progress, target_pop_progress
  ) values (
    p_label,
    v_source_graph,
    v_source_graph_masked,
    coalesce((
      select jsonb_agg(to_jsonb(quiz) order by quiz.id)
      from public.wct_quiz_sets quiz
      join wct_v2_test.expected_sets expected on expected.id = quiz.id
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(to_jsonb(quiz) order by quiz.id)
      from public.wct_quiz_sets quiz
      join wct_v2_test.expected_premium expected on expected.id = quiz.id
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(to_jsonb(progress) order by progress.quiz_set_id, progress.user_id)
      from public.wct_quiz_progress progress
      join wct_v2_test.expected_sets expected on expected.id = progress.quiz_set_id
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(to_jsonb(progress) order by progress.quiz_set_id, progress.user_id)
      from public.wct_quiz_progress progress
      join wct_v2_test.expected_premium expected on expected.id = progress.quiz_set_id
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(to_jsonb(progress) order by progress.owner_id, progress.book_id)
      from public.wct_pop_quiz_progress progress
      join wct_v2_test.expected_books expected on expected.id = progress.book_id
       and expected.owner_id = progress.owner_id
    ), '[]'::jsonb)
  );
end;
$$;
SQL

cat > "$VALIDATE_FIXTURE_SQL" <<'SQL'
\set ON_ERROR_STOP on
do $$
declare
  v_count integer;
  v_question_count integer;
begin
  if current_setting('server_encoding') is distinct from 'UTF8' then
    raise exception 'Disposable WCT v2 database is not UTF8';
  end if;

  select count(*), coalesce(sum(jsonb_array_length(questions)), 0)
  into v_count, v_question_count
  from wct_v2_test.expected_sets;
  if v_count <> 44 or v_question_count <> 220 then
    raise exception 'Expected WCT v2 artifact is not exact 44/220 inventory';
  end if;

  select count(*) into v_count
  from wct_v2_test.expected_corrections correction
  join public.wct_examples example on example.id = correction.example_id
  join public.wct_patterns pattern on pattern.id = correction.pattern_id
    and pattern.id = example.pattern_id
  join public.wct_days day on day.id = correction.day_id
    and day.id = pattern.day_id
  join public.wct_books book on book.id = correction.book_id
    and book.id = day.book_id
  where example.english_text is not distinct from correction.old_english_text
    and example.meaning_ko is not distinct from correction.old_meaning_ko;
  if v_count <> 8 then
    raise exception 'Fixture does not contain eight exact source preimages and parents';
  end if;

  if not exists (
    select 1
    from public.wct_day_concepts concept
    join public.wct_days day on day.id = concept.day_id
    join wct_v2_test.expected_books expected on expected.id = day.book_id
    where concept.id = '9f100000-0000-4000-8000-000000000001'::uuid
      and concept.text = 'fixture-sentinel-concept'
      and concept.source_kind = 'book'
      and concept.sort_order = 999999
  ) or not exists (
    select 1
    from public.wct_important_notes note
    join public.wct_days day on day.id = note.day_id
    join public.wct_patterns pattern on pattern.id = note.pattern_id
      and pattern.day_id = day.id
    join wct_v2_test.expected_books expected on expected.id = day.book_id
    where note.id = '9f100000-0000-4000-8000-000000000002'::uuid
      and note.note_text = 'fixture-sentinel-note'
      and note.sort_order = 999999
  ) or not exists (
    select 1
    from public.wct_practice_prompts prompt
    join public.wct_days day on day.id = prompt.day_id
    join public.wct_patterns pattern on pattern.id = prompt.pattern_id
      and pattern.day_id = day.id
    join wct_v2_test.expected_books expected on expected.id = day.book_id
    where prompt.id = '9f100000-0000-4000-8000-000000000003'::uuid
      and prompt.prompt_text = 'fixture-sentinel-practice'
      and prompt.meaning_ko = '검증용 연습 문장'
      and prompt.sort_order = 999999
  ) then
    raise exception 'Fixture must seed exact concept/note/practice source sentinels';
  end if;

  if exists (
    select 1
    from wct_v2_test.expected_sets expected
    full join (
      select * from public.wct_quiz_sets where source_kind = 'wct_day'
    ) quiz on quiz.id = expected.id
    where expected.id is null or quiz.id is null
      or quiz.owner_id is distinct from expected.owner_id
      or quiz.lesson_key is distinct from expected.lesson_key
      or quiz.source_id is distinct from expected.source_id
      or quiz.generator_version is distinct from 'wct-review-v1'
  ) then
    raise exception 'Fixture does not match approved 44-set v1 UUID inventory';
  end if;

  if exists (
    select 1
    from wct_v2_test.expected_premium expected
    full join (
      select * from public.wct_quiz_sets where source_kind = 'wct_premium'
    ) quiz on quiz.id = expected.id
    where expected.id is null or quiz.id is null
      or quiz.owner_id is distinct from expected.owner_id
      or quiz.lesson_key is distinct from expected.lesson_key
      or quiz.source_id is distinct from expected.source_id
      or quiz.generator_version is distinct from expected.generator_version
      or quiz.source_hash is distinct from expected.source_hash
      or quiz.questions is distinct from expected.questions
  ) then
    raise exception 'Fixture Premium snapshot does not match approved artifact';
  end if;

  if (select count(*) from public.wct_quiz_progress progress
      join wct_v2_test.expected_sets expected on expected.id = progress.quiz_set_id
       and expected.owner_id = progress.user_id) <> 44
    or (select count(*) from public.wct_pop_quiz_progress progress
      join wct_v2_test.expected_books expected on expected.id = progress.book_id
       and expected.owner_id = progress.owner_id) = 0
    or (select count(*) from public.wct_quiz_progress progress
      join wct_v2_test.expected_premium expected on expected.id = progress.quiz_set_id) = 0 then
    raise exception 'Fixture must seed exact 44 target Day rows plus Pop and Premium progress';
  end if;
end;
$$;
SQL

cat > "$CAPTURE_BEFORE_SQL" <<'SQL'
\set ON_ERROR_STOP on
select wct_v2_test.capture_snapshot('before');
SQL

cat > "$SUCCESS_ASSERT_SQL" <<'SQL'
\set ON_ERROR_STOP on
select wct_v2_test.capture_snapshot('after');
do $$
declare
  v_before wct_v2_test.snapshots%rowtype;
  v_after wct_v2_test.snapshots%rowtype;
  v_count integer;
  v_question_count integer;
begin
  select * into strict v_before from wct_v2_test.snapshots where label = 'before';
  select * into strict v_after from wct_v2_test.snapshots where label = 'after';

  select count(*) into v_count
  from wct_v2_test.expected_corrections correction
  join public.wct_examples example on example.id = correction.example_id
  join public.wct_patterns pattern on pattern.id = correction.pattern_id
    and pattern.id = example.pattern_id
  join public.wct_days day on day.id = correction.day_id
    and day.id = pattern.day_id
  join public.wct_books book on book.id = correction.book_id
    and book.id = day.book_id
  where example.english_text is not distinct from correction.new_english_text
    and example.meaning_ko is not distinct from correction.new_meaning_ko;
  if v_count <> 8 then
    raise exception 'Checkpoint B did not save all eight exact UTF8 source postimages';
  end if;

  select count(*), coalesce(sum(jsonb_array_length(quiz.questions)), 0)
  into v_count, v_question_count
  from public.wct_quiz_sets quiz
  join public.wct_days day on day.id::text = quiz.source_id
  join wct_v2_test.expected_books expected on expected.id = day.book_id
  where quiz.owner_id = expected.owner_id
    and quiz.source_kind = 'wct_day'
    and quiz.generator_version = 'wct-review-v2';
  if v_count <> 44 or v_question_count <> 220 then
    raise exception 'Checkpoint B did not produce exact 44/220 v2 inventory';
  end if;

  if exists (
    select 1
    from wct_v2_test.expected_sets expected
    full join (
      select * from public.wct_quiz_sets where source_kind = 'wct_day'
    ) quiz on quiz.id = expected.id
    where expected.id is null or quiz.id is null
      or quiz.owner_id is distinct from expected.owner_id
      or quiz.lesson_key is distinct from expected.lesson_key
      or quiz.source_id is distinct from expected.source_id
      or quiz.generator_version is distinct from 'wct-review-v2'
      or quiz.source_hash is distinct from expected.source_hash
      or quiz.questions is distinct from expected.questions
  ) then
    raise exception 'Checkpoint B set UUIDs or semantic JSON differ from approved artifact';
  end if;

  if exists (
    select 1
    from public.wct_quiz_sets quiz
    join wct_v2_test.expected_sets expected on expected.id = quiz.id
    cross join lateral (
      select
        count(*) filter (where question->>'format' = 'multiple_choice') as multiple_choice_count,
        count(*) filter (where question->>'format' = 'fill_blank') as fill_blank_count,
        count(*) filter (where question->>'format' = 'true_false') as true_false_count,
        count(*) filter (where question->>'kind' = 'translation') as translation_count,
        count(*) filter (where question->>'kind' = 'pattern') as pattern_count
      from jsonb_array_elements(quiz.questions) question
    ) mix
    where mix.multiple_choice_count <> 2
      or mix.fill_blank_count <> 2
      or mix.true_false_count <> 1
      or mix.translation_count <> 3
      or mix.pattern_count <> 2
  ) then
    raise exception 'Checkpoint B v2 format/kind mix is invalid';
  end if;

  if exists (
    select 1 from public.wct_quiz_progress progress
    join wct_v2_test.expected_sets expected on expected.id = progress.quiz_set_id
  ) or exists (
    select 1 from public.wct_pop_quiz_progress progress
    join wct_v2_test.expected_books expected on expected.id = progress.book_id
      and expected.owner_id = progress.owner_id
  ) then
    raise exception 'Checkpoint B retained targeted Day or Pop progress';
  end if;

  if v_before.source_graph_masked is distinct from v_after.source_graph_masked then
    raise exception 'Checkpoint B changed non-allowlisted WCT source';
  end if;
  if v_before.premium_sets is distinct from v_after.premium_sets
    or v_before.premium_progress is distinct from v_after.premium_progress then
    raise exception 'Checkpoint B changed Premium set or progress rows';
  end if;
end;
$$;
select 'WCT v2 checkpoint-B success effects verified' as result;
SQL

cat > "$ROLLBACK_ASSERT_SQL" <<'SQL'
\set ON_ERROR_STOP on
select wct_v2_test.capture_snapshot('after');
do $$
declare
  v_before wct_v2_test.snapshots%rowtype;
  v_after wct_v2_test.snapshots%rowtype;
begin
  select * into strict v_before from wct_v2_test.snapshots where label = 'before';
  select * into strict v_after from wct_v2_test.snapshots where label = 'after';
  if v_before.source_graph is distinct from v_after.source_graph
    or v_before.standard_sets is distinct from v_after.standard_sets
    or v_before.premium_sets is distinct from v_after.premium_sets
    or v_before.target_quiz_progress is distinct from v_after.target_quiz_progress
    or v_before.premium_progress is distinct from v_after.premium_progress
    or v_before.target_pop_progress is distinct from v_after.target_pop_progress then
    raise exception 'Failed checkpoint B did not roll every source/set/progress/Premium row back';
  end if;
end;
$$;
select 'WCT v2 checkpoint-B rollback verified' as result;
SQL

run_bounded docker run -d --name "$CONTAINER" \
  -e POSTGRES_PASSWORD=postgres "$IMAGE" >/dev/null

ready=false
for _attempt in $(seq 1 60); do
  if timeout 5s docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done
if [[ "$ready" != true ]]; then
  docker logs "$CONTAINER" >&2 || true
  echo "Timed out waiting for disposable PostgreSQL." >&2
  exit 1
fi

psql_file() {
  local database="$1"
  local sql_file="$2"
  timeout "${COMMAND_TIMEOUT_SECONDS}s" docker exec -i "$CONTAINER" \
    psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < "$sql_file"
}

psql_command() {
  local database="$1"
  local sql="$2"
  timeout "${COMMAND_TIMEOUT_SECONDS}s" docker exec "$CONTAINER" \
    psql -v ON_ERROR_STOP=1 -U postgres -d "$database" -c "$sql"
}

for database in wct_v2_success wct_v2_preimage_failure wct_v2_postcondition_failure; do
  run_bounded docker exec "$CONTAINER" createdb -U postgres "$database"
  psql_file "$database" "$BASE_SQL" >/dev/null
  psql_file "$database" "$FIXTURE_SQL" >/dev/null
  psql_file "$database" "$EXPECTED_SQL" >/dev/null
  psql_file "$database" "$HELPERS_SQL" >/dev/null
  psql_file "$database" "$VALIDATE_FIXTURE_SQL" >/dev/null
done

run_bounded docker exec "$CONTAINER" createdb -U postgres wct_v2_zero_target
psql_file wct_v2_zero_target "$BASE_SQL" >/dev/null

zero_target_snapshot() {
  timeout "${COMMAND_TIMEOUT_SECONDS}s" docker exec "$CONTAINER" \
    psql -Atq -v ON_ERROR_STOP=1 -U postgres -d wct_v2_zero_target -c "
select jsonb_build_object(
  'books', (select coalesce(jsonb_agg(to_jsonb(row_value) order by row_value.id), '[]'::jsonb) from public.wct_books row_value),
  'days', (select coalesce(jsonb_agg(to_jsonb(row_value) order by row_value.id), '[]'::jsonb) from public.wct_days row_value),
  'concepts', (select coalesce(jsonb_agg(to_jsonb(row_value) order by row_value.id), '[]'::jsonb) from public.wct_day_concepts row_value),
  'patterns', (select coalesce(jsonb_agg(to_jsonb(row_value) order by row_value.id), '[]'::jsonb) from public.wct_patterns row_value),
  'examples', (select coalesce(jsonb_agg(to_jsonb(row_value) order by row_value.id), '[]'::jsonb) from public.wct_examples row_value),
  'notes', (select coalesce(jsonb_agg(to_jsonb(row_value) order by row_value.id), '[]'::jsonb) from public.wct_important_notes row_value),
  'prompts', (select coalesce(jsonb_agg(to_jsonb(row_value) order by row_value.id), '[]'::jsonb) from public.wct_practice_prompts row_value),
  'sets', (select coalesce(jsonb_agg(to_jsonb(row_value) order by row_value.id), '[]'::jsonb) from public.wct_quiz_sets row_value),
  'quizProgress', (select coalesce(jsonb_agg(to_jsonb(row_value) order by row_value.quiz_set_id, row_value.user_id), '[]'::jsonb) from public.wct_quiz_progress row_value),
  'popProgress', (select coalesce(jsonb_agg(to_jsonb(row_value) order by row_value.owner_id, row_value.book_id), '[]'::jsonb) from public.wct_pop_quiz_progress row_value)
)::text;
"
}

zero_target_before="$(zero_target_snapshot)"
if psql_file wct_v2_zero_target "$CHECKPOINT_B" >"$ZERO_TARGET_FAILURE_OUT" 2>&1; then
  echo "Checkpoint B unexpectedly accepted a zero-target normal session." >&2
  exit 1
fi
if ! grep -q "WCT v2 exact target book inventory mismatch" "$ZERO_TARGET_FAILURE_OUT"; then
  cat "$ZERO_TARGET_FAILURE_OUT" >&2
  echo "Zero-target normal session did not reach the fail-closed inventory guard." >&2
  exit 1
fi
zero_target_after="$(zero_target_snapshot)"
if [[ "$zero_target_before" != "$zero_target_after" ]]; then
  echo "Zero-target checkpoint-B failure changed source/set/progress/Premium state." >&2
  exit 1
fi

psql_file wct_v2_success "$CAPTURE_BEFORE_SQL" >/dev/null
psql_file wct_v2_success "$CHECKPOINT_B" >/dev/null
psql_file wct_v2_success "$SUCCESS_ASSERT_SQL"

psql_command wct_v2_preimage_failure \
  "update public.wct_examples set english_text = 'corrupted required preimage' where id = '80c15412-b4a4-4518-8e4e-097166547134'::uuid" \
  >/dev/null
psql_file wct_v2_preimage_failure "$CAPTURE_BEFORE_SQL" >/dev/null
if psql_file wct_v2_preimage_failure "$CHECKPOINT_B" >"$PREIMAGE_FAILURE_OUT" 2>&1; then
  echo "Checkpoint B unexpectedly accepted a corrupted required source preimage." >&2
  exit 1
fi
if ! grep -Eq "WCT v2 current source inventory does not match approved source|WCT v2 source correction exact old source preimage" "$PREIMAGE_FAILURE_OUT"; then
  cat "$PREIMAGE_FAILURE_OUT" >&2
  echo "Corrupted-preimage failure did not reach the expected checkpoint-B guard." >&2
  exit 1
fi
assert_snapshot_unchanged() {
  local database="$1"
  psql_file "$database" "$ROLLBACK_ASSERT_SQL"
}
assert_snapshot_unchanged wct_v2_preimage_failure

psql_file wct_v2_postcondition_failure "$CAPTURE_BEFORE_SQL" >/dev/null
psql_command wct_v2_postcondition_failure "
create function wct_v2_test.force_bad_postcondition() returns trigger
language plpgsql as \$\$
begin
  if new.source_kind = 'wct_day'
    and new.generator_version = 'wct-review-v2'
    and new.id = '0f2d0598-050e-4151-b505-2db48ebf9ab2'::uuid then
    new.source_hash := repeat('f', 64);
  end if;
  return new;
end;
\$\$;
create trigger force_bad_postcondition
before update on public.wct_quiz_sets
for each row execute function wct_v2_test.force_bad_postcondition();
" >/dev/null
if psql_file wct_v2_postcondition_failure "$CHECKPOINT_B" >"$POSTCONDITION_FAILURE_OUT" 2>&1; then
  echo "Checkpoint B unexpectedly committed after a forced post-update mismatch." >&2
  exit 1
fi
if ! grep -q "WCT v2 converted target graph does not match approved payload" "$POSTCONDITION_FAILURE_OUT"; then
  cat "$POSTCONDITION_FAILURE_OUT" >&2
  echo "Forced post-update mismatch did not reach the expected checkpoint-B assertion." >&2
  exit 1
fi
assert_snapshot_unchanged wct_v2_postcondition_failure

echo "WCT v2 checkpoint-B executable success and rollback verification passed."
