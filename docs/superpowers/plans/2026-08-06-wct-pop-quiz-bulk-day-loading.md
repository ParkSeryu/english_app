# WCT Pop Quiz Bulk Day Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 16/28 per-Day reads in each WCT Pop Quiz inventory validation with one bulk read while preserving every existing quiz rule and persisted behavior.

**Architecture:** Add one unordered `getDays(dayIds)` operation to the existing WCT store boundary, implement it with a single Supabase `IN` query and an ownership-safe memory scan, then normalize the returned rows back to canonical book-summary order inside the Pop Quiz service before running its current validation. Keep `getDay()`, the two inventory validation points, all selector logic, and all database contracts unchanged.

**Tech Stack:** TypeScript, Next.js App Router/server actions, Vitest, Playwright mobile Chromium, Supabase JS/PostgREST, local PostgreSQL RLS verification, Vercel deployment status.

## Global Constraints

- Add exactly `getDays(dayIds: string[]): Promise<WctDay[]>` to `WctStore`; keep `getDay()` unchanged for existing consumers.
- The bulk result order is unspecified; the Pop Quiz service must reconstruct canonical book-summary order by Day ID.
- Empty bulk input returns `[]` without opening a Supabase query.
- Unknown or unauthorized IDs are omitted; missing, duplicate, foreign, or summary-mismatched Days still fail closed before attempt mutation.
- Preserve question content, format distribution, Day-order shuffling, retakes, resume, totals, feedback, scoring, stored attempts, v1 compatibility, standard Day quizzes, and Premium.
- Do not remove duplicate action/page inventory validation, add caching/loading UI/RPC/dependencies, or change schema or production data.
- Follow TDD: observe every focused regression fail for the intended missing behavior before implementing it.
- Before completion, run lint, typecheck, focused tests, full tests, build, local RLS verification, mobile Pop E2E, live localhost/LAN route checks, exact deployment status, and clean `main`/`origin/main` checks.

---

## File Map

- `lib/wct-store/contract.ts`: expose the new bulk full-Day read.
- `lib/wct-store/memory-store.ts`: return owned matching full Days as defensive clones.
- `lib/wct-store/supabase-store.ts`: share the full-Day projection and issue one `.in("id", dayIds)` query.
- `lib/wct/pop-quiz/service.ts`: replace N `getDay()` calls with one `getDays()` call and canonical ID remapping.
- `tests/unit/wct-supabase-store.test.ts`: pin the one-query and empty-input Supabase contracts plus full mapping.
- `tests/integration/memory-wct-store.test.ts`: pin ownership, missing-ID omission, and clone behavior for bulk reads.
- `tests/unit/wct-pop-quiz-service.test.ts`: pin one bulk call per inventory preparation, unordered-result normalization, and fail-closed behavior.
- `docs/prd/active/wct-pop-quiz-bulk-day-loading/`: T-013 lifecycle artifacts during implementation.
- `docs/prd/future-work.md`, `docs/prd/README.md`: active and completed lifecycle evidence.

---

### Task 1: Activate T-013 and Pin the Delivery Contract

**Files:**
- Create: `docs/prd/active/wct-pop-quiz-bulk-day-loading/README.md`
- Create: `docs/prd/active/wct-pop-quiz-bulk-day-loading/prd.md`
- Create: `docs/prd/active/wct-pop-quiz-bulk-day-loading/test-spec.md`
- Create: `docs/prd/active/wct-pop-quiz-bulk-day-loading/implementation-plan.md`
- Modify: `docs/prd/future-work.md:108`
- Modify: `docs/prd/README.md:19-48`

**Interfaces:**
- Consumes: approved design `docs/superpowers/specs/2026-08-06-wct-pop-quiz-bulk-day-loading-design.md` and this canonical plan.
- Produces: active tracker item `T-013` and lifecycle artifacts that carry the exact runtime scope and final evidence.

- [ ] **Step 1: Create the active feature artifacts**

Use this contract in the README, PRD, and test spec; make `implementation-plan.md` point to this canonical plan instead of copying it:

```markdown
# WCT Pop Quiz Bulk Day Loading

- Status: Active
- Tracker: `docs/prd/future-work.md#t-013-wct-pop-quiz-bulk-day-loading`
- Approved design: `docs/superpowers/specs/2026-08-06-wct-pop-quiz-bulk-day-loading-design.md`
- Canonical plan: `docs/superpowers/plans/2026-08-06-wct-pop-quiz-bulk-day-loading.md`

Acceptance:
- [ ] Every Pop inventory validation uses one bulk full-Day store read instead of 16/28 single-Day reads.
- [ ] Unordered bulk rows are normalized to canonical Day-summary order before existing source validation.
- [ ] Missing, duplicate, foreign, mismatched, and stale inventory still fails closed before attempt mutation.
- [ ] Existing shuffle, resume, retake, persistence, scoring, v1, standard Day quiz, and Premium behavior remains unchanged.
- [ ] Full verification, live routes, exact production deployment, and clean main synchronization pass.
```

- [ ] **Step 2: Add T-013 under `## Active` and update the index**

Record this exact classification and non-goal:

```markdown
- Surface classification: shared store/server-action/dynamic-route loading path => runtime-facing.
- Non-goals: UI/copy, selector rules, persistence/RPC, schema/migration, production data, standard Day quiz, and Premium changes.
```

Keep `Active` limited to T-013 and add its `active/` row and folder tree entry to `docs/prd/README.md`.

- [ ] **Step 3: Verify lifecycle links and formatting**

Run:

```bash
rg -n "T-013|wct-pop-quiz-bulk-day-loading" docs/prd/future-work.md docs/prd/README.md docs/prd/active/wct-pop-quiz-bulk-day-loading
git diff --check
```

Expected: every new lifecycle link points to the active folder or approved design/plan, and `git diff --check` exits 0.

- [ ] **Step 4: Commit the active lifecycle state**

```bash
git add docs/prd/active/wct-pop-quiz-bulk-day-loading docs/prd/future-work.md docs/prd/README.md
git commit -m "docs: activate WCT Pop Quiz bulk loading"
```

---

### Task 2: Add the Bulk WCT Day Store Operation

**Files:**
- Create: `tests/unit/wct-supabase-store.test.ts`
- Modify: `tests/integration/memory-wct-store.test.ts:46-162`
- Modify: `lib/wct-store/contract.ts:14-21`
- Modify: `lib/wct-store/memory-store.ts:55-84`
- Modify: `lib/wct-store/supabase-store.ts:24-78`

**Interfaces:**
- Consumes: existing `WctDay`, `mapWctDay()`, child sorting, memory owner filtering, and the exact full-Day Supabase projection used by `getDay()`.
- Produces: `WctStore.getDays(dayIds: string[]): Promise<WctDay[]>`, with unordered unique stored rows, unknown-ID omission, empty-input short circuit, and unchanged query error text.

- [ ] **Step 1: Write failing Supabase boundary tests**

Create `tests/unit/wct-supabase-store.test.ts` with one complete row fixture and these behaviors:

```ts
import { describe, expect, it, vi } from "vitest";

import { SupabaseWctStore } from "@/lib/wct-store/supabase-store";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const DAY_IDS = ["day-2", "day-1"];

const fullDayRow = {
  id: "day-1",
  book_id: "book-1",
  day_number: 1,
  short_label: "Topic 1",
  learning_summary: null,
  source_page_start: null,
  source_page_end: null,
  source_needs_review: false,
  wct_day_concepts: [{
    id: "concept-1", text: "Concept 1", source_kind: "book", sort_order: 0
  }],
  wct_patterns: [{
    id: "pattern-1",
    pattern_text: "I can + verb",
    meaning_ko: "할 수 있다",
    usage_note: null,
    usage_source: "book",
    source_page: null,
    source_needs_review: false,
    sort_order: 0,
    wct_examples: [{
      id: "example-1",
      english_text: "I can swim.",
      meaning_ko: "나는 수영할 수 있다.",
      source_page: null,
      source_needs_review: false,
      sort_order: 0
    }]
  }],
  wct_important_notes: [{
    id: "note-1", pattern_id: "pattern-1", note_text: "Use a base verb.",
    source_page: null, sort_order: 0
  }],
  wct_practice_prompts: [{
    id: "prompt-1", pattern_id: "pattern-1", prompt_text: "나는 수영할 수 있다.",
    meaning_ko: null, source_page: null, sort_order: 0
  }]
};

describe("SupabaseWctStore bulk Day reads", () => {
  it("returns empty input without opening a query", async () => {
    const createClient = vi.fn();
    const store = new SupabaseWctStore({ id: USER_ID }, createClient as never);

    await expect(store.getDays([])).resolves.toEqual([]);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("loads and maps all requested Days through one IN query", async () => {
    const inFilter = vi.fn().mockResolvedValue({ data: [fullDayRow], error: null });
    const select = vi.fn().mockReturnValue({ in: inFilter });
    const from = vi.fn().mockReturnValue({ select });
    const store = new SupabaseWctStore(
      { id: USER_ID },
      () => ({ from } as never)
    );

    await expect(store.getDays(DAY_IDS)).resolves.toEqual([
      expect.objectContaining({
        id: "day-1",
        bookId: "book-1",
        dayNumber: 1,
        concepts: [expect.objectContaining({ id: "concept-1" })],
        patterns: [expect.objectContaining({
          id: "pattern-1",
          examples: [expect.objectContaining({ id: "example-1" })]
        })],
        importantNotes: [expect.objectContaining({ id: "note-1" })],
        practicePrompts: [expect.objectContaining({ id: "prompt-1" })]
      })
    ]);
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("wct_days");
    expect(select).toHaveBeenCalledTimes(1);
    expect(inFilter).toHaveBeenCalledTimes(1);
    expect(inFilter).toHaveBeenCalledWith("id", DAY_IDS);
  });

  it("keeps the existing WCT Day query error contract", async () => {
    const inFilter = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "database unavailable" }
    });
    const store = new SupabaseWctStore(
      { id: USER_ID },
      () => ({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ in: inFilter })
        })
      } as never)
    );

    await expect(store.getDays(DAY_IDS))
      .rejects.toThrow("WCT Day query failed: database unavailable");
  });
});
```

The query assertions are part of this performance boundary: replacing the one
`IN` call with per-ID requests must make the test fail.

- [ ] **Step 2: Write the failing memory-store behavior test**

Add a two-Day import fixture inside `tests/integration/memory-wct-store.test.ts`,
then assert owned matching rows, unknown/foreign omission, and a defensive clone:

```ts
it("bulk-loads only owned matching Days as defensive clones", async () => {
  const input = importInput({ idempotencyKey: "bulk" });
  input.days.push({
    ...structuredClone(input.days[0]),
    dayNumber: 2,
    shortLabel: "가정법",
    duplicateAction: "create"
  });
  const ownerA = new MemoryWctStore({ id: USER_A });
  const ownerB = new MemoryWctStore({ id: USER_B });
  const inserted = await ownerA.importApprovedBatch(input);
  const requestedIds = inserted.operations.map((item) => item.dayId).reverse();

  const loaded = await ownerA.getDays([...requestedIds, "missing-day"]);

  expect(loaded.map((day) => day.id).sort()).toEqual([...requestedIds].sort());
  expect(await ownerB.getDays(requestedIds)).toEqual([]);
  loaded[0].patterns[0].patternText = "mutated test value";
  expect((await ownerA.getDays([loaded[0].id]))[0].patterns[0].patternText)
    .not.toBe("mutated test value");
});
```

- [ ] **Step 3: Run the focused tests and observe the intended missing-method failures**

Run:

```bash
npm test -- tests/unit/wct-supabase-store.test.ts tests/integration/memory-wct-store.test.ts
```

Expected: the new cases fail because `getDays` does not exist; existing memory-store cases stay green.

- [ ] **Step 4: Implement the minimal contract and memory method**

Add to `WctStore`:

```ts
getDays(dayIds: string[]): Promise<WctDay[]>;
```

Add to `MemoryWctStore`:

```ts
async getDays(dayIds: string[]): Promise<WctDay[]> {
  if (dayIds.length === 0) return [];
  const requested = new Set(dayIds);
  return [...getState().books.values()]
    .filter((book) => book.ownerId === this.user.id)
    .flatMap((book) => book.days)
    .filter((day) => requested.has(day.id))
    .map((day) => clone(sortDayChildren(day)));
}
```

- [ ] **Step 5: Implement one Supabase bulk query and reuse the projection**

Extract the existing `getDay()` projection to `DAY_SELECT`, keep `getDay()` on
`.eq(...).maybeSingle()`, and add:

```ts
async getDays(dayIds: string[]): Promise<WctDay[]> {
  if (dayIds.length === 0) return [];
  const { data, error } = await (await this.client())
    .from("wct_days")
    .select(DAY_SELECT)
    .in("id", dayIds);
  if (error) throw new Error(`WCT Day query failed: ${error.message}`);
  return (data ?? []).map((row) => mapWctDay(row));
}
```

- [ ] **Step 6: Run the store tests and typecheck**

Run:

```bash
npm test -- tests/unit/wct-supabase-store.test.ts tests/integration/memory-wct-store.test.ts
npm run typecheck
```

Expected: all focused tests pass and both store implementations satisfy the expanded interface.

- [ ] **Step 7: Commit the store boundary slice**

```bash
git add lib/wct-store/contract.ts lib/wct-store/memory-store.ts lib/wct-store/supabase-store.ts tests/unit/wct-supabase-store.test.ts tests/integration/memory-wct-store.test.ts
git commit -m "perf: batch WCT Day reads"
```

---

### Task 3: Use One Bulk Day Read Per Pop Inventory Validation

**Files:**
- Modify: `tests/unit/wct-pop-quiz-service.test.ts:195-290,603-675`
- Modify: `lib/wct/pop-quiz/service.ts:31-34,76-105`

**Interfaces:**
- Consumes: `WctStore.getDays(dayIds)`, canonical sorted `book.days`, and all current full-Day/quiz-set validation.
- Produces: `prepareCurrentInventory()` performs one bulk Day-store operation, tolerates arbitrary return order, and retains the exact downstream `allDays` canonical order.

- [ ] **Step 1: Make the service fixture expose both reads and return bulk rows in reverse order**

Change the test helper to:

```ts
function stores(book: WctBook, days: WctDay[], sets: WctQuizSet[]) {
  return {
    wctStore: {
      getBook: vi.fn().mockResolvedValue(book),
      getDay: vi.fn(async (dayId: string) => days.find((day) => day.id === dayId) ?? null),
      getDays: vi.fn(async (dayIds: string[]) => (
        dayIds
          .map((dayId) => days.find((day) => day.id === dayId))
          .filter((day): day is WctDay => Boolean(day))
          .reverse()
      ))
    },
    wctQuizStore: { listSetsByLessonKeys: vi.fn().mockResolvedValue(sets) }
  };
}
```

- [ ] **Step 2: Replace per-Day call-count expectations with the failing bulk boundary**

In the first-start and existing-attempt tests, assert:

```ts
expect(deps.wctStore.getDays).toHaveBeenCalledTimes(1);
expect(deps.wctStore.getDays).toHaveBeenCalledWith(book.days.map((day) => day.id));
expect(deps.wctStore.getDay).not.toHaveBeenCalled();
```

The first-start test must still reach `selectQuestions` successfully even though
`getDays()` returns reversed rows; its candidates must remain in canonical Day order:

```ts
expect(selectQuestions.mock.calls[0][0].candidates.map(
  (item: { dayId: string }) => item.dayId
)).toEqual(book.days.flatMap((day) => Array(5).fill(day.id)));
```

- [ ] **Step 3: Add a fail-closed duplicate bulk-row regression**

```ts
it("rejects duplicate bulk Day rows before attempt mutation", async () => {
  const book = createBook();
  const days = createFullDays(book);
  const sets = createV2Sets(book, days);
  const startAttempt = vi.fn();
  const deps = stores(book, days, sets);
  deps.wctStore.getDays.mockResolvedValue([
    ...days.slice(0, -1),
    structuredClone(days[0])
  ]);
  const { startWctPopQuiz } = await service();

  await expect(startWctPopQuiz({
    ...deps,
    wctPopQuizStore: { getAttempt: vi.fn().mockResolvedValue(null), startAttempt }
  }, { bookId: book.id, mode: "start" }))
    .rejects.toThrow("Pop Quiz needs one complete quiz version");
  expect(startAttempt).not.toHaveBeenCalled();
});
```

- [ ] **Step 4: Run the service test and observe the intended failure**

Run:

```bash
npm test -- tests/unit/wct-pop-quiz-service.test.ts
```

Expected: the bulk-call assertions fail because production still calls `getDay()` 16/28 times; the duplicate bulk-row test also fails because that response is not yet consumed.

- [ ] **Step 5: Replace the N calls with one canonicalized bulk read**

Change `InventoryDependencies` to `Pick<WctStore, "getBook" | "getDays">` and
replace the `Promise.all(getDay)` block with:

```ts
const loadedDays = await deps.wctStore.getDays(
  orderedSummaries.map((summary) => summary.id)
);
const dayById = new Map(loadedDays.map((day) => [day.id, day]));
if (
  loadedDays.length !== orderedSummaries.length
  || dayById.size !== orderedSummaries.length
) {
  return failIncompleteInventory();
}
const allDays = orderedSummaries.map((summary) => dayById.get(summary.id));
if (allDays.some((day) => !day)) return failIncompleteInventory();
const exactDays = allDays as WctDay[];
if (exactDays.some((day, index) => (
  day.id !== orderedSummaries[index].id
  || day.bookId !== book.id
  || day.dayNumber !== orderedSummaries[index].dayNumber
  || day.shortLabel !== orderedSummaries[index].shortLabel
  || day.displayLabel !== orderedSummaries[index].displayLabel
))) {
  return failIncompleteInventory();
}
```

Pass `day: exactDays[index]` and `allDays: exactDays` to
`isCurrentStandardWctQuizSet()` and leave every set/version/hash/schema/candidate
check unchanged.

In the ineligible-book table, replace the literal unused `getDay: vi.fn()` with
`getDays: vi.fn()` so the fixture satisfies the narrowed service dependency.

- [ ] **Step 6: Run focused Pop and store regressions**

Run:

```bash
npm test -- tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-actions.test.ts tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/unit/wct-supabase-store.test.ts tests/integration/memory-wct-store.test.ts tests/integration/memory-wct-pop-quiz-store.test.ts tests/components/wct-pop-quiz-runner.test.tsx
npm run typecheck
```

Expected: all focused tests pass; starts/resumes/retakes still validate exact
16/28-Day inventories while one inventory preparation calls `getDays()` once.

- [ ] **Step 7: Commit the Pop service slice**

```bash
git add lib/wct/pop-quiz/service.ts tests/unit/wct-pop-quiz-service.test.ts
git commit -m "perf: bulk-load WCT Pop Quiz Days"
```

---

### Task 4: Verify, Complete T-013, Integrate, and Deploy

**Files:**
- Move: `docs/prd/active/wct-pop-quiz-bulk-day-loading/` -> `docs/prd/complete/wct-pop-quiz-bulk-day-loading/`
- Modify: `docs/prd/complete/wct-pop-quiz-bulk-day-loading/README.md`
- Modify: `docs/prd/complete/wct-pop-quiz-bulk-day-loading/prd.md`
- Modify: `docs/prd/complete/wct-pop-quiz-bulk-day-loading/test-spec.md`
- Modify: `docs/prd/future-work.md`
- Modify: `docs/prd/README.md`

**Interfaces:**
- Consumes: Tasks 1-3, the exact feature-branch diff, project working gate, and production deployment status for the pushed commit.
- Produces: completed T-013 evidence, merged/pushed `main`, successful exact Vercel deployment, production route smoke, and removed temporary branch/worktree.

- [ ] **Step 1: Run the complete local verification gate**

Run in this order:

```bash
npm run lint
npm run typecheck
npm test -- tests/unit/wct-supabase-store.test.ts tests/integration/memory-wct-store.test.ts tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-actions.test.ts tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/integration/memory-wct-pop-quiz-store.test.ts tests/components/wct-pop-quiz-runner.test.tsx
npm test
npm run build
npm run verify:rls
npm run test:e2e -- e2e/wct-pop-quiz.spec.ts --project=mobile-chromium
git diff --check
```

Expected: every command exits 0. If `.next` changes while a dev server exists,
restart the server before live checks.

- [ ] **Step 2: Run a fresh live route smoke on an external bind**

Start a fresh production-configured app on an unused port with hostname
`0.0.0.0`, then check root and the exact current book routes:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3001/
curl -sS -D - -o /dev/null http://127.0.0.1:3001/lessons/books/64000000-0000-4000-8000-0000000000aa/pop
curl -sS -D - -o /dev/null http://127.0.0.1:3001/lessons/books/64000000-0000-4000-8000-0000000000bb/pop
```

Repeat against the reachable LAN/container IP. Expected: root 200; protected Pop
routes respond with their correct authentication redirect when unauthenticated;
server output contains no 500, `InternalServerError`, missing module/chunk, schema,
or failed server-action error.

- [ ] **Step 3: Complete the PRD lifecycle with exact evidence**

Move the active folder to `complete/`, move T-013 from `Active` to the top of
`Complete`, and record:

- every path from `git diff --name-only origin/main...HEAD` before the push;
- exact pass counts and exit results from Step 1;
- localhost/LAN URLs and HTTP results from Step 2;
- surface classification `shared store/server-action/dynamic-route loading path => runtime-facing`;
- `no schema/migration, hosted Supabase write, progress reset, or production data change`;
- remaining risk limited to the still-intentional second inventory validation on
  the redirected page.

Update `docs/prd/README.md` so T-013 and its folder appear only under `complete/`.

- [ ] **Step 4: Verify and commit completion evidence**

```bash
rg -n "T-013|wct-pop-quiz-bulk-day-loading" docs/prd/future-work.md docs/prd/README.md docs/prd/complete/wct-pop-quiz-bulk-day-loading
git diff --check
git add docs/prd/complete/wct-pop-quiz-bulk-day-loading docs/prd/future-work.md docs/prd/README.md
git commit -m "docs: complete WCT Pop Quiz bulk loading"
```

- [ ] **Step 5: Review the exact branch diff before integration**

```bash
git status --short --branch
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD
```

Expected: only the design/plan, T-013 lifecycle files, three store files, Pop
service, and their three focused test files are changed. Perform spec compliance
and code-quality review; resolve findings and rerun affected verification before
integration.

- [ ] **Step 6: Merge to target `main` and push**

State that the source is the isolated `codex/wct-pop-quiz-bulk-day-loading`
worktree/branch and the target is `main`. In the primary checkout:

```bash
git checkout main
git merge --ff-only codex/wct-pop-quiz-bulk-day-loading
git push origin main
```

Expected: fast-forward succeeds and local `main` equals `origin/main`.

- [ ] **Step 7: Verify the exact production deployment and routes**

Wait for the pushed `main` commit's GitHub/Vercel status until the Vercel context
is `success` with `Deployment has completed`. Then run:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://english-master.co.kr/
curl -sS -D - -o /dev/null https://english-master.co.kr/lessons/books/64000000-0000-4000-8000-0000000000aa/pop
curl -sS -D - -o /dev/null https://english-master.co.kr/lessons/books/64000000-0000-4000-8000-0000000000bb/pop
```

Expected: root 200; protected Pop routes return the expected login redirects;
the exact pushed commit has a successful completed deployment.

- [ ] **Step 8: Remove the integrated temporary worktree and branch**

After successful push and deployment, remove the linked worktree, delete the
merged local feature branch, and confirm:

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git worktree list
```

Expected: clean `main`, identical local/remote hashes, and no stale bulk-loading
worktree or feature branch.
