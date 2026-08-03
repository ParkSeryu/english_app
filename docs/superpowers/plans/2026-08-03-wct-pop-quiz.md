# WCT Pop Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add resumable, book-level 20-question Pop Quizzes for WCT Prenovice and Novice, sampled from existing Day quizzes with fixed content ratios and server-owned scoring.

**Architecture:** A pure selector samples a validated 20-question snapshot from the owner's immutable Day quiz sets. A dedicated owner/book progress store persists one current/latest attempt, and server actions start, confirm, and complete the attempt. The book page CTA and Pop Quiz runner consume those interfaces without changing the existing five-question Day quiz contract.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Zod, Supabase/PostgreSQL RLS and RPC, Vitest/Testing Library, Playwright

## Global Constraints

- Include only database-backed WCT Prenovice and Novice books; never render Pop Quiz for Premium.
- Every new attempt has exactly 20 unique questions: translation 12, pattern 8; early 7, middle 7, late 6; no more than 2 from one Day.
- Use existing owner-scoped Day quiz questions only; do not call an AI service or author new questions.
- Starting a retake must not return the exact same 20-question signature as the previous completed attempt.
- Refresh and route re-entry resume the current attempt; only an explicit retake creates a new sample.
- Confirm each answer before revealing feedback, persist before advancing, and calculate the final score on the server.
- Persist only the current/latest attempt and deduplicated incorrect-Day links; do not add attempt history.
- The sole hosted database is main/production Supabase `ccawzrrkxuirrwvaecvw`; do not apply its migration without a separate explicit production confirmation.
- Keep existing Day and Premium quiz behavior unchanged.

---

### Task 1: Activate the PRD and implement the constrained selector

**Files:**
- Create: `docs/prd/active/wct-pop-quiz/README.md`
- Create: `docs/prd/active/wct-pop-quiz/prd.md`
- Create: `docs/prd/active/wct-pop-quiz/test-spec.md`
- Modify: `docs/prd/future-work.md`
- Create: `lib/wct/pop-quiz/types.ts`
- Create: `lib/wct/pop-quiz/validation.ts`
- Create: `lib/wct/pop-quiz/selector.ts`
- Test: `tests/unit/wct-pop-quiz-selector.test.ts`

**Interfaces:**
- Consumes: `WctQuizQuestion` from `lib/wct/quiz/types.ts` and ordered `WctDaySummary` values.
- Produces: `selectWctPopQuizQuestions(input: WctPopQuizSelectionInput): WctPopQuizQuestion[]`, `wctPopQuizQuestionsSchema`, and shared Pop Quiz types.

- [ ] **Step 1: Move the tracked feature into Active before runtime work starts**

Create the three lifecycle files from the approved design and add an Active tracker entry containing this exact scope:

```markdown
### 2026-08-03 — WCT Pop Quiz

- Status: Active
- Surface: Prenovice/Novice book detail, Pop Quiz route, progress persistence
- Scope: 20 questions; translation 12/pattern 8; early 7/middle 7/late 6; max 2 per Day
- Non-goals: Premium, AI generation, attempt history, timers, rankings
- Design: `docs/superpowers/specs/2026-08-03-wct-pop-quiz-design.md`
- Plan: `docs/superpowers/plans/2026-08-03-wct-pop-quiz.md`
```

- [ ] **Step 2: Write failing selector tests**

Build fixtures with 16 Prenovice Days and assert exact invariants and explicit failure:

```ts
const selected = selectWctPopQuizQuestions({
  book,
  candidates,
  seed: "attempt-seed-a",
  previousSignature: null
});

expect(selected).toHaveLength(20);
expect(selected.filter((item) => item.question.kind === "translation"))
  .toHaveLength(12);
expect(selected.filter((item) => item.question.kind === "pattern"))
  .toHaveLength(8);
expect(countBy(selected, (item) => item.band)).toEqual({
  early: 7,
  middle: 7,
  late: 6
});
expect(Math.max(...Object.values(countBy(selected, (item) => item.dayId))))
  .toBeLessThanOrEqual(2);
expect(new Set(selected.map((item) => item.question.id)).size).toBe(20);
expect(() => selectWctPopQuizQuestions(insufficientInput))
  .toThrow("Pop Quiz needs 20 eligible questions");
```

Also assert the same seed is stable, different seeds produce different signatures, and `previousSignature` forces a resample when the first result matches it.

- [ ] **Step 3: Run the selector tests and verify RED**

Run: `npm test -- tests/unit/wct-pop-quiz-selector.test.ts`

Expected: FAIL because `@/lib/wct/pop-quiz/selector` does not exist.

- [ ] **Step 4: Define Pop Quiz types and validation**

Implement these public shapes:

```ts
export type WctPopQuizBand = "early" | "middle" | "late";

export type WctPopQuizCandidate = {
  sourceQuizSetId: string;
  dayId: string;
  dayNumber: number;
  dayLabel: string;
  question: WctQuizQuestion;
};

export type WctPopQuizQuestion = WctPopQuizCandidate & {
  band: WctPopQuizBand;
};

export type WctPopQuizSelectionInput = {
  book: WctBook;
  candidates: WctPopQuizCandidate[];
  seed: string;
  previousSignature: string | null;
};

export const WCT_POP_QUIZ_TOTAL = 20 as const;
export const WCT_POP_QUIZ_TYPE_QUOTA = { translation: 12, pattern: 8 } as const;
export const WCT_POP_QUIZ_BAND_QUOTA = { early: 7, middle: 7, late: 6 } as const;
```

The Zod schema must reject concept questions, duplicate question IDs, invalid choice/correct IDs, incorrect quotas, and more than two questions from one Day.

- [ ] **Step 5: Implement deterministic seeded sampling**

Partition ordered Days into three contiguous near-equal bands. Rank candidates with `sha256(seed + "\0" + sourceQuizSetId + "\0" + question.id)`, then use a bounded backtracking selection to satisfy band, type, uniqueness, and per-Day quotas together. Build the signature by sorting `sourceQuizSetId:question.id` values so a mere order change does not count as a new set. If the selected signature equals `previousSignature`, retry with `${seed}:1` through `${seed}:10`; throw after the tenth identical result.

Use this quota matrix so the global margins are exact:

```ts
const cellQuota = {
  early: { translation: 4, pattern: 3 },
  middle: { translation: 4, pattern: 3 },
  late: { translation: 4, pattern: 2 }
} as const;
```

- [ ] **Step 6: Run selector tests and commit**

Run: `npm test -- tests/unit/wct-pop-quiz-selector.test.ts`

Expected: PASS with all ratio, uniqueness, seed, retake, and failure assertions.

```bash
git add docs/prd/active/wct-pop-quiz docs/prd/future-work.md lib/wct/pop-quiz tests/unit/wct-pop-quiz-selector.test.ts
git commit -m "feat: add WCT Pop Quiz selector"
```

### Task 2: Add candidate lookup and an in-memory attempt store

**Files:**
- Modify: `lib/wct-quiz-store/contract.ts`
- Modify: `lib/wct-quiz-store/memory-store.ts`
- Modify: `lib/wct-quiz-store/supabase-store.ts`
- Modify: `lib/wct/pop-quiz/types.ts`
- Create: `lib/wct-pop-quiz-store/contract.ts`
- Create: `lib/wct-pop-quiz-store/memory-store.ts`
- Create: `lib/wct-pop-quiz-store/factory.ts`
- Create: `lib/wct-pop-quiz-store.ts`
- Test: `tests/integration/memory-wct-pop-quiz-store.test.ts`
- Test: `tests/integration/memory-wct-quiz-store.test.ts`

**Interfaces:**
- Consumes: validated `WctPopQuizQuestion[]` from Task 1 and current `UserIdentity`.
- Produces: `WctPopQuizStore`, `getWctPopQuizStore(user)`, and `WctQuizStore.listSetsByLessonKeys(keys)`.

- [ ] **Step 1: Write failing store and candidate-query tests**

Cover owner isolation, one record per owner/book, start/resume, idempotent confirmation, rejection of a changed repeated answer, completion, incorrect-Day de-duplication, and retake replacement:

```ts
const started = await ownerA.startAttempt({
  bookId: BOOK_ID,
  seed: "seed-a",
  questions
});
await ownerA.confirmAnswer({
  bookId: BOOK_ID,
  attemptId: started.attemptId,
  questionId: questions[0].question.id,
  choiceId: questions[0].question.choices[1].id
});
await expect(ownerA.getAttempt(BOOK_ID)).resolves.toMatchObject({
  currentIndex: 1,
  status: "in_progress"
});
await expect(ownerB.getAttempt(BOOK_ID)).resolves.toBeNull();
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- tests/integration/memory-wct-pop-quiz-store.test.ts tests/integration/memory-wct-quiz-store.test.ts`

Expected: FAIL because the Pop Quiz store and batch query do not exist.

- [ ] **Step 3: Extend the Day quiz store with one batch read**

Add this method without changing existing five-question behavior:

```ts
listSetsByLessonKeys(lessonKeys: string[]): Promise<WctQuizSet[]>;
```

Memory filters owner-scoped sets. Supabase performs one `.in("lesson_key", lessonKeys)` query plus `.eq("owner_id", user.id)` and maps rows with `mapWctQuizSet`.

- [ ] **Step 4: Implement the Pop Quiz contract and memory store**

Add these shared attempt shapes to `lib/wct/pop-quiz/types.ts`:

```ts
export type WctPopQuizAnswer = {
  questionId: string;
  choiceId: string;
  confirmedAt: string;
};

export type WctPopQuizIncorrectDay = {
  dayId: string;
  dayNumber: number;
  dayLabel: string;
};

export type WctPopQuizAttempt = {
  attemptId: string;
  bookId: string;
  seed: string;
  questions: WctPopQuizQuestion[];
  answers: WctPopQuizAnswer[];
  currentIndex: number;
  status: "in_progress" | "completed";
  latestScore: number | null;
  incorrectDays: WctPopQuizIncorrectDay[];
  startedAt: string;
  completedAt: string | null;
};

export type WctPopQuizSummary = Pick<
  WctPopQuizAttempt,
  "attemptId" | "status" | "currentIndex" | "latestScore" | "completedAt"
>;

export type WctPopQuizStartInput = {
  bookId: string;
  seed: string;
  questions: WctPopQuizQuestion[];
};

export type WctPopQuizConfirmInput = {
  bookId: string;
  attemptId: string;
  questionId: string;
  choiceId: string;
};

export type WctPopQuizConfirmResult = {
  answer: WctPopQuizAnswer;
  isCorrect: boolean;
  correctChoiceId: string;
  currentIndex: number;
};

export type WctPopQuizCompleteInput = {
  bookId: string;
  attemptId: string;
};

export type WctPopQuizResult = {
  score: number;
  total: 20;
  incorrectDays: WctPopQuizIncorrectDay[];
  completedAt: string;
};
```

Expose this store contract:

```ts
export interface WctPopQuizStore {
  getSummary(bookId: string): Promise<WctPopQuizSummary | null>;
  getAttempt(bookId: string): Promise<WctPopQuizAttempt | null>;
  startAttempt(input: WctPopQuizStartInput): Promise<WctPopQuizAttempt>;
  confirmAnswer(input: WctPopQuizConfirmInput): Promise<WctPopQuizConfirmResult>;
  completeAttempt(input: WctPopQuizCompleteInput): Promise<WctPopQuizResult>;
}
```

Store the validated 20-question snapshot with source IDs, confirmed answers, current index, status, score, incorrect Day summaries, and timestamps. `confirmAnswer` returns the existing result for an exact replay and throws for a second choice on an already confirmed question.

- [ ] **Step 5: Run store tests and commit**

Run: `npm test -- tests/integration/memory-wct-pop-quiz-store.test.ts tests/integration/memory-wct-quiz-store.test.ts`

Expected: PASS.

```bash
git add lib/wct-quiz-store lib/wct-pop-quiz-store lib/wct-pop-quiz-store.ts tests/integration/memory-wct-pop-quiz-store.test.ts tests/integration/memory-wct-quiz-store.test.ts
git commit -m "feat: store WCT Pop Quiz progress"
```

### Task 3: Add the production-ledger migration and Supabase store

**Files:**
- Create: `supabase/migrations/20260803120000_create_wct_pop_quiz.sql`
- Create: `lib/wct-pop-quiz-store/mappers.ts`
- Create: `lib/wct-pop-quiz-store/supabase-store.ts`
- Modify: `lib/wct-pop-quiz-store/factory.ts`
- Modify: `scripts/verify-rls.sql`
- Test: `tests/security/wct-pop-quiz-rls-policy.test.ts`
- Test: `tests/unit/wct-pop-quiz-validation.test.ts`

**Interfaces:**
- Consumes: Task 2 store contract and Task 1 schemas.
- Produces: `SupabaseWctPopQuizStore` backed by `wct_pop_quiz_progress` and authenticated RPCs.

- [ ] **Step 1: Write failing schema and policy tests**

Assert the migration contains owner/book uniqueness, RLS/force RLS, owner-only select, authenticated RPC grants, no authenticated direct writes, and server validation for exactly 20 questions/answers.

```ts
expect(sql).toContain("primary key (owner_id, book_id)");
expect(sql).toContain("jsonb_array_length(questions) = 20");
expect(sql).toContain("revoke insert, update, delete");
expect(sql).toContain("confirm_wct_pop_quiz_answer");
expect(sql).toContain("complete_wct_pop_quiz");
```

- [ ] **Step 2: Run schema tests and verify RED**

Run: `npm test -- tests/security/wct-pop-quiz-rls-policy.test.ts tests/unit/wct-pop-quiz-validation.test.ts`

Expected: FAIL because the migration and validation coverage do not exist.

- [ ] **Step 3: Create the ledger migration**

Create `wct_pop_quiz_progress` with this logical shape:

```sql
create table public.wct_pop_quiz_progress (
  owner_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.wct_books(id) on delete cascade,
  attempt_id uuid not null default gen_random_uuid(),
  seed text not null,
  questions jsonb not null check (
    jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) = 20
  ),
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) = 'array'),
  current_index integer not null default 0 check (current_index between 0 and 20),
  status text not null check (status in ('in_progress', 'completed')),
  latest_score integer check (latest_score between 0 and 20),
  incorrect_days jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (owner_id, book_id)
);
```

Add authenticated, `security definer` RPCs:

```sql
start_wct_pop_quiz(p_book_id uuid, p_seed text, p_questions jsonb)
confirm_wct_pop_quiz_answer(p_book_id uuid, p_attempt_id uuid, p_question_id text, p_choice_id text)
complete_wct_pop_quiz(p_book_id uuid, p_attempt_id uuid)
```

Each RPC checks `auth.uid()`, book ownership, attempt ID/status, source question/choice validity, and duplicate-answer idempotency. Completion derives score and distinct incorrect Days from the protected stored snapshot. Revoke direct authenticated writes and grant only owner-scoped select plus RPC execution.

- [ ] **Step 4: Implement mapping and Supabase methods**

Map snake_case rows into the Task 2 types. Call the RPCs using the authenticated server client; do not use the service-role client for learner attempt writes.

```ts
const { data, error } = await client.rpc("confirm_wct_pop_quiz_answer", {
  p_book_id: input.bookId,
  p_attempt_id: input.attemptId,
  p_question_id: input.questionId,
  p_choice_id: input.choiceId
});
```

- [ ] **Step 5: Validate the unapplied migration and commit**

Run: `npm run db:status`

Expected: `20260803120000_create_wct_pop_quiz.sql` is pending and existing checksums have no mismatch.

Run: `npm run db:validate`

Expected: the existing main ledger validates without applying the pending migration.

Run: `npm test -- tests/security/wct-pop-quiz-rls-policy.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/integration/memory-wct-pop-quiz-store.test.ts`

Expected: PASS.

```bash
git add supabase/migrations/20260803120000_create_wct_pop_quiz.sql lib/wct-pop-quiz-store scripts/verify-rls.sql tests/security/wct-pop-quiz-rls-policy.test.ts tests/unit/wct-pop-quiz-validation.test.ts
git commit -m "feat: add WCT Pop Quiz persistence"
```

### Task 4: Add start/confirm/complete actions and the Pop Quiz route

**Files:**
- Create: `lib/wct/pop-quiz/service.ts`
- Create: `app/lessons/books/[bookId]/pop-quiz/actions.ts`
- Create: `app/lessons/books/[bookId]/pop-quiz/page.tsx`
- Test: `tests/unit/wct-pop-quiz-service.test.ts`
- Test: `tests/unit/wct-pop-quiz-actions.test.ts`

**Interfaces:**
- Consumes: `WctStore`, `WctQuizStore.listSetsByLessonKeys`, selector, and `WctPopQuizStore`.
- Produces: `startWctPopQuizAction`, `confirmWctPopQuizAnswerAction`, `completeWctPopQuizAction`, and the authenticated route.

- [ ] **Step 1: Write failing service/action tests**

Cover eligible title/level matching, Premium/foreign/missing rejection, candidate assembly from every Day set, active-attempt resume, fresh retake seed, action validation, and Korean error messages.

```ts
const started = await startWctPopQuiz(serviceDeps, { bookId, mode: "start" });
expect(started.questions).toHaveLength(20);
await expect(startWctPopQuiz(serviceDeps, { premiumBookId, mode: "start" }))
  .rejects.toThrow("Pop Quiz is available for Prenovice and Novice only");
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-actions.test.ts`

Expected: FAIL because service/actions do not exist.

- [ ] **Step 3: Implement the orchestration service**

Add explicit dependency injection and these methods:

```ts
export async function getWctPopQuizSummary(deps, bookId): Promise<WctPopQuizSummary | null>;
export async function startWctPopQuiz(deps, input: { bookId: string; mode: "start" | "retake" }): Promise<WctPopQuizAttempt>;
export async function getWctPopQuizAttempt(deps, bookId): Promise<WctPopQuizAttempt | null>;
```

`start` returns an active attempt unchanged; `retake` requires a completed attempt, generates a cryptographically random seed, gathers Day sets in one batch, calls the selector with the prior signature, and starts the replacement attempt.

- [ ] **Step 4: Implement validated server actions and route ownership checks**

Use Zod UUID/action schemas. Return discriminated results for confirm/complete errors and use `redirect()` only after successful start/retake. The route requires the current user, verifies the book belongs to that user and is eligible, loads the current attempt, and redirects to the book when no attempt exists.

```ts
export type PopQuizActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };
```

- [ ] **Step 5: Run service/action tests and commit**

Run: `npm test -- tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-actions.test.ts`

Expected: PASS.

```bash
git add lib/wct/pop-quiz/service.ts app/lessons/books/'[bookId]'/pop-quiz tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-actions.test.ts
git commit -m "feat: add WCT Pop Quiz server flow"
```

### Task 5: Add the book CTA, persisted runner, and result links

**Files:**
- Create: `components/wct/WctPopQuizCta.tsx`
- Create: `components/wct/WctPopQuizRunner.tsx`
- Create: `components/wct/WctQuizQuestionStep.tsx`
- Modify: `components/wct/WctQuizRunner.tsx`
- Modify: `app/lessons/books/[bookId]/page.tsx`
- Test: `tests/components/wct-pop-quiz-cta.test.tsx`
- Test: `tests/components/wct-pop-quiz-runner.test.tsx`
- Modify: `tests/components/wct-quiz-runner.test.tsx`

**Interfaces:**
- Consumes: Task 4 actions and route data.
- Produces: CTA states, resumed runner state, persisted confirm/retry flow, `N/20` result, incorrect-Day links, and retake action.

- [ ] **Step 1: Write failing component tests**

Assert all CTA states, no CTA for an ineligible book, restored current index/confirmed answers, selection changes before confirmation, feedback only after confirmation, save retry without advance, completion result, deduplicated Day links, and retake form submission.

```tsx
expect(screen.getByRole("button", { name: "Pop Quiz 20문제" })).toBeVisible();
expect(screen.getByText("1 / 20")).toBeVisible();
await user.click(screen.getByRole("button", { name: "정답 확인" }));
expect(await screen.findByText("아쉬워요. 정답을 확인해 보세요.")).toBeVisible();
expect(screen.getByRole("link", { name: /Day 13 복습/ }))
  .toHaveAttribute("href", expect.stringContaining("/days/"));
```

- [ ] **Step 2: Run component tests and verify RED**

Run: `npm test -- tests/components/wct-pop-quiz-cta.test.tsx tests/components/wct-pop-quiz-runner.test.tsx tests/components/wct-quiz-runner.test.tsx`

Expected: FAIL because the Pop Quiz components do not exist.

- [ ] **Step 3: Extract the shared question step without changing Day behavior**

Move only choice rendering, selected styling, confirmation feedback, explanation, and next/result button rendering into `WctQuizQuestionStep`. Keep Day quiz scoring/restart logic in `WctQuizRunner`. Re-run its three existing tests immediately after extraction.

- [ ] **Step 4: Implement CTA and persisted Pop Quiz runner**

The book page loads the summary and renders the CTA above the Day list only when the normalized title/level is Prenovice or Novice. The Pop runner initializes from stored answers/current index. On confirmation it shows feedback immediately, calls the server action, disables advance until success, and exposes `저장 다시 시도` on failure.

Use exact CTA labels:

```ts
const label = summary?.status === "in_progress"
  ? `이어 풀기 · ${summary.currentIndex}/20`
  : summary?.latestScore != null
    ? `다시 풀기 · 최근 ${summary.latestScore}/20`
    : "Pop Quiz · 20문제";
```

- [ ] **Step 5: Run component tests and commit**

Run: `npm test -- tests/components/wct-pop-quiz-cta.test.tsx tests/components/wct-pop-quiz-runner.test.tsx tests/components/wct-quiz-runner.test.tsx`

Expected: PASS, including all original Day quiz tests.

```bash
git add components/wct app/lessons/books/'[bookId]'/page.tsx tests/components/wct-pop-quiz-cta.test.tsx tests/components/wct-pop-quiz-runner.test.tsx tests/components/wct-quiz-runner.test.tsx
git commit -m "feat: add WCT Pop Quiz experience"
```

### Task 6: Prove the full Prenovice and Novice browser flows

**Files:**
- Modify: `app/test/seed-wct-book/route.ts`
- Create: `e2e/wct-pop-quiz.spec.ts`
- Modify: `e2e/wct-course-library.spec.ts`

**Interfaces:**
- Consumes: the complete memory-backed feature.
- Produces: browser evidence for start, resume, completion, result links, retake difference, owner isolation, and Premium exclusion.

- [ ] **Step 1: Expand deterministic E2E fixtures**

Seed 16 Prenovice Days and 28 Novice Days, each with source-faithful test-only unique patterns/examples sufficient for its five Day questions. Return `prenoviceBookId`, `noviceBookId`, representative Day IDs, and the existing other-owner IDs. Keep Premium code fixtures unchanged.

- [ ] **Step 2: Write the failing mobile Chromium flow**

For each standard book:

```ts
await page.goto(`/lessons/books/${bookId}`);
await page.getByRole("button", { name: "Pop Quiz 20문제" }).click();
await expect(page.getByText("1 / 20", { exact: true })).toBeVisible();
await answerAndConfirm(page, 0);
await page.reload();
await expect(page.getByText("2 / 20", { exact: true })).toBeVisible();
```

Complete all 20, assert `N / 20`, follow one incorrect-Day link, return to the book, start a retake, and compare the collected 20 source question IDs to prove the signature changed. Assert Premium has no Pop Quiz CTA and another owner's guessed route returns 404.

- [ ] **Step 3: Run E2E and verify RED, then implement fixture corrections only**

Run: `npm run test:e2e -- e2e/wct-pop-quiz.spec.ts e2e/wct-course-library.spec.ts`

Expected before fixture completion: FAIL because the seed lacks enough eligible Days. After fixture completion: PASS for Prenovice, Novice, Premium exclusion, and owner isolation.

- [ ] **Step 4: Run the related regression suite and commit**

Run: `npm test -- tests/unit/wct-pop-quiz-selector.test.ts tests/integration/memory-wct-pop-quiz-store.test.ts tests/components/wct-pop-quiz-runner.test.tsx tests/components/wct-quiz-runner.test.tsx`

Expected: PASS.

```bash
git add app/test/seed-wct-book/route.ts e2e/wct-pop-quiz.spec.ts e2e/wct-course-library.spec.ts
git commit -m "test: cover WCT Pop Quiz journeys"
```

### Task 7: Apply the production migration, verify the live app, and complete the PRD

**Files:**
- Move: `docs/prd/active/wct-pop-quiz/` to `docs/prd/complete/wct-pop-quiz/`
- Modify: `docs/prd/complete/wct-pop-quiz/README.md`
- Modify: `docs/prd/complete/wct-pop-quiz/test-spec.md`
- Modify: `docs/prd/future-work.md`

**Interfaces:**
- Consumes: all completed implementation tasks and the pending migration.
- Produces: applied main schema, full command evidence, live-route evidence, and completed lifecycle documentation.

- [ ] **Step 1: Run pre-production code verification**

Run these commands and require exit code 0:

```bash
npm run lint
npm run typecheck
npm test -- --maxWorkers=1
npm run test:e2e -- e2e/wct-pop-quiz.spec.ts e2e/wct-day-review-quiz.spec.ts e2e/wct-course-library.spec.ts
npm run build
```

- [ ] **Step 2: Verify the production target and stop for explicit confirmation**

State that the pending write targets main/production. Verify `.env.local` resolves to Supabase project ref `ccawzrrkxuirrwvaecvw`, then run:

```bash
npm run db:status
npm run db:validate
```

Expected: the Pop Quiz migration is the only intended pending migration and the applied ledger has no checksum mismatch. Ask the user for explicit confirmation to apply this production migration. Do not continue to Step 3 without that confirmation.

- [ ] **Step 3: Apply and verify the schema after confirmation**

Run:

```bash
npm run db:migrate -- --confirm-production
npm run db:status
npm run db:validate
npm run verify:rls
```

Expected: pending 0, checksum mismatch 0, authenticated owner select works, anon/cross-owner/direct writes fail, and start/confirm/complete RPCs work. This migration writes schema only, so no Korean production payload readback is required.

- [ ] **Step 4: Verify the actual post-build routes on a fresh external-bind server**

Start a task-owned server with `npm run dev -- --hostname 0.0.0.0 --port 3101`. Verify local and WSL/LAN IP HTTP 200 for:

```text
/lessons/books/<prenoviceBookId>
/lessons/books/<prenoviceBookId>/pop-quiz
/lessons/books/<noviceBookId>
/lessons/books/<noviceBookId>/pop-quiz
```

Complete one live Pop Quiz, refresh after a confirmed answer, finish, follow an incorrect-Day link, and start a different retake. Inspect server logs for `InternalServerError`, HTTP 500, missing chunk/module, schema, and failed action errors. Stop only the task-owned server.

- [ ] **Step 5: Complete lifecycle documentation and commit**

Move the PRD folder to Complete. Record changed files, exact command counts/results, migration ledger state, route URLs, owner/RLS evidence, and remaining risks in the completed README/test spec and `future-work.md`.

```bash
git add docs/prd/complete/wct-pop-quiz docs/prd/future-work.md
git commit -m "docs: complete WCT Pop Quiz"
```

- [ ] **Step 6: Run the final working-tree gate**

Run:

```bash
git diff --check
git status --short --branch
git log --oneline --decorate -8
```

Expected: clean feature branch containing only the reviewed Pop Quiz commits, ready for `superpowers:finishing-a-development-branch` against `main`.
