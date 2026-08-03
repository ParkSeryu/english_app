#!/usr/bin/env bash
set -euo pipefail

IMAGE="${POSTGRES_IMAGE:-postgres:16-alpine}"
CONTAINER="english-review-rls-$RANDOM"
SQL_FILE="$(mktemp)"
cleanup() {
  rm -f "$SQL_FILE"
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cat > "$SQL_FILE" <<'SQL'
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

-- Existing migrations require this configured private-folder owner to exist.
insert into auth.users (id)
values ('261f2e21-9532-446f-8694-0b2bc54df360')
on conflict do nothing;
SQL

for migration in supabase/migrations/*.sql; do
  cat "$migration" >> "$SQL_FILE"
done

cat >> "$SQL_FILE" <<'SQL'

grant usage on schema public, auth to anon, authenticated, service_role;

insert into auth.users (id) values
  ('00000000-0000-4000-8000-0000000000aa'),
  ('00000000-0000-4000-8000-0000000000bb')
on conflict do nothing;

-- Preserve the actively used ingestion_runs owner boundary.
insert into public.ingestion_runs (id, owner_id, raw_input, normalized_payload, status)
values
  ('40000000-0000-4000-8000-0000000000aa', '00000000-0000-4000-8000-0000000000aa', 'A raw', '{}'::jsonb, 'drafted'),
  ('40000000-0000-4000-8000-0000000000bb', '00000000-0000-4000-8000-0000000000bb', 'B raw', '{}'::jsonb, 'drafted')
on conflict do nothing;

-- Legacy lesson tables are intentionally gone, while ingestion_runs remains.
do $$
begin
  if to_regclass('public.lessons') is not null then raise exception 'legacy lessons table still exists'; end if;
  if to_regclass('public.study_items') is not null then raise exception 'legacy study_items table still exists'; end if;
  if to_regclass('public.study_examples') is not null then raise exception 'legacy study_examples table still exists'; end if;
  if to_regclass('public.ingestion_runs') is null then raise exception 'ingestion_runs was removed'; end if;
end $$;

-- Only service_role may import approved WCT batches.
set role service_role;
select public.import_wct_batch(
  '00000000-0000-4000-8000-0000000000aa',
  'owner-a-create',
  'hash-owner-a-create',
  '{
    "book":{"title":"WCT Pattern book Prenovice","levelLabel":"Pre Novice","sortOrder":0},
    "days":[{
      "dayNumber":1,
      "shortLabel":"수동태",
      "sourcePageStart":7,
      "sourcePageEnd":14,
      "duplicateAction":"create",
      "concepts":[{"text":"행위보다 대상을 강조한다.","sourceKind":"book"}],
      "patterns":[{
        "patternText":"be + p.p.",
        "meaningKo":"수동태",
        "usageSource":"book",
        "examples":[{"englishText":"It is made of wood.","meaningKo":"그것은 나무로 만들어진다."}]
      }],
      "importantNotes":[{"patternIndex":0,"noteText":"by는 행위자를 나타낸다."}],
      "practicePrompts":[{"patternIndex":0,"promptText":"이것은 한국에서 만들어진다."}]
    }]
  }'::jsonb
);
select public.import_wct_batch(
  '00000000-0000-4000-8000-0000000000bb',
  'owner-b-create',
  'hash-owner-b-create',
  '{
    "book":{"title":"WCT Pattern book Prenovice","levelLabel":"Pre Novice","sortOrder":0},
    "days":[{
      "dayNumber":1,
      "shortLabel":"수동태",
      "duplicateAction":"create",
      "concepts":[],
      "patterns":[],
      "importantNotes":[],
      "practicePrompts":[]
    }]
  }'::jsonb
);
reset role;

-- Anonymous users have no WCT read permission.
set role anon;
set request.jwt.claim.sub = '';
do $$
begin
  begin
    perform count(*) from public.wct_books;
    raise exception 'anon WCT select unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end $$;
reset role;

-- Owner A sees only its graph and cannot write or execute import.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000aa';
do $$
declare row_count integer;
begin
  select count(*) into row_count from public.wct_books;
  if row_count <> 1 then raise exception 'owner A books expected 1, got %', row_count; end if;
  select count(*) into row_count from public.wct_days;
  if row_count <> 1 then raise exception 'owner A days expected 1, got %', row_count; end if;
  select count(*) into row_count from public.wct_patterns;
  if row_count <> 1 then raise exception 'owner A patterns expected 1, got %', row_count; end if;
  select count(*) into row_count from public.wct_examples;
  if row_count <> 1 then raise exception 'owner A examples expected 1, got %', row_count; end if;
  select count(*) into row_count from public.ingestion_runs;
  if row_count <> 1 then raise exception 'owner A ingestion runs expected 1, got %', row_count; end if;

  begin
    insert into public.wct_books (owner_id, title)
    values ('00000000-0000-4000-8000-0000000000aa', 'browser write');
    raise exception 'authenticated WCT insert unexpectedly succeeded';
  exception when insufficient_privilege or check_violation or with_check_option_violation then
    null;
  end;

  begin
    perform public.import_wct_batch(
      '00000000-0000-4000-8000-0000000000aa',
      'browser-import',
      'browser-hash',
      '{"book":{"title":"bad"},"days":[]}'::jsonb
    );
    raise exception 'authenticated WCT RPC unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end $$;
reset role;

-- Idempotent replay, payload mismatch, replace, merge, and skip are executable behavior.
set role service_role;
do $$
declare
  result jsonb;
  row_count integer;
begin
  result := public.import_wct_batch(
    '00000000-0000-4000-8000-0000000000aa',
    'owner-a-create',
    'hash-owner-a-create',
    '{}'::jsonb
  );
  if result->>'replayed' <> 'true' then raise exception 'exact replay was not marked replayed'; end if;
  select count(*) into row_count from public.wct_import_receipts
  where owner_id = '00000000-0000-4000-8000-0000000000aa';
  if row_count <> 1 then raise exception 'replay created another receipt'; end if;

  begin
    perform public.import_wct_batch(
      '00000000-0000-4000-8000-0000000000aa',
      'owner-a-create',
      'different-hash',
      '{}'::jsonb
    );
    raise exception 'idempotency hash mismatch unexpectedly succeeded';
  exception when others then
    if sqlerrm not like '%different payload%' then raise; end if;
  end;

  perform public.import_wct_batch(
    '00000000-0000-4000-8000-0000000000aa',
    'owner-a-replace',
    'hash-owner-a-replace',
    '{
      "book":{"title":"WCT Pattern book Prenovice","levelLabel":"Pre Novice"},
      "days":[{
        "dayNumber":1,"shortLabel":"수동태","duplicateAction":"replace",
        "concepts":[],
        "patterns":[{"patternText":"get + p.p.","usageSource":"book","examples":[{"englishText":"It gets broken."}]}],
        "importantNotes":[],"practicePrompts":[]
      }]
    }'::jsonb
  );
  select count(*) into row_count from public.wct_patterns where pattern_text = 'get + p.p.';
  if row_count <> 1 then raise exception 'replace did not replace patterns'; end if;

  perform public.import_wct_batch(
    '00000000-0000-4000-8000-0000000000aa',
    'owner-a-merge',
    'hash-owner-a-merge',
    '{
      "book":{"title":"WCT Pattern book Prenovice","levelLabel":"Pre Novice"},
      "days":[{
        "dayNumber":1,"shortLabel":"수동태","duplicateAction":"merge",
        "concepts":[],
        "patterns":[{"patternText":" GET + P.P. ","usageSource":"book","examples":[{"englishText":"It gets damaged."}]}],
        "importantNotes":[],"practicePrompts":[]
      }]
    }'::jsonb
  );
  select count(*) into row_count from public.wct_patterns;
  if row_count <> 1 then raise exception 'normalized merge expected 1 total pattern, got %', row_count; end if;
  select count(*) into row_count from public.wct_examples
  where english_text in ('It gets broken.', 'It gets damaged.');
  if row_count <> 2 then raise exception 'merge did not retain and append examples'; end if;

  perform public.import_wct_batch(
    '00000000-0000-4000-8000-0000000000aa',
    'owner-a-skip',
    'hash-owner-a-skip',
    '{
      "book":{"title":"WCT Pattern book Prenovice","levelLabel":"Pre Novice"},
      "days":[{
        "dayNumber":1,"shortLabel":"무시","duplicateAction":"skip",
        "concepts":[],"patterns":[],"importantNotes":[],"practicePrompts":[]
      }]
    }'::jsonb
  );
  select count(*) into row_count from public.wct_days where short_label = '무시';
  if row_count <> 0 then raise exception 'skip modified the Day'; end if;
end $$;
reset role;

-- Deleting owner A's book as service role cascades its WCT graph and receipts only.
set role service_role;
delete from public.wct_books
where owner_id = '00000000-0000-4000-8000-0000000000aa';
do $$
declare row_count integer;
begin
  select count(*) into row_count from public.wct_days;
  if row_count <> 1 then raise exception 'owner B Day should remain after owner A cascade'; end if;
  select count(*) into row_count from public.wct_import_receipts
  where owner_id = '00000000-0000-4000-8000-0000000000aa';
  if row_count <> 0 then raise exception 'owner A receipts did not cascade'; end if;
end $$;
reset role;

select 'RLS verification passed' as result;
SQL

cat scripts/verify-wct-quiz-rls.sql >> "$SQL_FILE"
cat scripts/verify-rls.sql >> "$SQL_FILE"

docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=postgres "$IMAGE" >/dev/null
until docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; do
  sleep 1
done

docker exec -i "$CONTAINER" psql -U postgres -d postgres < "$SQL_FILE"
