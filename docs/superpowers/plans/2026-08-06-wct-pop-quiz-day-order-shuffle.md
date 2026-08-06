# WCT Pop Quiz Day Order Shuffle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shuffle the persisted Day order for every newly created v2 WCT Pop Quiz attempt and retake while preserving exact resume order, complete 16/28-Day coverage, and every existing per-Day question/format rotation guarantee.

**Architecture:** Keep canonical ascending Days for inventory, source, and band validation, then derive a deterministic display permutation from the existing attempt seed and Day ID inside the v2 selector. Persist that selected array as the sole display/scoring order, validate v2 snapshots by exact Day coverage rather than array position, and leave v1 selection and positional validation unchanged. The existing Supabase RPC is order-independent, so this is a code-and-test release with no schema or production data migration.

**Tech Stack:** TypeScript, Next.js App Router/server actions, Vitest, Playwright mobile Chromium, Supabase PostgreSQL RPC/RLS verification, Node `crypto.createHash`.

## Global Constraints

- Apply Day-order shuffling only to current `wct-review-v2` Prenovice and Novice Pop Quiz attempts.
- A first v2 attempt must not retain the complete canonical ascending sequence; rotate once if the seeded permutation matches it.
- A v2 retake must have a different Day-ID sequence from the immediately previous attempt; rotate once if the seeded permutation matches it.
- Compare retake question ID and format by Day ID, never by array index.
- Refresh/resume must render the stored array unchanged from its persisted `currentIndex`.
- Keep exactly one unique current Day in every attempt: 16 Prenovice, 28 Novice, including non-contiguous production Novice Day numbers.
- Keep canonical `early`/`middle`/`late` bands based on ascending Day position, not shuffled display position.
- Preserve v1 selector retry seeds, ascending order, positional snapshot validation, and restart-required behavior.
- Do not change Premium, standard Day quizzes, lesson content, feedback timing, totals, scoring, schema, or production WCT data.
- Follow TDD: observe each targeted test fail for the intended reason before implementation.
- Before completion, satisfy the project gate: lint, typecheck, focused tests, full tests, build, RLS verification, mobile E2E, live localhost/LAN route checks, exact deployment status, and clean `main`/`origin/main` state.

---

## File Map

- `lib/wct/pop-quiz/selector.ts`: derive deterministic v2 Day permutations and retain per-Day format/question rotation.
- `lib/wct/pop-quiz/service.ts`: accept shuffled v2 snapshots through exact order-independent coverage checks while preserving v1 positional checks.
- `tests/unit/wct-pop-quiz-selector.test.ts`: pin seeded stability, non-ascending first attempts, 16/28 coverage, fallback rotation, retake order changes, and v1 preservation.
- `tests/unit/wct-pop-quiz-service.test.ts`: pin shuffled v2 resume and ordered-v1 rejection plus current malformed-snapshot failures.
- `scripts/verify-rls.sql`: exercise an order-changed v2 retake array through the real PostgreSQL RPC and assert exact persisted order.
- `e2e/wct-pop-quiz.spec.ts`: prove full shuffled 16/28 journeys, resume stability, and retake order/question/format changes.
- `docs/prd/active/wct-pop-quiz-day-order-shuffle/`: T-012 active PRD, test spec, README, and canonical-plan pointer during implementation.
- `docs/prd/future-work.md`, `docs/prd/README.md`: lifecycle tracker/index updates at activation and completion.

---

### Task 1: Activate T-012 and Pin the Delivery Contract

**Files:**
- Create: `docs/prd/active/wct-pop-quiz-day-order-shuffle/README.md`
- Create: `docs/prd/active/wct-pop-quiz-day-order-shuffle/prd.md`
- Create: `docs/prd/active/wct-pop-quiz-day-order-shuffle/test-spec.md`
- Create: `docs/prd/active/wct-pop-quiz-day-order-shuffle/implementation-plan.md`
- Modify: `docs/prd/future-work.md:108`
- Modify: `docs/prd/README.md:19-50`

**Interfaces:**
- Consumes: approved design `docs/superpowers/specs/2026-08-06-wct-pop-quiz-day-order-shuffle-design.md` and this canonical plan.
- Produces: active tracker item `T-012` and lifecycle artifacts used for final completion evidence.

- [ ] **Step 1: Create the active feature artifacts**

Use these exact status and contract points across the four files:

```markdown
# WCT Pop Quiz Day Order Shuffle

- Status: Active
- Tracker: `docs/prd/future-work.md#t-012-wct-pop-quiz-day-order-shuffle`
- Approved design: `docs/superpowers/specs/2026-08-06-wct-pop-quiz-day-order-shuffle-design.md`
- Canonical plan: `docs/superpowers/plans/2026-08-06-wct-pop-quiz-day-order-shuffle.md`

Acceptance:
- [ ] New v2 16/28-Day attempts contain every Day once in a non-canonical seeded order.
- [ ] A v2 retake changes Day order plus every Day's question ID and format.
- [ ] Resume preserves the stored order; v1 and Premium behavior stay unchanged.
- [ ] Local live routes, mobile E2E, RLS, build, and production deployment checks pass.
```

`implementation-plan.md` must point to this canonical plan rather than duplicating it.

- [ ] **Step 2: Add T-012 under `## Active` and update the PRD index**

Record this exact surface classification and non-goal:

```markdown
- Surface classification: mixed selection logic/server action/persistence validation/UI flow => runtime-facing.
- Non-goals: schema/data migration, Premium, standard Day quiz, lesson content, feedback copy/timing, scoring, and v1 behavior changes.
```

Keep `Active` limited to T-012 and map the feature folder to `active/` in `docs/prd/README.md`.

- [ ] **Step 3: Verify lifecycle links and formatting**

Run:

```bash
rg -n "T-012|wct-pop-quiz-day-order-shuffle" docs/prd/future-work.md docs/prd/README.md docs/prd/active/wct-pop-quiz-day-order-shuffle
git diff --check
```

Expected: all artifact links use `active/wct-pop-quiz-day-order-shuffle`; `git diff --check` exits 0.

- [ ] **Step 4: Commit the active lifecycle state**

```bash
git add docs/prd/active/wct-pop-quiz-day-order-shuffle docs/prd/future-work.md docs/prd/README.md
git commit -m "docs: activate WCT Pop Quiz Day shuffle"
```

---

### Task 2: Implement Deterministic v2 Day Permutations

**Files:**
- Modify: `tests/unit/wct-pop-quiz-selector.test.ts:171-294`
- Modify: `lib/wct/pop-quiz/selector.ts:15-147`

**Interfaces:**
- Consumes: `WctPopQuizSelectionInput`, canonical `orderedDays(input)`, current `previousQuestions`, and existing `nextWctQuizFormat()`/candidate `rank()` behavior.
- Produces: private `dayRank(seed, day)`, `rotateOnce(items)`, and `shuffledV2Days(input, canonicalDays)` helpers; `selectV2()` returns questions in persisted shuffled Day order.

- [ ] **Step 1: Replace ordered-v2 expectations with failing shuffle tests**

Add a small helper and change the existing 16/28 assertions:

```ts
function dayNumbers(items: Array<{ dayNumber: number }>) {
  return items.map((item) => item.dayNumber);
}

const canonical = Array.from({ length: dayCount }, (_, index) => index + 1);
expect([...dayNumbers(selected)].sort((left, right) => left - right)).toEqual(canonical);
expect(dayNumbers(selected)).not.toEqual(canonical);
expect(formatCounts(selected).sort((left, right) => left - right)).toEqual(expectedCounts);

const earlyLength = Math.ceil(dayCount / 3);
const middleLength = Math.ceil((dayCount - earlyLength) / 2);
const canonicalIndexByDayId = new Map(book.days.map((day, index) => [day.id, index]));
for (const item of selected) {
  const index = canonicalIndexByDayId.get(item.dayId)!;
  const expectedBand = index < earlyLength
    ? "early"
    : index < earlyLength + middleLength ? "middle" : "late";
  expect(item.band).toBe(expectedBand);
}
```

For production Novice, assert sorted coverage rather than display order:

```ts
expect([...dayNumbers(selected)].sort((left, right) => left - right))
  .toEqual([...productionNoviceDays]);
expect(dayNumbers(selected)).not.toEqual([...productionNoviceDays]);
```

Add the canonical fallback regression using the two-Day hash fixture:

```ts
it("rotates a first v2 attempt when the seeded order equals canonical order", () => {
  const book = createBook(2);
  const selected = selectWctPopQuizQuestions({
    book,
    candidates: createV2Candidates(book),
    seed: "fallback-seed-1",
    sourceVersion: "wct-review-v2",
    previousQuestions: null
  });

  expect(dayNumbers(selected)).toEqual([2, 1]);
});
```

Update the retake test to compare by Day ID and assert order differs:

```ts
const firstByDay = new Map(first.map((item) => [item.dayId, item]));
expect(next.map((item) => item.dayId)).not.toEqual(first.map((item) => item.dayId));
for (const item of next) {
  const previous = firstByDay.get(item.dayId)!;
  expect(item.question.id).not.toBe(previous.question.id);
  expect(item.question.format).toBe(nextWctQuizFormat(previous.question.format!));
}
```

Add the retake fallback regression with a valid prior snapshot forced into the
raw order produced by `fallback-seed-1`:

```ts
it("rotates a v2 retake when its seeded order equals the previous order", () => {
  const book = createBook(2);
  const candidates = createV2Candidates(book);
  const previousQuestions = selectWctPopQuizQuestions({
    book,
    candidates,
    seed: "first-attempt-seed",
    sourceVersion: "wct-review-v2",
    previousQuestions: null
  }).sort((left, right) => left.dayNumber - right.dayNumber);
  const next = selectWctPopQuizQuestions({
    book,
    candidates,
    seed: "fallback-seed-1",
    sourceVersion: "wct-review-v2",
    previousQuestions
  });

  expect(dayNumbers(previousQuestions)).toEqual([1, 2]);
  expect(dayNumbers(next)).toEqual([2, 1]);
  const previousByDay = new Map(previousQuestions.map((item) => [item.dayId, item]));
  for (const item of next) {
    const previous = previousByDay.get(item.dayId)!;
    expect(item.question.id).not.toBe(previous.question.id);
    expect(item.question.format).toBe(nextWctQuizFormat(previous.question.format!));
  }
});
```

- [ ] **Step 2: Run the selector test and observe the intended failures**

Run:

```bash
npm test -- tests/unit/wct-pop-quiz-selector.test.ts
```

Expected: v2 first-attempt tests fail because output is still ascending; retake order assertion fails. Existing v1 tests remain green.

- [ ] **Step 3: Add the minimal deterministic permutation helpers**

Add these private helpers to `selector.ts`:

```ts
function dayRank(seed: string, day: WctDaySummary) {
  return createHash("sha256")
    .update(`${seed}\0day\0${day.id}`)
    .digest("hex");
}

function rotateOnce<T>(items: T[]) {
  return items.length < 2 ? [...items] : [...items.slice(1), items[0]!];
}

function shuffledV2Days(
  input: WctPopQuizSelectionInput,
  canonicalDays: WctDaySummary[]
) {
  let shuffled = [...canonicalDays].sort((left, right) => (
    dayRank(input.seed, left).localeCompare(dayRank(input.seed, right))
  ));
  const blockedDayIds = input.previousQuestions
    ? input.previousQuestions.map((item) => item.dayId)
    : canonicalDays.map((day) => day.id);
  if (shuffled.every((day, index) => day.id === blockedDayIds[index])) {
    shuffled = rotateOnce(shuffled);
  }
  return shuffled;
}
```

Keep `orderedDays(input)` and `buildBandByDayId()` unchanged. In `selectV2()` validate previous questions against `canonicalDays`, derive `days = shuffledV2Days(input, canonicalDays)`, then map the shuffled `days`. Keep first-attempt format assignment indexed by shuffled position and retake assignment from `previousByDayId`.

- [ ] **Step 4: Run selector and legacy regression tests**

Run:

```bash
npm test -- tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-validation.test.ts
```

Expected: all tests pass; v1 order and whole-signature retry behavior remain unchanged.

- [ ] **Step 5: Commit the selector slice**

```bash
git add lib/wct/pop-quiz/selector.ts tests/unit/wct-pop-quiz-selector.test.ts
git commit -m "feat: shuffle WCT Pop Quiz Days"
```

---

### Task 3: Validate Shuffled v2 Snapshots Without Relaxing v1

**Files:**
- Modify: `tests/unit/wct-pop-quiz-service.test.ts:273-499`
- Modify: `lib/wct/pop-quiz/service.ts:164-205`

**Interfaces:**
- Consumes: `CurrentInventory.sourceVersion`, the persisted `WctPopQuizAttempt.questions` array, canonical `book.days`, and current source `inventory.sets`.
- Produces: `validateAttemptSnapshot()` accepts any exact current v2 Day permutation but retains canonical positional validation for v1.

- [ ] **Step 1: Write failing v2 resume and v1 preservation tests**

Replace `out-of-order Days` in the malformed-v2 rejection table with a positive test:

```ts
it("resumes a complete current v2 snapshot in its persisted shuffled order", async () => {
  const book = createBook();
  const days = createFullDays(book);
  const sets = createV2Sets(book, days);
  const existing = attempt(book, sets);
  existing.questions = [...existing.questions].reverse();
  const deps = stores(book, days, sets);
  const { startWctPopQuiz } = await service();

  await expect(startWctPopQuiz({
    ...deps,
    wctPopQuizStore: {
      getAttempt: vi.fn().mockResolvedValue(existing),
      startAttempt: vi.fn()
    }
  }, { bookId: book.id, mode: "start" })).resolves.toEqual(existing);
});
```

Add a v1 positional regression:

```ts
it("keeps positional validation for a reordered current v1 snapshot", async () => {
  const book = createBook();
  const days = createFullDays(book);
  const sets = createV1Sets(book, days);
  const existing = attempt(book, sets);
  existing.questions = [...existing.questions].reverse();
  const deps = stores(book, days, sets);
  const { startWctPopQuiz } = await service();

  await expect(startWctPopQuiz({
    ...deps,
    wctPopQuizStore: {
      getAttempt: vi.fn().mockResolvedValue(existing),
      startAttempt: vi.fn()
    }
  }, { bookId: book.id, mode: "start" }))
    .rejects.toBeInstanceOf(WctPopQuizRestartRequiredError);
});
```

- [ ] **Step 2: Run the service test and observe the v2 failure**

Run:

```bash
npm test -- tests/unit/wct-pop-quiz-service.test.ts
```

Expected: shuffled v2 resume fails with `WctPopQuizRestartRequiredError`; the new v1 rejection already passes.

- [ ] **Step 3: Make positional checking version-specific**

Refactor only the structural condition in `validateAttemptSnapshot()`:

```ts
const hasInvalidCanonicalPosition = inventory.sourceVersion === "wct-review-v1"
  && attempt.questions.some((item, index) => (
    item.dayId !== orderedDays[index].id
    || item.dayNumber !== orderedDays[index].dayNumber
    || item.dayTopic !== orderedDays[index].shortLabel
  ));
if (
  attempt.questions.length !== orderedDays.length
  || new Set(dayIds).size !== orderedDays.length
  || new Set(dayNumbers).size !== orderedDays.length
  || hasInvalidCanonicalPosition
) {
  throw new WctPopQuizRestartRequiredError();
}
```

Keep the existing `dayById`/`setById` loop unchanged; it supplies v2 exact coverage and validates Day number, label, topic, source set, source ID, and immutable question payload independently of array position.

- [ ] **Step 4: Run selector/service/action regressions**

Run:

```bash
npm test -- tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-actions.test.ts
```

Expected: all tests pass, including malformed/duplicate/stale v2 rejection, shuffled v2 resume, and ordered-v1 enforcement.

- [ ] **Step 5: Commit the service slice**

```bash
git add lib/wct/pop-quiz/service.ts tests/unit/wct-pop-quiz-service.test.ts
git commit -m "fix: validate shuffled WCT Pop attempts"
```

---

### Task 4: Prove the Existing RPC Preserves Shuffled Order

**Files:**
- Modify: `scripts/verify-rls.sql:515-655`

**Interfaces:**
- Consumes: existing `start_wct_pop_quiz`, `confirm_wct_pop_quiz_answer`, and `complete_wct_pop_quiz` production-contract SQL.
- Produces: executable PostgreSQL regression showing a valid v2 retake array reordered by Day number descending is persisted exactly and remains scorable.

- [ ] **Step 1: Reorder only the valid retake after existing invalid assertions**

Immediately before the existing valid `v2-cycle` `start_wct_pop_quiz` call, add:

```sql
select jsonb_agg(item order by (item->>'dayNumber')::integer desc)
into v_cycle
from jsonb_array_elements(v_cycle) item;

if (v_cycle->0->>'dayNumber')::integer
  <= (v_cycle->(jsonb_array_length(v_cycle) - 1)->>'dayNumber')::integer then
  raise exception 'v2 Pop shuffled-order fixture was not descending';
end if;
```

Leave every malformed-retake `jsonb_set` assertion before this reorder so their fixed indexes retain current meanings. Keep the existing exact equality assertion after `start_wct_pop_quiz`:

```sql
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
```

Keep `perform set_config('test.wct_stale_pop_questions', v_cycle::text, false)`
after completion so the following stale-inventory reset check retains the
shuffled snapshot.

- [ ] **Step 2: Run the executable RLS/RPC verification**

Run:

```bash
npm run verify:rls
```

Expected: `WCT v2 Pop Quiz verification passed`, concurrency verification passed, and checkpoint-B success/rollback verification passed. No hosted database is touched.

- [ ] **Step 3: Commit the RPC regression**

```bash
git add scripts/verify-rls.sql
git commit -m "test: verify shuffled WCT Pop persistence"
```

---

### Task 5: Update the Full Mobile Pop Quiz Journey

**Files:**
- Modify: `e2e/wct-pop-quiz.spec.ts:77-193`

**Interfaces:**
- Consumes: memory-store seed routes, persisted Pop Quiz question arrays, Day metadata revealed after confirmation, and first/retake signature helpers.
- Produces: browser-level proof that Prenovice and Novice use complete shuffled orders, refresh preserves order, and retake changes order/question/format.

- [ ] **Step 1: Replace ascending assertions with complete shuffled coverage**

In the main journey, use:

```ts
const firstDayNumbers = firstSignature.map((question) => question.dayNumber);
const canonicalDayNumbers = Array.from({ length: total }, (_item, index) => index + 1);
expect([...firstDayNumbers].sort((left, right) => left - right)).toEqual(canonicalDayNumbers);
expect(firstDayNumbers).not.toEqual(canonicalDayNumbers);
```

After collecting the retake, add:

```ts
expect(retakeSignature.map((question) => question.dayId)).not.toEqual(wrongDayIds);
```

Retain the Day-ID map assertion that every question ID and format changed.

- [ ] **Step 2: Pin refresh/resume order before answering question 2**

After the current reload and `2 / total` assertion in `startAndCollectSignature()`, add:

```ts
const resumedQuestion = await currentQuestion(page, level);
await page.reload();
await expect(page.getByText(`2 / ${total}`, { exact: true })).toBeVisible();
expect((await currentQuestion(page, level)).id).toBe(resumedQuestion.id);
```

- [ ] **Step 3: Run mobile E2E and inspect the actual Day sequences**

Run:

```bash
npm run test:e2e -- e2e/wct-pop-quiz.spec.ts --project=mobile-chromium
```

Expected: 2/2 tests pass; both 16- and 28-question first orders are complete/non-canonical, refresh repeats question 2, and retake order differs.

- [ ] **Step 4: Commit the browser regression**

```bash
git add e2e/wct-pop-quiz.spec.ts
git commit -m "test: cover shuffled WCT Pop journeys"
```

---

### Task 6: Complete Verification, Lifecycle, and Production Deployment

**Files:**
- Move: `docs/prd/active/wct-pop-quiz-day-order-shuffle/` -> `docs/prd/complete/wct-pop-quiz-day-order-shuffle/`
- Modify: `docs/prd/complete/wct-pop-quiz-day-order-shuffle/README.md`
- Modify: `docs/prd/complete/wct-pop-quiz-day-order-shuffle/prd.md`
- Modify: `docs/prd/complete/wct-pop-quiz-day-order-shuffle/test-spec.md`
- Modify: `docs/prd/future-work.md`
- Modify: `docs/prd/README.md`

**Interfaces:**
- Consumes: all prior commits and their test evidence.
- Produces: completed T-012 record, clean synchronized `main`, exact Vercel deployment, and live route evidence.

- [ ] **Step 1: Run the complete command-level gate**

Run in this order:

```bash
npm run lint
npm run typecheck
npm test -- tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-actions.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/integration/memory-wct-pop-quiz-store.test.ts tests/components/wct-pop-quiz-runner.test.tsx
npm test
npm run build
npm run verify:rls
npm run test:e2e -- e2e/wct-pop-quiz.spec.ts --project=mobile-chromium
git diff --check
```

Expected: all commands exit 0. Record exact file/test counts, skipped tests, E2E duration, and any non-failing warnings.

- [ ] **Step 2: Run live localhost and LAN route checks**

Start or restart a fresh server after the build:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3001
```

Check:

```bash
curl -I http://127.0.0.1:3001/
curl -I http://127.0.0.1:3001/lessons/books/4a71e072-96de-4722-8874-c35b3ca97ec1/pop-quiz
curl -I http://127.0.0.1:3001/lessons/books/c4ab0760-3c31-4533-9631-0e2ead3bfe90/pop-quiz
curl -I http://172.22.48.149:3001/
curl -I http://172.22.48.149:3001/lessons/books/4a71e072-96de-4722-8874-c35b3ca97ec1/pop-quiz
```

Expected: roots return 200; unauthenticated WCT routes return the expected 307 login redirect. Scan the server output for `500`, `InternalServerError`, missing module/chunk, schema, and failed-action errors; all counts must be zero. The mobile E2E from Step 1 is the authenticated running-app proof of the shuffled behavior.

- [ ] **Step 3: Close T-012 only after every check passes**

Move the feature folder to `complete/`, set all acceptance boxes to `[x]`, move T-012 from `Active` to the top of `Complete`, and record:

```markdown
- Surface classification: mixed selection logic/server action/persistence validation/UI flow => runtime-facing.
- Changed files: selector, service, selector/service tests, RLS executable regression, mobile E2E, and T-012 lifecycle docs.
- Verification: exact commands/results from Steps 1-2.
- Database: no migration and no hosted data write.
- Remaining risks: none WCT-specific if all gates pass.
```

Update `docs/prd/README.md` from `active/` to `complete/`, then run `git diff --check` and verify no actionable `active/wct-pop-quiz-day-order-shuffle` reference remains outside historical plan text.

- [ ] **Step 4: Commit lifecycle completion**

```bash
git add -A -- docs/prd/active/wct-pop-quiz-day-order-shuffle docs/prd/complete/wct-pop-quiz-day-order-shuffle docs/prd/future-work.md docs/prd/README.md
git commit -m "docs: complete WCT Pop Quiz Day shuffle"
```

- [ ] **Step 5: Review the final range before push**

Run:

```bash
git status --short --branch
git log --oneline --decorate -8
git diff origin/main..HEAD --check
git diff --stat origin/main..HEAD
```

Expected: only T-012/spec/plan implementation commits are ahead of `origin/main`; no unrelated local changes are present.

- [ ] **Step 6: Push `main` and wait for the exact Vercel commit**

State the handoff explicitly: source branch/worktree is `main` at `/home/ubuntu/code/english_app`; target is `origin/main`.

```bash
gh auth switch --user ParkSeryu
git push origin main
release_commit=$(git rev-parse HEAD)
gh api "repos/ParkSeryu/english_app/commits/${release_commit}/status"
gh auth switch --user jh-park-alt
```

Print and record `release_commit` before invoking `gh api`. Wait until the Vercel context reports `success`; a pending status is not completion.

- [ ] **Step 7: Smoke the deployed routes and confirm repository state**

Run:

```bash
curl -I https://english-phi-drab.vercel.app/
curl -I https://english-phi-drab.vercel.app/lessons/books/4a71e072-96de-4722-8874-c35b3ca97ec1/pop-quiz
curl -I https://english-phi-drab.vercel.app/lessons/books/c4ab0760-3c31-4533-9631-0e2ead3bfe90/pop-quiz
git status --short --branch
```

Expected: production root 200, both unauthenticated Pop routes expected 307 to login, `main...origin/main` with a clean worktree. Do not create production quiz progress for this code-only release; an authenticated production mutation would require a separate explicit production-write confirmation.
