# WCT Course Library Implementation Plan

> **For Codex:** Execute this plan with `superpowers:using-git-worktrees` first, then either
> `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Do not skip the
> explicit OCR review/approval gate in Task 9 or the production confirmation gate in Task 10.

**Goal:** Replace the legacy lesson surface with a private, read-only WCT textbook library that
shows `WCT → textbook → Day → concepts/patterns/examples/important notes/core practice`, while
keeping scanned files and raw OCR out of the database.

**Architecture:** Add a dedicated WCT domain and store rather than extending the expression-card
domain. Authenticated pages read owner-scoped WCT rows through RLS. A bearer-token ingestion API
uses a service-role store and one transactional RPC for approved batch imports, duplicate handling,
and idempotency. The existing `ingestion_runs` table remains intact; only the unused legacy
`lessons`, `study_items`, and `study_examples` tables are removed.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.9, Zod 4, Supabase/PostgreSQL,
Vitest, Testing Library, Playwright, shell-based RLS verification.

---

## Scope and success criteria

### User-visible outcome

- The bottom GNB has a fourth item, `수업`, linked to `/lessons`.
- `/lessons` shows WCT textbook cards only.
- A textbook page shows ordered labels such as `Day 1 (수동태)` and `Day 13 (if 가능)`.
- A Day page shows fully expanded concepts, patterns, examples, important notes, and selected
  practice.
- AI-added grammar clarification is visibly marked `AI 보완`.
- There are no add/edit/delete controls in the learner UI.
- Topic sections from the scanned book are neither imported nor displayed.

### Data and safety outcome

- Every WCT row is private to exactly one owner.
- Browser clients receive `SELECT` access only; no browser write policy or grant exists.
- The import API derives the owner from `INGESTION_OWNER_ID`, never from request JSON.
- Imports require an explicit Korean/English save approval phrase.
- The same idempotency key plus the same payload returns the stored receipt.
- The same idempotency key plus a different payload fails.
- A duplicate Day must choose `replace`, `merge`, or `skip`; no implicit duplicate policy exists.
- Raw OCR and original scan files are not persisted.
- `ingestion_runs` and the expression-card features remain intact.
- Only the unused `lessons`, `study_items`, and `study_examples` tables are dropped.

### Non-goals

- No memorization queue or quiz mode for WCT.
- No Topic navigation or Topic content.
- No learner editing.
- No in-app PDF upload/OCR UI in this iteration.
- No generic multi-academy/course framework.
- No AI-generated example sentences.

### Stop conditions

- Code completion stops after dev migration, automated verification, and live route verification.
- Content import stops until the user explicitly approves the reviewed Day 1–16 draft in chat.
- Production migration stops until the user explicitly authorizes the production apply command.
- The PRD remains `Active` until the agreed deployment boundary is verified.

---

## Canonical domain contract

Create these types in `lib/wct/types.ts`; tests and store implementations must use this exact
shape rather than ad-hoc route types.

```ts
export const WCT_SOURCE_KINDS = ["book", "ai_supplement"] as const;
export type WctSourceKind = (typeof WCT_SOURCE_KINDS)[number];

export const WCT_DUPLICATE_ACTIONS = ["create", "replace", "merge", "skip"] as const;
export type WctDuplicateAction = (typeof WCT_DUPLICATE_ACTIONS)[number];

export type WctExample = {
  id: string;
  englishText: string;
  meaningKo: string | null;
  sourcePage: number | null;
  sourceNeedsReview: boolean;
  sortOrder: number;
};

export type WctPattern = {
  id: string;
  patternText: string;
  meaningKo: string | null;
  usageNote: string | null;
  usageSource: WctSourceKind;
  sourcePage: number | null;
  sourceNeedsReview: boolean;
  sortOrder: number;
  examples: WctExample[];
};

export type WctConcept = {
  id: string;
  text: string;
  sourceKind: WctSourceKind;
  sortOrder: number;
};

export type WctImportantNote = {
  id: string;
  patternId: string | null;
  noteText: string;
  sourcePage: number | null;
  sortOrder: number;
};

export type WctPracticePrompt = {
  id: string;
  patternId: string | null;
  promptText: string;
  meaningKo: string | null;
  sourcePage: number | null;
  sortOrder: number;
};

export type WctDaySummary = {
  id: string;
  bookId: string;
  dayNumber: number;
  shortLabel: string;
  displayLabel: string;
  sourcePageStart: number | null;
  sourcePageEnd: number | null;
  sourceNeedsReview: boolean;
};

export type WctDay = WctDaySummary & {
  learningSummary: string | null;
  concepts: WctConcept[];
  patterns: WctPattern[];
  importantNotes: WctImportantNote[];
  practicePrompts: WctPracticePrompt[];
};

export type WctBookSummary = {
  id: string;
  title: string;
  levelLabel: string | null;
  dayCount: number;
  sortOrder: number;
};

export type WctBook = WctBookSummary & {
  days: WctDaySummary[];
};

export type WctImportDayInput = {
  dayNumber: number;
  shortLabel: string;
  learningSummary?: string | null;
  sourcePageStart?: number | null;
  sourcePageEnd?: number | null;
  sourceNeedsReview?: boolean;
  duplicateAction: WctDuplicateAction;
  concepts: Array<{ text: string; sourceKind: WctSourceKind }>;
  patterns: Array<{
    patternText: string;
    meaningKo?: string | null;
    usageNote?: string | null;
    usageSource: WctSourceKind;
    sourcePage?: number | null;
    sourceNeedsReview?: boolean;
    examples: Array<{
      englishText: string;
      meaningKo?: string | null;
      sourcePage?: number | null;
      sourceNeedsReview?: boolean;
    }>;
  }>;
  importantNotes: Array<{
    patternIndex?: number | null;
    noteText: string;
    sourcePage?: number | null;
  }>;
  practicePrompts: Array<{
    patternIndex?: number | null;
    promptText: string;
    meaningKo?: string | null;
    sourcePage?: number | null;
  }>;
};

export type WctApprovedImportInput = {
  idempotencyKey: string;
  payloadHash: string;
  book: { title: string; levelLabel?: string | null; sortOrder?: number };
  days: WctImportDayInput[];
};

export type WctImportOperation = {
  dayNumber: number;
  action: "created" | "replaced" | "merged" | "skipped";
  dayId: string;
};

export type WctImportResult = {
  bookId: string;
  receiptId: string;
  replayed: boolean;
  operations: WctImportOperation[];
  bookUrl: string;
  dayUrls: string[];
};
```

The store contract in `lib/wct-store/contract.ts` is:

```ts
import type {
  WctApprovedImportInput,
  WctBook,
  WctBookSummary,
  WctDay,
  WctImportResult
} from "@/lib/wct/types";

export type WctDuplicate = {
  dayNumber: number;
  existingDayId: string;
  existingDisplayLabel: string;
};

export interface WctStore {
  listBooks(): Promise<WctBookSummary[]>;
  getBook(bookId: string): Promise<WctBook | null>;
  getDay(dayId: string): Promise<WctDay | null>;
  findDuplicateDays(bookTitle: string, dayNumbers: number[]): Promise<WctDuplicate[]>;
  importApprovedBatch(input: WctApprovedImportInput): Promise<WctImportResult>;
}
```

---

## Task 1: Activate the PRD and lock the WCT input contract

**Files:**

- Create: `docs/prd/active/wct-course-library/README.md`
- Create: `docs/prd/active/wct-course-library/prd.md`
- Create: `docs/prd/active/wct-course-library/test-spec.md`
- Create: `docs/prd/active/wct-course-library/implementation-plan.md`
- Modify: `docs/prd/future-work.md`
- Modify: `docs/prd/README.md`
- Create: `lib/wct/types.ts`
- Create: `lib/wct/validation.ts`
- Create: `lib/wct/normalization.ts`
- Test: `tests/unit/wct-validation.test.ts`
- Test: `tests/unit/wct-normalization.test.ts`

### Step 1: Add the active tracker entry

Add `T-007 WCT private course library` under `Active` in `docs/prd/future-work.md`. The active
folder must link back to:

- `docs/superpowers/specs/2026-07-26-wct-course-library-design.md`
- `docs/superpowers/plans/2026-07-26-wct-course-library.md`

The PRD must repeat the scope/non-goals and state that `ingestion_runs` is preserved. The local
`implementation-plan.md` is a short pointer to this canonical plan rather than a divergent copy.

### Step 2: Write failing validation tests

```ts
import { describe, expect, it } from "vitest";
import { wctImportRequestSchema } from "@/lib/wct/validation";

describe("wctImportRequestSchema", () => {
  it("accepts a short Day label and explicit duplicate action", () => {
    const result = wctImportRequestSchema.safeParse({
      approvalText: "저장해",
      idempotencyKey: "wct-pre-novice-day-1-16-v1",
      book: { title: "WCT Pattern book Prenovice", levelLabel: "Pre Novice" },
      days: [{
        dayNumber: 1,
        shortLabel: "수동태",
        duplicateAction: "create",
        concepts: [{ text: "행위보다 대상을 강조한다.", sourceKind: "book" }],
        patterns: [{
          patternText: "be + p.p.",
          usageSource: "book",
          examples: [{ englishText: "It is made of wood." }]
        }],
        importantNotes: [],
        practicePrompts: []
      }]
    });

    expect(result.success).toBe(true);
  });

  it.each(["", "Day 1 (수동태)", "이 라벨은 너무 길어서 카드 한 줄을 넘기는 문장입니다"])(
    "rejects invalid short labels: %s",
    (shortLabel) => {
      const result = wctImportRequestSchema.safeParse({
        approvalText: "저장해",
        idempotencyKey: "key",
        book: { title: "Book" },
        days: [{
          dayNumber: 1,
          shortLabel,
          duplicateAction: "create",
          concepts: [],
          patterns: [],
          importantNotes: [],
          practicePrompts: []
        }]
      });
      expect(result.success).toBe(false);
    }
  );

  it("rejects Topic-shaped payloads and unknown fields", () => {
    const result = wctImportRequestSchema.safeParse({
      approvalText: "저장해",
      idempotencyKey: "key",
      book: { title: "Book" },
      topics: [{ topicNumber: 1 }],
      days: []
    });
    expect(result.success).toBe(false);
  });
});
```

### Step 3: Prove the tests fail

Run:

```bash
npm test -- tests/unit/wct-validation.test.ts tests/unit/wct-normalization.test.ts
```

Expected: FAIL because `@/lib/wct/validation` and `@/lib/wct/normalization` do not exist.

### Step 4: Implement strict schemas and normalization

`lib/wct/normalization.ts` must export:

```ts
export function normalizeWctIdentity(value: string) {
  return value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
}

export function formatWctDayLabel(dayNumber: number, shortLabel: string) {
  return `Day ${dayNumber} (${shortLabel.trim()})`;
}
```

`lib/wct/validation.ts` must:

- use `.strict()` on the root, book, Day, concept, pattern, example, note, and practice schemas;
- require `dayNumber` as an integer from 1 through 999;
- require `shortLabel` to be 1–18 characters and reject strings starting with `Day `;
- require one or more Days per import;
- allow `sourcePageStart/sourcePageEnd/sourcePage` only as positive integers;
- require `sourcePageEnd >= sourcePageStart` when both are present;
- require `patternIndex` to refer to an existing pattern within the same Day;
- allow only `book` and `ai_supplement` source kinds;
- allow only `create`, `replace`, `merge`, and `skip` duplicate actions;
- define a separate preflight schema containing `bookTitle` and unique `dayNumbers`;
- keep `approvalText` in the HTTP request schema, not in `WctApprovedImportInput`.

### Step 5: Run focused tests

```bash
npm test -- tests/unit/wct-validation.test.ts tests/unit/wct-normalization.test.ts
npm run typecheck
```

Expected: PASS.

### Step 6: Commit

```bash
git add docs/prd lib/wct tests/unit/wct-validation.test.ts tests/unit/wct-normalization.test.ts
git commit -m "Establish the private WCT import contract" \
  -m "Constraint: WCT content is Day-only, owner-private, and separate from expression cards
Rejected: Reusing expression ingestion payloads | They cannot represent concepts, patterns, notes, practice, or duplicate actions
Confidence: high
Scope-risk: narrow
Directive: Keep Topic and raw OCR fields out of this contract
Tested: npm test -- tests/unit/wct-validation.test.ts tests/unit/wct-normalization.test.ts; npm run typecheck
Not-tested: Database and runtime routes are introduced in later tasks"
```

---

## Task 2: Implement the isolated in-memory WCT store

**Files:**

- Create: `lib/wct-store/contract.ts`
- Create: `lib/wct-store/memory-store.ts`
- Modify: `app/test/reset/route.ts`
- Test: `tests/integration/memory-wct-store.test.ts`

### Step 1: Write failing store tests

Cover these cases with one fresh owner per test:

```ts
it("isolates books by owner", async () => {
  const ownerA = new MemoryWctStore({ id: USER_A });
  const ownerB = new MemoryWctStore({ id: USER_B });

  await ownerA.importApprovedBatch(importInput({ idempotencyKey: "a-1" }));

  expect(await ownerA.listBooks()).toHaveLength(1);
  expect(await ownerB.listBooks()).toEqual([]);
});

it("replays the same idempotency key and hash", async () => {
  const store = new MemoryWctStore({ id: USER_A });
  const input = importInput({ idempotencyKey: "same", payloadHash: "hash-a" });

  const first = await store.importApprovedBatch(input);
  const replay = await store.importApprovedBatch(input);

  expect(replay).toEqual(first);
  expect(await store.listBooks()).toHaveLength(1);
});

it("rejects an idempotency key reused with a different hash", async () => {
  const store = new MemoryWctStore({ id: USER_A });
  await store.importApprovedBatch(importInput({ idempotencyKey: "same", payloadHash: "hash-a" }));

  await expect(
    store.importApprovedBatch(importInput({ idempotencyKey: "same", payloadHash: "hash-b" }))
  ).rejects.toThrow("Idempotency key already used with a different payload");
});

it("replaces an existing Day and all of its children", async () => {
  const store = new MemoryWctStore({ id: USER_A });
  await store.importApprovedBatch(importInput({ idempotencyKey: "seed" }));
  const result = await store.importApprovedBatch(
    importInput({ idempotencyKey: "replace", duplicateAction: "replace", patternText: "new pattern" })
  );

  expect(result.operations[0].action).toBe("replaced");
  expect((await store.getDay(result.operations[0].dayId))?.patterns.map((item) => item.patternText))
    .toEqual(["new pattern"]);
});

it("merges only normalized-missing children", async () => {
  const store = new MemoryWctStore({ id: USER_A });
  await store.importApprovedBatch(importInput({ idempotencyKey: "seed", patternText: "Be + P.P." }));
  const result = await store.importApprovedBatch(
    importInput({ idempotencyKey: "merge", duplicateAction: "merge", patternText: "  be + p.p.  " })
  );

  expect(result.operations[0].action).toBe("merged");
  expect((await store.getDay(result.operations[0].dayId))?.patterns).toHaveLength(1);
});

it("skips an existing Day without changing it", async () => {
  const store = new MemoryWctStore({ id: USER_A });
  const seeded = await store.importApprovedBatch(importInput({ idempotencyKey: "seed" }));
  const before = await store.getDay(seeded.operations[0].dayId);
  const result = await store.importApprovedBatch(
    importInput({ idempotencyKey: "skip", duplicateAction: "skip", patternText: "ignored" })
  );

  expect(result.operations[0].action).toBe("skipped");
  expect(await store.getDay(result.operations[0].dayId)).toEqual(before);
});
```

For `merge`, assert case/whitespace-normalized de-duplication of patterns, examples, notes, and
practice prompts. For `replace`, assert prior child rows disappear. For `skip`, assert the Day is
unchanged.

### Step 2: Prove the tests fail

```bash
npm test -- tests/integration/memory-wct-store.test.ts
```

Expected: FAIL because the store does not exist.

### Step 3: Implement one separate global state

Use a WCT-specific global symbol; do not append WCT fields to the expression memory store.

```ts
type MemoryWctState = {
  books: Map<string, StoredWctBook>;
  receipts: Map<string, StoredReceipt>;
};

const memoryWctStateKey = Symbol.for("english-app.memory-wct-store");

function getState(): MemoryWctState {
  const globalState = globalThis as typeof globalThis & {
    [memoryWctStateKey]?: MemoryWctState;
  };
  return (globalState[memoryWctStateKey] ??= {
    books: new Map(),
    receipts: new Map()
  });
}
```

Implement `MemoryWctStore` against the canonical contract. All read methods must:

- filter by the constructor's `user.id`;
- deep-clone returned objects;
- sort books by `sortOrder`, then title;
- sort Days and all child collections by their `sortOrder`;
- return `null` when another owner's ID is requested.

Update `/test/reset`:

```ts
resetMemoryExpressionStoreForTests();
resetMemoryWctStoreForTests();
```

### Step 4: Run focused and regression tests

```bash
npm test -- tests/integration/memory-wct-store.test.ts
npm test -- tests/integration/memory-lesson-store.test.ts
npm run typecheck
```

Expected: PASS.

### Step 5: Commit

```bash
git add lib/wct-store app/test/reset/route.ts tests/integration/memory-wct-store.test.ts
git commit -m "Keep WCT state isolated from expression cards" \
  -m "Constraint: WCT is a private read-only learner domain with approval-gated admin writes
Rejected: Extending MemoryExpressionStore | It would couple unrelated review and ingestion behavior
Confidence: high
Scope-risk: narrow
Directive: Preserve owner filtering and deterministic ordering in every WCT store implementation
Tested: npm test -- tests/integration/memory-wct-store.test.ts; npm test -- tests/integration/memory-lesson-store.test.ts; npm run typecheck
Not-tested: Supabase persistence is implemented in a later task"
```

---

## Task 3: Add the private WCT schema, RLS, transactional import, and legacy-table removal

**Files:**

- Create: `supabase/migrations/20260726120000_create_private_wct_course_library.sql`
- Create: `supabase/migrations/20260726121000_add_transactional_wct_import.sql`
- Create: `supabase/migrations/20260726122000_drop_legacy_lesson_tables.sql`
- Create: `tests/security/wct-rls-policy.test.ts`
- Test: `tests/security/rls-policy.test.ts`

### Step 1: Write failing SQL contract tests

The new test must concatenate all migration files in filename order and assert:

```ts
expect(sql).toContain("create table if not exists public.wct_books");
expect(sql).toContain("create table if not exists public.wct_days");
expect(sql).toContain("create table if not exists public.wct_patterns");
expect(sql).toContain("create table if not exists public.wct_import_receipts");
expect(sql).toContain("enable row level security");
expect(sql).toContain("for select");
expect(sql).not.toMatch(/create policy[^;]+for (insert|update|delete)[^;]+wct_/is);
expect(sql).toContain("revoke all on function public.import_wct_batch");
expect(sql).toContain("grant execute on function public.import_wct_batch");
expect(sql).toContain("to service_role");
expect(sql).toContain("drop table if exists public.study_examples");
expect(sql).toContain("drop table if exists public.study_items");
expect(sql).toContain("drop table if exists public.lessons");
expect(sql).not.toContain("drop table if exists public.ingestion_runs");
```

Add a migration-order assertion that the legacy drop comes after the WCT schema and RPC.

### Step 2: Prove the security test fails

```bash
npm test -- tests/security/wct-rls-policy.test.ts
```

Expected: FAIL because the migrations do not exist.

### Step 3: Create normalized owner-private tables

The first migration creates:

```sql
create table if not exists public.wct_books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  normalized_title text generated always as (
    regexp_replace(lower(btrim(title)), '\s+', ' ', 'g')
  ) stored,
  level_label text null check (level_label is null or length(btrim(level_label)) <= 80),
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
  learning_summary text null,
  source_page_start integer null check (source_page_start > 0),
  source_page_end integer null check (source_page_end > 0),
  source_needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (book_id, day_number),
  check (
    source_page_start is null
    or source_page_end is null
    or source_page_end >= source_page_start
  )
);
```

Also create:

- `wct_day_concepts(day_id, text, source_kind, sort_order)`
- `wct_patterns(day_id, pattern_text, meaning_ko, usage_note, usage_source, source_page,
  source_needs_review, sort_order)`
- `wct_examples(pattern_id, english_text, meaning_ko, source_page, source_needs_review,
  sort_order)`
- `wct_important_notes(day_id, pattern_id nullable, note_text, source_page, sort_order)`
- `wct_practice_prompts(day_id, pattern_id nullable, prompt_text, meaning_ko, source_page,
  sort_order)`
- `wct_import_receipts(owner_id, book_id, idempotency_key, payload_hash, operation_summary,
  created_at)`

Add:

- `check (source_kind in ('book', 'ai_supplement'))` to concepts;
- `check (usage_source in ('book', 'ai_supplement'))` to patterns;
- unique `(owner_id, idempotency_key)` on receipts;
- indexes for `wct_books(owner_id, sort_order)`, `wct_days(book_id, day_number)`, and all child
  foreign keys;
- updated-at triggers only for books and Days;
- `ON DELETE CASCADE` through the entire graph.

### Step 4: Add read-only RLS

Enable and force RLS on every WCT table. Add owner-only `FOR SELECT TO authenticated` policies:

```sql
create policy "owners can read their WCT books"
on public.wct_books
for select
to authenticated
using (owner_id = auth.uid());
```

Child policies must resolve ownership through joins to `wct_books`. Receipt rows are service-role
audit data and receive no authenticated policy.

Grant:

```sql
grant select on public.wct_books,
  public.wct_days,
  public.wct_day_concepts,
  public.wct_patterns,
  public.wct_examples,
  public.wct_important_notes,
  public.wct_practice_prompts
to authenticated;

revoke insert, update, delete on all seven content tables from anon, authenticated;
revoke all on public.wct_import_receipts from anon, authenticated;
```

### Step 5: Add one transactional import RPC

The second migration uses this function signature and idempotency guard:

```sql
create or replace function public.import_wct_batch(
  p_owner_id uuid,
  p_idempotency_key text,
  p_payload_hash text,
  p_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing_receipt public.wct_import_receipts%rowtype;
  v_book public.wct_books%rowtype;
  v_day jsonb;
  v_existing_day_id uuid;
  v_day_id uuid;
  v_action text;
  v_operations jsonb := '[]'::jsonb;
  v_receipt_id uuid;
begin
  select * into v_existing_receipt
  from public.wct_import_receipts
  where owner_id = p_owner_id and idempotency_key = p_idempotency_key;

  if found then
    if v_existing_receipt.payload_hash <> p_payload_hash then
      raise exception 'Idempotency key already used with a different payload';
    end if;
    return v_existing_receipt.operation_summary || jsonb_build_object('replayed', true);
  end if;
```

After the guard, implement the transaction in this exact order:

1. Validate the root JSON object has exactly `book` and `days`, reject Topic/raw OCR/scan keys, and
   reject an empty Day array.
2. Insert or update the `(owner_id, normalized_title)` book and retain `v_book.id`.
3. Iterate `jsonb_array_elements(p_payload->'days') with ordinality`.
4. Look up `(v_book.id, day_number)` and reject unknown duplicate actions.
5. `create` errors if the Day exists; otherwise inserts the Day.
6. `replace` deletes all existing child rows, updates Day metadata, and reinserts approved content.
7. `merge` keeps the Day ID and inserts only normalized-missing concepts, patterns, examples, notes,
   and practice prompts.
8. `skip` returns the existing Day ID without modifying it.
9. Use `regexp_replace(lower(btrim(text)), '\s+', ' ', 'g')` as merge identity.
10. Resolve note/practice `patternIndex` to the newly inserted or matched pattern ID.
11. Convert JSON ordinality to deterministic zero-based `sort_order`.
12. Append `{dayNumber, action, dayId}` to `v_operations` after each Day succeeds.
13. Insert the receipt only after the entire loop succeeds.

End the function with:

```sql
  insert into public.wct_import_receipts (
    owner_id, book_id, idempotency_key, payload_hash, operation_summary
  ) values (
    p_owner_id,
    v_book.id,
    p_idempotency_key,
    p_payload_hash,
    jsonb_build_object(
      'bookId', v_book.id,
      'receiptId', null,
      'replayed', false,
      'operations', v_operations
    )
  )
  returning id into v_receipt_id;

  update public.wct_import_receipts
  set operation_summary = operation_summary || jsonb_build_object('receiptId', v_receipt_id)
  where id = v_receipt_id;

  return jsonb_build_object(
    'bookId', v_book.id,
    'receiptId', v_receipt_id,
    'replayed', false,
    'operations', v_operations
  );
end;
$$;
```

Finish with:

```sql
revoke all on function public.import_wct_batch(uuid, text, text, jsonb)
from public, anon, authenticated;
grant execute on function public.import_wct_batch(uuid, text, text, jsonb)
to service_role;
```

### Step 6: Drop only unused legacy lesson tables

The third migration must be:

```sql
drop table if exists public.study_examples cascade;
drop table if exists public.study_items cascade;
drop table if exists public.lessons cascade;
```

Do not mention or alter `public.ingestion_runs`, expression tables, review tables, questions, or
content folders.

### Step 7: Run static migration verification

```bash
npm test -- tests/security/wct-rls-policy.test.ts tests/security/rls-policy.test.ts
npm run db:validate:dev
```

Expected: PASS.

### Step 8: Commit

```bash
git add supabase/migrations tests/security/wct-rls-policy.test.ts
git commit -m "Make WCT persistence private and transactional" \
  -m "Constraint: Learners may read only their own WCT content and browser writes are forbidden
Rejected: Ad-hoc multi-request inserts | They can leave partial Day imports and ambiguous duplicates
Confidence: high
Scope-risk: moderate
Directive: Never edit these applied migrations; add a later migration for corrections
Tested: npm test -- tests/security/wct-rls-policy.test.ts tests/security/rls-policy.test.ts; npm run db:validate:dev
Not-tested: Executable PostgreSQL RLS checks run after the local verifier is updated"
```

---

## Task 4: Implement Supabase reads and the approval-gated import API

**Files:**

- Create or replace: `lib/wct-store/supabase-store.ts`
- Create: `lib/wct-store/mappers.ts`
- Create: `lib/wct-store/factory.ts`
- Create: `lib/wct-store.ts`
- Create: `app/api/wct/import/preflight/route.ts`
- Create: `app/api/wct/import/route.ts`
- Create: `tests/integration/wct-import-api.test.ts`
- Create: `tests/security/wct-ingestion-api-auth.test.ts`
- Test: `tests/unit/validation.test.ts`

### Step 1: Write failing API and source-boundary tests

The API integration test must run in memory mode and cover:

```ts
it("rejects a request without the bearer token", async () => {
  const response = await POST(requestWithoutAuthorization(validBody));
  expect(response.status).toBe(401);
});

it("rejects non-explicit approval", async () => {
  const response = await POST(authorizedRequest({ ...validBody, approvalText: "검토해줘" }));
  expect(response.status).toBe(409);
});

it("computes the payload hash server-side and imports after approval", async () => {
  const response = await POST(authorizedRequest({ ...validBody, approvalText: "저장해" }));
  expect(response.status).toBe(201);
  expect(await response.json()).toMatchObject({
    bookUrl: expect.stringMatching(/^\/lessons\/books\//),
    dayUrls: [expect.stringMatching(/\/days\//)]
  });
});
```

The security source test must assert:

- both routes call `authorizeIngestionRequest`;
- both routes call `getIngestionOwnerIdentity`;
- neither schema nor route reads `ownerId`, `owner_id`, `userId`, or `user_id` from the body;
- the import route calls `isExplicitLessonSaveApproval`;
- the import route uses `createHash("sha256")`;
- the import route calls `getAdminWctStore(owner)`;
- the preflight route calls `findDuplicateDays`;
- the import route does not log the payload.

### Step 2: Prove tests fail

```bash
npm test -- tests/integration/wct-import-api.test.ts tests/security/wct-ingestion-api-auth.test.ts
```

Expected: FAIL because the routes and Supabase implementation do not exist.

### Step 3: Implement Supabase read mappers

`SupabaseWctStore` must:

- use the session client for `listBooks`, `getBook`, and `getDay`;
- use the injected service-role client only when created by `getAdminWctStore`;
- select nested rows in one query per page;
- convert snake_case rows into the canonical camelCase types;
- return `null` for `PGRST116`/not-found and throw other errors;
- never add owner IDs to learner queries as a substitute for RLS;
- call `rpc("import_wct_batch", ...)` only from `importApprovedBatch`;
- call `findDuplicateDays` by normalized title and requested Day numbers;
- map RPC output into route URLs rather than trusting URLs stored in SQL.

The mapper must derive:

```ts
displayLabel: formatWctDayLabel(row.day_number, row.short_label)
```

Create the factory only after both implementations exist:

```ts
export function getWctStore(user: UserIdentity): WctStore {
  if (isE2EMemoryMode()) return new MemoryWctStore(user);
  return new SupabaseWctStore(user);
}

export function getAdminWctStore(user: UserIdentity): WctStore {
  if (isE2EMemoryMode()) return new MemoryWctStore(user);
  return new SupabaseWctStore(user, createServiceRoleSupabaseClient);
}
```

### Step 4: Implement preflight

`POST /api/wct/import/preflight`:

1. authorizes the bearer token;
2. derives the owner from environment;
3. validates `{ bookTitle, dayNumbers }`;
4. returns `{ duplicates: WctDuplicate[] }`;
5. returns `401`, `400`, or `500` without echoing the book payload.

### Step 5: Implement approved import

`POST /api/wct/import`:

```ts
const parsed = wctImportRequestSchema.safeParse(await request.json());
if (!parsed.success) {
  return NextResponse.json({ error: "Invalid WCT import payload" }, { status: 400 });
}
if (!isExplicitLessonSaveApproval(parsed.data.approvalText)) {
  return NextResponse.json({ error: "Explicit save approval required" }, { status: 409 });
}

const payload = { book: parsed.data.book, days: parsed.data.days };
const payloadHash = createHash("sha256")
  .update(stableStringify(payload))
  .digest("hex");

const result = await getAdminWctStore(owner).importApprovedBatch({
  idempotencyKey: parsed.data.idempotencyKey,
  payloadHash,
  ...payload
});
```

Use a deterministic object-key sorter in `lib/wct/normalization.ts` for `stableStringify`; do not
add a package.

Return `201` when `result.replayed === false` and `200` when `result.replayed === true`.

### Step 6: Run tests

```bash
npm test -- tests/integration/wct-import-api.test.ts tests/security/wct-ingestion-api-auth.test.ts tests/unit/validation.test.ts
npm run typecheck
```

Expected: PASS.

### Step 7: Commit

```bash
git add lib/wct-store lib/wct/normalization.ts app/api/wct tests/integration/wct-import-api.test.ts tests/security/wct-ingestion-api-auth.test.ts
git commit -m "Require explicit approval for WCT imports" \
  -m "Constraint: Import ownership is server-derived and scanned source material must not be persisted
Rejected: Browser-side WCT writes | They would weaken the private read-only boundary
Confidence: high
Scope-risk: moderate
Directive: Keep payload hashing deterministic and never log approved textbook content
Tested: npm test -- tests/integration/wct-import-api.test.ts tests/security/wct-ingestion-api-auth.test.ts tests/unit/validation.test.ts; npm run typecheck
Not-tested: Hosted Supabase execution waits for the dev migration task"
```

---

## Task 5: Build the WCT-only learner UI and add `수업` to the GNB

**Files:**

- Modify: `components/BottomNav.tsx`
- Replace: `app/lessons/page.tsx`
- Replace: `app/lessons/[id]/page.tsx` with a redirect compatibility route or remove it
- Create: `app/lessons/books/[bookId]/page.tsx`
- Create: `app/lessons/books/[bookId]/days/[dayId]/page.tsx`
- Create: `components/wct/WctBookCard.tsx`
- Create: `components/wct/WctDayCard.tsx`
- Create: `components/wct/WctDayContent.tsx`
- Create: `components/wct/WctPatternCard.tsx`
- Create: `components/wct/WctSourceBadge.tsx`
- Create: `tests/components/wct-library.test.tsx`
- Modify: `tests/components/bottom-nav.test.tsx`

### Step 1: Write failing component tests

Cover:

```tsx
it("adds a fourth 수업 destination", () => {
  render(<BottomNav />);
  expect(screen.getByRole("link", { name: "수업" })).toHaveAttribute("href", "/lessons");
  expect(screen.getAllByRole("link")).toHaveLength(4);
});

it("renders a compact Day label without Topic", () => {
  render(<WctDayCard day={daySummary({ dayNumber: 13, shortLabel: "if 가능" })} />);
  expect(screen.getByText("Day 13 (if 가능)")).toBeVisible();
  expect(screen.queryByText(/Topic/i)).not.toBeInTheDocument();
});

it("marks only AI-supplemented usage notes", () => {
  render(<WctPatternCard pattern={pattern({ usageSource: "ai_supplement" })} />);
  expect(screen.getByText("AI 보완")).toBeVisible();
});

it("renders examples, important notes, and core practice as read-only content", () => {
  render(<WctDayContent day={dayWithAllSections()} />);
  expect(screen.getByText("핵심 개념")).toBeVisible();
  expect(screen.getByText("핵심 패턴")).toBeVisible();
  expect(screen.getByText("중요 메모")).toBeVisible();
  expect(screen.getByText("핵심 연습")).toBeVisible();
  expect(screen.queryByRole("button", { name: /추가|수정|삭제|저장/ })).not.toBeInTheDocument();
});
```

### Step 2: Prove tests fail

```bash
npm test -- tests/components/bottom-nav.test.tsx tests/components/wct-library.test.tsx
```

Expected: FAIL.

### Step 3: Change only the GNB destination set

Update:

```ts
const NAV_ITEMS = [
  { href: "/expressions", label: "표현", icon: MessageCircle },
  { href: "/memorize", label: "암기", icon: Brain },
  { href: "/questions", label: "질문거리", icon: HelpCircle },
  { href: "/lessons", label: "수업", icon: BookOpen }
] as const;
```

Change only the grid column count needed for four items. Preserve all other placement, styling, and
active-route behavior.

### Step 4: Implement server-rendered routes

`/lessons`:

- calls `requireCurrentUser()` and `getWctStore(user).listBooks()`;
- heading: `WCT 수업`;
- supporting copy says the material is organized by Day;
- renders textbook cards with title, optional level, and Day count;
- empty state says approved WCT material will appear here;
- has no upload/import/edit UI.

`/lessons/books/[bookId]`:

- calls `getBook(bookId)`;
- calls `notFound()` for missing or other-owner IDs;
- renders ordered `WctDayCard` links.

`/lessons/books/[bookId]/days/[dayId]`:

- loads the book and Day;
- verifies `day.bookId === book.id`, otherwise `notFound()`;
- renders all sections expanded through `WctDayContent`;
- shows source-review warning only when `sourceNeedsReview` is true;
- shows the `AI 보완` badge only for `sourceKind/usageSource === "ai_supplement"`;
- shows source page numbers as small metadata;
- contains no forms or mutation controls.

Keep `/lessons/[id]` as:

```ts
import { redirect } from "next/navigation";

export default async function LegacyLessonDetailRedirect({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/lessons/books/${id}`);
}
```

This prevents stale internal bookmarks from becoming a 404 without preserving legacy lesson data.

### Step 5: Run component and type tests

```bash
npm test -- tests/components/bottom-nav.test.tsx tests/components/wct-library.test.tsx
npm run typecheck
```

Expected: PASS.

### Step 6: Commit

```bash
git add components/BottomNav.tsx components/wct app/lessons tests/components
git commit -m "Make the class tab a WCT reading library" \
  -m "Constraint: The learner surface is read-only, Day-based, and WCT-only
Rejected: Topic navigation and inline editing | Both are outside the approved first iteration
Confidence: high
Scope-risk: narrow
Directive: Keep AI-supplement labels explicit and preserve the compact Day title format
Tested: npm test -- tests/components/bottom-nav.test.tsx tests/components/wct-library.test.tsx; npm run typecheck
Not-tested: Browser navigation is covered in the later Playwright task"
```

---

## Task 6: Replace legacy local RLS checks with executable WCT checks

**Files:**

- Modify: `scripts/verify-rls-local.sh`
- Test: `tests/security/wct-rls-policy.test.ts`

### Step 1: Add failing script-source assertions

Extend the WCT security test to read `scripts/verify-rls-local.sh` and assert:

```ts
expect(script).toContain("wct_books");
expect(script).toContain("wct_days");
expect(script).toContain("import_wct_batch");
expect(script).toContain("service_role");
expect(script).not.toMatch(/insert into public\.lessons/i);
expect(script).not.toMatch(/insert into public\.study_items/i);
expect(script).not.toMatch(/insert into public\.study_examples/i);
```

### Step 2: Prove the test fails

```bash
npm test -- tests/security/wct-rls-policy.test.ts
```

Expected: FAIL because the verifier still seeds legacy lesson tables.

### Step 3: Update the executable RLS verifier

Preserve all expression, progress, question, content-folder, and `ingestion_runs` checks.

Replace only the legacy lesson section with:

1. create or ensure `anon`, `authenticated`, and `service_role` test roles;
2. seed owner A, owner B, and their WCT graph as admin;
3. assert anon cannot select any WCT table;
4. assert owner A can read A's book/Day/children;
5. assert owner A cannot read B's book/Day/children;
6. assert authenticated owner A cannot insert, update, or delete WCT rows;
7. assert authenticated roles cannot execute `import_wct_batch`;
8. assert service role can execute an approved test payload;
9. assert the same key/hash replays one receipt;
10. assert the same key/different hash errors;
11. assert replace/merge/skip produce the expected child counts;
12. assert deleting the test book as admin cascades through all WCT children and receipts.

Use explicit fixture UUIDs, not environment variables or shell interpolation for destructive SQL.

### Step 4: Run static and executable checks

```bash
npm test -- tests/security/wct-rls-policy.test.ts tests/security/rls-policy.test.ts
npm run verify:rls
```

Expected: PASS. If Docker/Postgres is unavailable, record the exact blocker and do not claim
executable RLS verification.

### Step 5: Commit

```bash
git add scripts/verify-rls-local.sh tests/security/wct-rls-policy.test.ts
git commit -m "Verify the WCT privacy boundary against PostgreSQL" \
  -m "Constraint: Legacy lesson tables are removed while ingestion_runs remains active
Rejected: Source-text checks alone | They cannot prove effective grants, policies, or RPC execution
Confidence: high
Scope-risk: moderate
Directive: Keep executable owner/other-owner/browser-write checks when WCT schema changes
Tested: npm test -- tests/security/wct-rls-policy.test.ts tests/security/rls-policy.test.ts; npm run verify:rls
Not-tested: Hosted dev and production databases are checked in later rollout tasks"
```

---

## Task 7: Add representative WCT browser coverage

**Files:**

- Create: `app/test/seed-wct-book/route.ts`
- Create: `e2e/wct-course-library.spec.ts`
- Modify: `e2e/performance-budget.spec.ts`
- Modify: `app/test/reset/route.ts` if Task 2 did not already reset WCT state

### Step 1: Write the failing Playwright flow

```ts
test.beforeEach(async ({ request }) => {
  expect((await request.post("/test/reset")).ok()).toBe(true);
  expect((await request.post("/test/seed-wct-book")).ok()).toBe(true);
});

test("reads WCT by book and Day without Topic or edit controls", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "수업" }).click();

  await expect(page).toHaveURL("/lessons");
  await page.getByRole("link", { name: /WCT Pattern book Prenovice/ }).click();
  await expect(page.getByText("Day 1 (수동태)")).toBeVisible();
  await expect(page.getByText("Day 13 (if 가능)")).toBeVisible();

  await page.getByRole("link", { name: /Day 13 \(if 가능\)/ }).click();
  await expect(page.getByText("핵심 패턴")).toBeVisible();
  await expect(page.getByText("AI 보완")).toBeVisible();
  await expect(page.getByText("중요 메모")).toBeVisible();
  await expect(page.getByText("핵심 연습")).toBeVisible();
  await expect(page.getByText(/Topic/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /추가|수정|삭제|저장/ })).toHaveCount(0);
});

test("does not expose another owner's book by guessed URL", async ({ page }) => {
  await page.goto("/lessons/books/other-owner-book-id");
  await expect(page).toHaveURL(/\/404|\/not-found/);
});
```

Use real UUID-shaped fixture IDs so the Supabase and memory contracts stay aligned.

### Step 2: Implement the E2E seed route

The route:

- returns 404 outside `E2E_MEMORY_STORE=1`;
- uses `E2E_FAKE_USER_ID`;
- calls `getAdminWctStore`;
- seeds one book with Day 1, Day 10, Day 13, and Day 16;
- includes one book-sourced pattern, one AI-supplement usage note, one important note, and one core
  practice prompt;
- imports no Topic data.

### Step 3: Add `/lessons` to the desktop FCP budget

```ts
const BUDGETED_ROUTES = ["/", "/expressions", "/memorize", "/questions", "/lessons"];
```

Do not add detail routes to this existing broad budget; the functional spec exercises them.

### Step 4: Run E2E

```bash
npm run test:e2e -- e2e/wct-course-library.spec.ts
npm run test:e2e -- e2e/performance-budget.spec.ts
```

Expected: PASS and `/lessons` FCP ≤ 3000 ms.

### Step 5: Commit

```bash
git add app/test e2e
git commit -m "Prove the WCT reading path in a real browser" \
  -m "Constraint: The shipped experience must work through the bottom navigation on a mobile viewport
Rejected: Component tests only | They do not verify App Router navigation and loaded page state
Confidence: high
Scope-risk: narrow
Directive: Keep Topic and mutation-control absence assertions in the WCT browser flow
Tested: npm run test:e2e -- e2e/wct-course-library.spec.ts; npm run test:e2e -- e2e/performance-budget.spec.ts
Not-tested: Hosted dev content is covered after migration and import approval"
```

---

## Task 8: Apply to dev, run the full gate, and verify the live WCT route

**Files:**

- Modify only if verification reveals an in-scope defect.
- Update: `docs/prd/active/wct-course-library/test-spec.md` with actual evidence.

### Step 1: Confirm the dev target before any hosted DB call

Run:

```bash
npm run db:status:dev
```

Verify the output names Supabase project ref `uixpyibcpleuwsgemdno`. Stop if the ref differs.

### Step 2: Apply dev migrations

```bash
npm run db:migrate:dev
npm run db:status:dev
```

Expected:

- all three WCT migrations are applied;
- no checksum mismatches;
- `ingestion_runs` remains present;
- legacy `lessons`, `study_items`, and `study_examples` are absent.

### Step 3: Run the full command gate

```bash
npm run lint
npm run typecheck
npm test
npm run verify:rls
npm run build
```

Expected: all PASS.

### Step 4: Restart and inspect the dev server

Because a build or chunk change may invalidate a running dev server, stop the task-owned server if
one exists and run:

```bash
npm run dev -- --hostname 0.0.0.0
```

Then verify:

```bash
curl -I http://127.0.0.1:3000/lessons
```

Also determine the machine's reachable LAN address and check:

```bash
curl -I http://<reachable-ip>:3000/lessons
```

Expected: the auth-appropriate healthy response with no 500. Inspect terminal output for
`InternalServerError`, `Cannot find module`, missing chunks, schema errors, and failed server
actions.

### Step 5: Run the live signed-in browser path

Using the in-app browser or Playwright against the running app:

1. open `/lessons`;
2. confirm the `수업` nav item is active;
3. confirm an empty state before content import, or the seeded book if dev already has content;
4. confirm no legacy lesson error;
5. after Task 9 import, repeat book → Day navigation and verify Day 1 and Day 16.

### Step 6: Record evidence and commit any verification-doc update

```bash
git add docs/prd/active/wct-course-library/test-spec.md
git commit -m "Record the verified dev WCT boundary" \
  -m "Constraint: Runtime-facing work cannot be complete without a healthy live route
Confidence: high
Scope-risk: narrow
Directive: Keep production rollout separate from dev evidence
Tested: npm run lint; npm run typecheck; npm test; npm run verify:rls; npm run build; curl /lessons; live browser navigation
Not-tested: Production remains gated by explicit confirmation"
```

---

## Task 9: Extract, review, and import WCT Pre Novice Day 1–16

**Source file:** `/Users/parkseryu/Downloads/WCT Pre Novice.pdf`

**Repository files:** None. The approved structured payload should be temporary and must not be
committed.

### Step 1: Reconfirm the extraction boundary

Use the already established page boundaries:

| Day | PDF pages |
|---|---:|
| 1 | 7–14 |
| 2 | 15–23 |
| 3 | 24–31 |
| 4 | 32–39 |
| 5 | 40–47 |
| 6 | 48–55 |
| 7 | 56–63 |
| 8 | 64–71 |
| 9 | 72–79 |
| 10 | 80–86 |
| 11 | 87–93 |
| 12 | 94–101 |
| 13 | 102–108 |
| 14 | 109–116 |
| 15 | 117–123 |
| 16 | 124–127 |

PDF page 128 onward begins Topic material and must not be extracted.

### Step 2: OCR into a temporary workspace

- Render only pages 7–127 at sufficient resolution.
- OCR printed English/Korean and inspect the rendered page for every low-confidence line.
- Compare repeated clean/annotated A/B pages and keep one canonical printed item.
- Ignore ordinary handwritten answers, circles, checkmarks, and marginal notes.
- Preserve only handwritten corrections or usage distinctions that materially change meaning; put
  them in `importantNotes`.
- Mark uncertain source lines with `sourceNeedsReview: true`.
- Do not invent missing examples.
- AI may add a short grammar clarification only as `usageSource: "ai_supplement"`.

### Step 3: Produce the chat review draft

For each Day, show:

```text
Day N (짧은 핵심어)
- 핵심 개념
- 패턴 / 뜻 / 사용 메모
- 교재 예문
- 중요 메모 (있는 경우만)
- 핵심 연습 (직접 도움 되는 항목만)
- AI 보완 (있는 경우만)
- 확인 필요 (OCR 불확실한 경우만)
```

The draft must include all 16 Days and no Topic section. Keep the book name exactly:
`WCT Pattern book Prenovice`, with level label `Pre Novice`.

### Step 4: Run duplicate preflight against dev

Call `POST /api/wct/import/preflight` with the configured bearer token and:

```json
{
  "bookTitle": "WCT Pattern book Prenovice",
  "dayNumbers": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
}
```

If duplicates exist, show the exact Days and require the user to choose `replace`, `merge`, or
`skip` for each duplicate. Do not infer the choice.

### Step 5: Pause for explicit user approval

Accept only the existing explicit approval phrases recognized by
`isExplicitLessonSaveApproval`, for example `저장해`, `이대로 저장`, or `응 저장해`.

Revision requests, questions, and phrases such as `검토해줘`, `아직`, or `저장하지 마` do not
authorize import.

### Step 6: Import the approved payload to dev

After approval:

- compute a caller-stable idempotency key such as
  `wct-pre-novice-days-1-16-approved-v1` (increment to `v2` only if the reviewed draft changes);
- submit only the approved structured book/Day payload plus approval text;
- do not submit or store raw OCR or the PDF;
- keep the temporary OCR workspace outside the repo;
- delete the temporary OCR renders after successful verification using a recoverable Trash move.

### Step 7: Verify dev content

- open `/lessons`;
- open `WCT Pattern book Prenovice`;
- verify Day 1 through Day 16 appear in numeric order;
- open at least Day 1, Day 13, and Day 16;
- verify AI badges, important notes, and source-review warnings match the approved draft;
- verify no Topic appears;
- verify another authenticated user cannot read the imported IDs.

---

## Task 10: Production rollout and PRD completion

**Files:**

- Move after verified completion:
  `docs/prd/active/wct-course-library/` →
  `docs/prd/complete/wct-course-library/`
- Modify: `docs/prd/future-work.md`
- Modify: `docs/prd/README.md`

### Step 1: Inspect production status without changing it

Run:

```bash
npm run db:status:main
```

Verify production ref `ccawzrrkxuirrwvaecvw`. Report pending WCT migrations and confirm that
dev-only migration evidence does not imply production state.

### Step 2: Require explicit production authorization

Do not run the next step until the user explicitly authorizes applying WCT migrations to
production. This is separate from approval to import the textbook content into dev.

### Step 3: Apply and verify production migrations

After authorization:

```bash
npm run db:migrate:main -- --confirm-production
npm run db:status:main
```

Verify:

- WCT tables, RLS, and RPC exist;
- `ingestion_runs` still exists;
- the three legacy lesson tables are absent;
- no checksum mismatches exist.

Run an authenticated-user read smoke against production to prove effective RLS.

### Step 4: Import content only with production-specific approval

Do not assume the approved dev import also authorizes production data insertion. Reuse the reviewed
payload only after the user confirms production import. Use a production-specific idempotency key.

### Step 5: Verify production route

- open the deployed `/lessons`;
- confirm the bottom GNB route;
- open the book and representative Days;
- inspect runtime logs for 500/schema/RLS errors;
- verify owner-only access.

### Step 6: Complete the PRD only after the agreed rollout boundary

Move the active folder to complete and update `future-work.md` with:

- all changed files;
- dev and production migration status;
- exact verification commands;
- live route URLs;
- content import status;
- any remaining risks.

Commit:

```bash
git add docs/prd
git commit -m "Close the WCT library after verified rollout" \
  -m "Constraint: PRD completion requires the agreed database and live-route boundary to be verified
Confidence: high
Scope-risk: narrow
Directive: Future WCT memorization or Topic work requires a new PRD
Tested: Recorded in docs/prd/complete/wct-course-library/test-spec.md
Not-tested: Any explicitly deferred environment is listed in the completion record"
```

---

## Final verification matrix

| Claim | Required proof |
|---|---|
| WCT is separate from expressions | Dedicated `lib/wct*` store/types and expression regression tests |
| WCT is private | Static SQL test, executable `verify:rls`, hosted authenticated smoke |
| Learner UI is read-only | No mutation grants/policies, component assertions, Playwright absence checks |
| Duplicate handling is explicit | Validation, preflight API, memory store tests, RPC tests |
| Imports are atomic/idempotent | Memory tests, PostgreSQL RPC executable tests, receipt query |
| Topics are excluded | Strict schema, OCR boundary at page 127, component/E2E absence assertions |
| Raw scans are not stored | Schema has no raw OCR/blob fields; API source test; temporary-file cleanup |
| Legacy data removal is surgical | Drop migration names only three tables; `ingestion_runs` regression checks |
| User path works | GNB Playwright flow and healthy live `/lessons` route |
| Dev/main boundaries are respected | Status output shows expected ref before each apply |

## Overcomplication check

Before finalizing implementation:

- keep one WCT store contract;
- keep one transactional import RPC;
- do not add a repository/service/use-case layer beyond the store;
- do not add a dependency for stable JSON or normalization;
- do not add in-app OCR/upload controls;
- do not generalize WCT into a course platform;
- delete compatibility code only when it is actually unused and covered;
- leave expression and memorization behavior unchanged.
