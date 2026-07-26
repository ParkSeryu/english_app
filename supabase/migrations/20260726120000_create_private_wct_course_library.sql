create table if not exists public.wct_books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  normalized_title text generated always as (
    regexp_replace(lower(btrim(title)), '\s+', ' ', 'g')
  ) stored,
  level_label text check (level_label is null or length(btrim(level_label)) <= 80),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, normalized_title)
);

create table if not exists public.wct_days (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.wct_books(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 999),
  short_label text not null check (length(btrim(short_label)) between 1 and 18),
  learning_summary text,
  source_page_start integer check (source_page_start is null or source_page_start > 0),
  source_page_end integer check (source_page_end is null or source_page_end > 0),
  source_needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (book_id, day_number),
  check (source_page_start is null or source_page_end is null or source_page_end >= source_page_start)
);

create table if not exists public.wct_day_concepts (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.wct_days(id) on delete cascade,
  text text not null check (length(btrim(text)) > 0),
  source_kind text not null check (source_kind in ('book', 'ai_supplement')),
  sort_order integer not null default 0
);

create table if not exists public.wct_patterns (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.wct_days(id) on delete cascade,
  pattern_text text not null check (length(btrim(pattern_text)) > 0),
  meaning_ko text,
  usage_note text,
  usage_source text not null check (usage_source in ('book', 'ai_supplement')),
  source_page integer check (source_page is null or source_page > 0),
  source_needs_review boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists public.wct_examples (
  id uuid primary key default gen_random_uuid(),
  pattern_id uuid not null references public.wct_patterns(id) on delete cascade,
  english_text text not null check (length(btrim(english_text)) > 0),
  meaning_ko text,
  source_page integer check (source_page is null or source_page > 0),
  source_needs_review boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists public.wct_important_notes (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.wct_days(id) on delete cascade,
  pattern_id uuid references public.wct_patterns(id) on delete set null,
  note_text text not null check (length(btrim(note_text)) > 0),
  source_page integer check (source_page is null or source_page > 0),
  sort_order integer not null default 0
);

create table if not exists public.wct_practice_prompts (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.wct_days(id) on delete cascade,
  pattern_id uuid references public.wct_patterns(id) on delete set null,
  prompt_text text not null check (length(btrim(prompt_text)) > 0),
  meaning_ko text,
  source_page integer check (source_page is null or source_page > 0),
  sort_order integer not null default 0
);

create table if not exists public.wct_import_receipts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.wct_books(id) on delete cascade,
  idempotency_key text not null check (length(btrim(idempotency_key)) between 1 and 160),
  payload_hash text not null check (length(btrim(payload_hash)) > 0),
  operation_summary jsonb not null,
  created_at timestamptz not null default now(),
  unique (owner_id, idempotency_key)
);

create index if not exists wct_books_owner_sort_idx on public.wct_books(owner_id, sort_order, title);
create index if not exists wct_days_book_number_idx on public.wct_days(book_id, day_number);
create index if not exists wct_day_concepts_day_sort_idx on public.wct_day_concepts(day_id, sort_order);
create index if not exists wct_patterns_day_sort_idx on public.wct_patterns(day_id, sort_order);
create index if not exists wct_examples_pattern_sort_idx on public.wct_examples(pattern_id, sort_order);
create index if not exists wct_important_notes_day_sort_idx on public.wct_important_notes(day_id, sort_order);
create index if not exists wct_practice_prompts_day_sort_idx on public.wct_practice_prompts(day_id, sort_order);
create index if not exists wct_import_receipts_book_idx on public.wct_import_receipts(book_id);

alter table public.wct_books enable row level security;
alter table public.wct_days enable row level security;
alter table public.wct_day_concepts enable row level security;
alter table public.wct_patterns enable row level security;
alter table public.wct_examples enable row level security;
alter table public.wct_important_notes enable row level security;
alter table public.wct_practice_prompts enable row level security;
alter table public.wct_import_receipts enable row level security;

alter table public.wct_books force row level security;
alter table public.wct_days force row level security;
alter table public.wct_day_concepts force row level security;
alter table public.wct_patterns force row level security;
alter table public.wct_examples force row level security;
alter table public.wct_important_notes force row level security;
alter table public.wct_practice_prompts force row level security;
alter table public.wct_import_receipts force row level security;

create policy "wct_books_select_own" on public.wct_books
for select to authenticated using (owner_id = auth.uid());

create policy "wct_days_select_own" on public.wct_days
for select to authenticated using (
  exists (select 1 from public.wct_books b where b.id = book_id and b.owner_id = auth.uid())
);

create policy "wct_day_concepts_select_own" on public.wct_day_concepts
for select to authenticated using (
  exists (
    select 1 from public.wct_days d
    join public.wct_books b on b.id = d.book_id
    where d.id = day_id and b.owner_id = auth.uid()
  )
);

create policy "wct_patterns_select_own" on public.wct_patterns
for select to authenticated using (
  exists (
    select 1 from public.wct_days d
    join public.wct_books b on b.id = d.book_id
    where d.id = day_id and b.owner_id = auth.uid()
  )
);

create policy "wct_examples_select_own" on public.wct_examples
for select to authenticated using (
  exists (
    select 1 from public.wct_patterns p
    join public.wct_days d on d.id = p.day_id
    join public.wct_books b on b.id = d.book_id
    where p.id = pattern_id and b.owner_id = auth.uid()
  )
);

create policy "wct_important_notes_select_own" on public.wct_important_notes
for select to authenticated using (
  exists (
    select 1 from public.wct_days d
    join public.wct_books b on b.id = d.book_id
    where d.id = day_id and b.owner_id = auth.uid()
  )
);

create policy "wct_practice_prompts_select_own" on public.wct_practice_prompts
for select to authenticated using (
  exists (
    select 1 from public.wct_days d
    join public.wct_books b on b.id = d.book_id
    where d.id = day_id and b.owner_id = auth.uid()
  )
);

grant select on public.wct_books, public.wct_days, public.wct_day_concepts,
  public.wct_patterns, public.wct_examples, public.wct_important_notes,
  public.wct_practice_prompts to authenticated;
revoke all on public.wct_books, public.wct_days, public.wct_day_concepts,
  public.wct_patterns, public.wct_examples, public.wct_important_notes,
  public.wct_practice_prompts, public.wct_import_receipts from anon;
revoke insert, update, delete on public.wct_books, public.wct_days, public.wct_day_concepts,
  public.wct_patterns, public.wct_examples, public.wct_important_notes,
  public.wct_practice_prompts from authenticated;
revoke all on public.wct_import_receipts from authenticated;
grant all on public.wct_books, public.wct_days, public.wct_day_concepts,
  public.wct_patterns, public.wct_examples, public.wct_important_notes,
  public.wct_practice_prompts, public.wct_import_receipts to service_role;

notify pgrst, 'reload schema';
