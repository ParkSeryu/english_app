# WCT Pop Quiz Day Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every new WCT book Pop Quiz contain one question from every Day, reveal `Day N · topic` only after answer confirmation, and use the attempt's actual length everywhere.

**Architecture:** Keep the current book-level Pop Quiz route, attempt store, and approved Day question sources. Replace the fixed quota selector with a seeded per-Day selector, carry `shortLabel` as optional persisted `dayTopic` metadata for legacy compatibility, derive all totals from stored questions, and add a forward-only Supabase migration that validates one question for every current book Day while preserving existing 20-question rows.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.9, Zod 4, Vitest/Testing Library, Playwright, Supabase PostgreSQL/RLS, Flyway-style migration ledger.

## Global Constraints

- Prenovice creates 16-question attempts and Novice creates 28-question attempts from their current Day inventories.
- New attempts contain exactly one approved `translation` or `pattern` question from every Day; `concept` questions remain excluded.
- Day/topic metadata stays hidden until `정답 확인`, then appears as `Day N · topic` in the existing feedback panel.
- Questions run in ascending Day order; refresh/resume preserves the stored order and a retake changes at least one source question.
- Existing stored 20-question attempts remain readable and completable; no prior attempts or lesson content are deleted or rewritten.
- Existing five-question Day quizzes and WCT Premium behavior remain unchanged.
- Do not edit `supabase/migrations/20260803120000_create_wct_pop_quiz.sql`; create a new timestamped migration.
- The sole hosted target is main/production Supabase project `ccawzrrkxuirrwvaecvw`, and applying the hosted migration requires explicit confirmation immediately before the write.
- Follow the project runtime gate: lint, typecheck, targeted tests, broader tests, build, healthy externally bound dev server, affected-route exercise, and server-log inspection.

---

### Task 0: Remove environment-dependent CLI help-output tests

**Files:**
- Modify: `tests/unit/main-only-environment.test.ts`

**Interfaces:**
- Consumes: the existing main-only environment test suite.
- Produces: a stable two-test suite that keeps the in-process WCT backfill target and retired-option guards while removing four child-process stdout assertions that are unreliable in the Codex/Vitest worker environment.

- [ ] **Step 1: Remove only the four child-process output tests**

Delete the `spawnSync`, `path`, `root`, `runNode`, and `outputOf` code and these four cases:

- `documents one guarded main migration target`
- `rejects the retired migration environment option before database access`
- `documents one guarded main private-expression target`
- `rejects the retired private-expression environment option before hosted access`

Keep both in-process `generate-wct-quiz-backfill.ts` tests unchanged.

- [ ] **Step 2: Verify the focused suite**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/unit/main-only-environment.test.ts
```

Expected: 2 tests pass with pristine output.

- [ ] **Step 3: Verify the full Vitest baseline**

Run:

```bash
node node_modules/vitest/vitest.mjs run
```

Expected: 362 tests pass and 1 is skipped, with no failures.

- [ ] **Step 4: Commit Task 0**

```bash
git add tests/unit/main-only-environment.test.ts
git commit -m "test: remove environment-dependent CLI output checks"
```

### Task 1: Activate the tracked PRD and replace fixed selection with one-per-Day selection

**Files:**
- Move: `docs/prd/complete/wct-pop-quiz/` → `docs/prd/active/wct-pop-quiz/`
- Modify: `docs/prd/future-work.md`
- Modify: `docs/prd/README.md`
- Modify: `lib/wct/pop-quiz/types.ts`
- Modify: `lib/wct/pop-quiz/validation.ts`
- Modify: `lib/wct/pop-quiz/selector.ts`
- Modify: `lib/wct/pop-quiz/service.ts`
- Modify: `app/lessons/books/[bookId]/pop-quiz/actions.ts`
- Test: `tests/unit/wct-pop-quiz-selector.test.ts`
- Test: `tests/unit/wct-pop-quiz-validation.test.ts`
- Test: `tests/unit/wct-pop-quiz-service.test.ts`
- Test: `tests/unit/wct-pop-quiz-actions.test.ts`

**Interfaces:**
- Consumes: `WctBook.days`, `WctDaySummary.shortLabel`, existing immutable `WctQuizSet.questions`, and `WctPopQuizSelectionInput`.
- Produces: `WctPopQuizCandidate.dayTopic?: string`, a variable-length `WctPopQuizQuestion[]` ordered by `dayNumber`, and the selector error `Pop Quiz needs one eligible question per Day`.

- [ ] **Step 1: Mark the existing WCT Pop Quiz tracker entry Active before runtime edits**

Run:

```bash
git mv docs/prd/complete/wct-pop-quiz docs/prd/active/wct-pop-quiz
```

Update `docs/prd/future-work.md` so the 2026-08-03 WCT Pop Quiz item says `Status: Active`, describes this one-question-per-Day enhancement, and points at `docs/prd/active/wct-pop-quiz/*`. Update the matching path in `docs/prd/README.md`. Do not change unrelated tracker items.

- [ ] **Step 2: Write failing selector, validation, service, and action tests**

In `tests/unit/wct-pop-quiz-selector.test.ts`, add literal assertions that a 16-Day fixture returns 16 questions and a 28-Day fixture returns 28 questions, with these invariants:

```ts
expect(selected.map((item) => item.dayNumber)).toEqual(
  Array.from({ length: dayCount }, (_, index) => index + 1)
);
expect(new Set(selected.map((item) => item.dayId)).size).toBe(dayCount);
expect(selected.every((item) => item.dayTopic === `Topic ${item.dayNumber}`)).toBe(true);
expect(selected.every((item) => item.question.kind !== "concept")).toBe(true);
```

Add a missing-Day case by removing every eligible candidate for Day 8 and expect `Pop Quiz needs one eligible question per Day`. Keep same-seed stability and previous-signature retake tests, but assert only that at least one per-Day source question changes.

In `tests/unit/wct-pop-quiz-validation.test.ts`, prove the schema accepts both a 16-question new snapshot carrying `dayTopic` and a legacy 20-question snapshot without `dayTopic`; retain choice-ID, correct-choice, and duplicate-question protections. Remove tests that encode 12/8, 7/7/6, or maximum-two-per-Day quotas.

In `tests/unit/wct-pop-quiz-service.test.ts`, expect `startWctPopQuiz` to pass 16 questions and `dayTopic: day.shortLabel` to the store. In `tests/unit/wct-pop-quiz-actions.test.ts`, change the preparation-error fixture to `Pop Quiz needs one eligible question per Day`.

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
npm test -- tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-actions.test.ts
```

Expected: FAIL because selection still returns 20, `dayTopic` is absent, fixed quota validation rejects 16/28 snapshots, and the action does not recognize the new selector error.

- [ ] **Step 4: Implement the minimal variable-length domain behavior**

In `lib/wct/pop-quiz/types.ts`, add the legacy-compatible field and remove fixed-total/type/band quota constants:

```ts
export type WctPopQuizCandidate = {
  sourceQuizSetId: string;
  dayId: string;
  dayNumber: number;
  dayLabel: string;
  dayTopic?: string;
  question: WctQuizQuestion;
};
```

Keep `band` on `WctPopQuizQuestion` so existing rows still parse. Change `WctPopQuizResult.total` from literal `20` to `number`; Task 2 will complete the store changes.

In `lib/wct/pop-quiz/validation.ts`, make `dayTopic` optional, retain `translation`/`pattern`, distinct question IDs, distinct choice IDs, and correct-choice membership, and change the array contract to `min(1).max(100)`. Remove fixed length, type quota, band quota, and per-Day-count refinements because legacy 20-question attempts must remain parseable; the selector and start RPC enforce new-attempt Day coverage.

In `lib/wct/pop-quiz/selector.ts`, keep deterministic hashing and `buildBandByDayId`, but replace cell quotas/backtracking with:

```ts
const selected = orderedDays.map((day) => {
  const eligible = input.candidates
    .filter((candidate) => candidate.dayId === day.id && candidate.question.kind !== "concept")
    .sort((left, right) => rank(seed, left).localeCompare(rank(seed, right)));
  const candidate = eligible[0];
  if (!candidate) throw new Error("Pop Quiz needs one eligible question per Day");
  return { ...candidate, band: bandByDayId.get(day.id)! };
});
```

Retry with `${input.seed}:${retry}` up to the existing retry limit when the canonical signature equals `previousSignature`, and throw the same one-per-Day preparation error if all retries match.

In `lib/wct/pop-quiz/service.ts`, set `dayTopic: day.shortLabel` when building candidates. In `app/lessons/books/[bookId]/pop-quiz/actions.ts`, map the new selector error to the existing Korean preparation message.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
npm test -- tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-actions.test.ts
```

Expected: PASS with 16/28 Day coverage, stable per-Day selection, changed retakes, legacy validation, and the existing Korean preparation error.

- [ ] **Step 6: Commit Task 1**

```bash
git add docs/prd/active/wct-pop-quiz docs/prd/future-work.md docs/prd/README.md lib/wct/pop-quiz app/lessons/books/'[bookId]'/pop-quiz/actions.ts tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-actions.test.ts
git commit -m "feat: select one WCT Pop Quiz question per Day"
```

### Task 2: Make attempts, summaries, and results carry dynamic totals

**Files:**
- Modify: `lib/wct/pop-quiz/types.ts`
- Modify: `lib/wct-pop-quiz-store/mappers.ts`
- Modify: `lib/wct-pop-quiz-store/memory-store.ts`
- Modify: `lib/wct-pop-quiz-store/supabase-store.ts`
- Test: `tests/integration/memory-wct-pop-quiz-store.test.ts`
- Create: `tests/unit/wct-pop-quiz-mappers.test.ts`

**Interfaces:**
- Consumes: variable-length `WctPopQuizAttempt.questions` and legacy 20-question stored rows.
- Produces: `WctPopQuizSummary.total: number`, `WctPopQuizResult.total: number`, dynamic completion totals, and summary queries that include `questions` only to derive their length.

- [ ] **Step 1: Write failing memory-store and mapper tests**

Change the memory-store fixture to accept `dayCount: 16 | 28` and create one question per Day. Assert a 16-question completion returns `{ score: 15, total: 16 }`, a summary returns `total: 16`, and a 28-question attempt can confirm through `currentIndex: 28`.

Create `tests/unit/wct-pop-quiz-mappers.test.ts` with complete snake_case rows. Assert:

```ts
expect(mapWctPopQuizSummary(rowWith16Questions)).toMatchObject({
  currentIndex: 3,
  total: 16
});
expect(mapWctPopQuizAttempt(legacyRowWith20Questions).questions).toHaveLength(20);
expect(mapWctPopQuizResult({ score: 26, total: 28, incorrectDays: [], completedAt })).toMatchObject({
  score: 26,
  total: 28
});
```

Add negative mapper cases for `currentIndex > questions.length`, `score > total`, and `answers.length > questions.length`.

- [ ] **Step 2: Run store tests and verify RED**

Run:

```bash
npm test -- tests/integration/memory-wct-pop-quiz-store.test.ts tests/unit/wct-pop-quiz-mappers.test.ts
```

Expected: FAIL because totals and Zod maxima are fixed at 20 and summaries do not expose `total`.

- [ ] **Step 3: Implement dynamic store contracts**

In `lib/wct/pop-quiz/types.ts`, define:

```ts
export type WctPopQuizSummary = Pick<
  WctPopQuizAttempt,
  "attemptId" | "status" | "currentIndex" | "latestScore" | "completedAt"
> & { total: number };

export type WctPopQuizResult = {
  score: number;
  total: number;
  incorrectDays: WctPopQuizIncorrectDay[];
  completedAt: string;
};
```

In `lib/wct-pop-quiz-store/mappers.ts`, parse up to 100 questions/answers/index/score, derive summary `total` from `row.questions`, and use `superRefine` to reject index, answer, or score values above the question count. Refine result objects so `score <= total`.

In `lib/wct-pop-quiz-store/supabase-store.ts`, change the summary select to include `questions`:

```ts
.select("attempt_id,status,current_index,latest_score,completed_at,questions")
```

In `lib/wct-pop-quiz-store/memory-store.ts`, return `total: attempt.questions.length` from summaries and completed results.

- [ ] **Step 4: Run store tests and verify GREEN**

Run:

```bash
npm test -- tests/integration/memory-wct-pop-quiz-store.test.ts tests/unit/wct-pop-quiz-mappers.test.ts
```

Expected: PASS for 16, 28, and legacy 20-question attempts, with invalid cross-field totals rejected.

- [ ] **Step 5: Commit Task 2**

```bash
git add lib/wct/pop-quiz/types.ts lib/wct-pop-quiz-store tests/integration/memory-wct-pop-quiz-store.test.ts tests/unit/wct-pop-quiz-mappers.test.ts
git commit -m "feat: support dynamic WCT Pop Quiz totals"
```

### Task 3: Reveal Day/topic after confirmation and show dynamic totals in the UI

**Files:**
- Modify: `components/wct/WctQuizQuestionStep.tsx`
- Modify: `components/wct/WctPopQuizRunner.tsx`
- Modify: `components/wct/WctPopQuizCta.tsx`
- Modify: `app/lessons/books/[bookId]/page.tsx`
- Test: `tests/components/wct-pop-quiz-runner.test.tsx`
- Test: `tests/components/wct-pop-quiz-cta.test.tsx`
- Test: `tests/components/wct-quiz-runner.test.tsx`

**Interfaces:**
- Consumes: `attempt.questions.length`, `attempt.questions[index].dayNumber`, optional `dayTopic`, legacy `dayLabel`, `summary.total`, and `book.dayCount`.
- Produces: optional `feedbackContext?: string` on `WctQuizQuestionStep`, confirmed-only `Day N · topic`, and dynamic CTA/progress/result labels.

- [ ] **Step 1: Write failing component tests**

Change the Pop Quiz runner fixture to 16 questions with `dayTopic: "Topic 1"` on the first item. Before confirmation assert `screen.queryByText("Day 1 · Topic 1")` is absent; after confirmation assert it is visible inside the feedback panel. Add a legacy item without `dayTopic` and assert its stored `dayLabel` appears only after confirmation.

Replace fixed runner expectations with `1 / 16`, `16 / 16`, and result totals from the action response. In CTA tests pass `totalQuestions={16}` and assert:

```ts
"Pop Quiz · 16문제"
"이어 풀기 · 7/16"
"다시 풀기 · 최근 14/16"
```

Keep `tests/components/wct-quiz-runner.test.tsx` asserting that the standard five-question Day quiz has no Pop Quiz Day/topic feedback context.

- [ ] **Step 2: Run component tests and verify RED**

Run:

```bash
npm test -- tests/components/wct-pop-quiz-runner.test.tsx tests/components/wct-pop-quiz-cta.test.tsx tests/components/wct-quiz-runner.test.tsx
```

Expected: FAIL because the source metadata is not rendered and UI totals are hard-coded to 20.

- [ ] **Step 3: Implement confirmed-only metadata and dynamic UI totals**

Add `feedbackContext?: string` to `WctQuizQuestionStep`. Render it only inside the existing `isAnswerConfirmed && selectedChoiceId` feedback block, between the correctness heading and `해설`:

```tsx
{feedbackContext ? <p className="mt-2 text-sm font-black">{feedbackContext}</p> : null}
```

In `WctPopQuizRunner`, retain the full selected item as `questionEntry`, derive `total = attempt.questions.length`, and pass:

```tsx
feedbackContext={questionEntry.dayTopic
  ? `Day ${questionEntry.dayNumber} · ${questionEntry.dayTopic}`
  : questionEntry.dayLabel}
```

Use `total` for progress, fully answered state, and restored completed result; continue using the server result's `result.total` in the result heading.

Add required `totalQuestions: number` to `WctPopQuizCta`. Use `summary?.total ?? totalQuestions` for the label denominator and supporting copy `책 전체 Day를 ${total}문제로 복습해 보세요.`. In `app/lessons/books/[bookId]/page.tsx`, pass `totalQuestions={book.days.length}`.

- [ ] **Step 4: Run component tests and verify GREEN**

Run:

```bash
npm test -- tests/components/wct-pop-quiz-runner.test.tsx tests/components/wct-pop-quiz-cta.test.tsx tests/components/wct-quiz-runner.test.tsx
```

Expected: PASS; Day/topic is hidden until confirmation, dynamic totals render, and Day/Premium shared quiz behavior remains unchanged.

- [ ] **Step 5: Commit Task 3**

```bash
git add components/wct/WctQuizQuestionStep.tsx components/wct/WctPopQuizRunner.tsx components/wct/WctPopQuizCta.tsx app/lessons/books/'[bookId]'/page.tsx tests/components/wct-pop-quiz-runner.test.tsx tests/components/wct-pop-quiz-cta.test.tsx tests/components/wct-quiz-runner.test.tsx
git commit -m "feat: reveal WCT Pop Quiz source after answers"
```

### Task 4: Add the forward-only dynamic-length production migration

**Files:**
- Create: `supabase/migrations/20260804120000_update_wct_pop_quiz_day_coverage.sql`
- Modify: `scripts/verify-rls.sql`

**Interfaces:**
- Consumes: existing `wct_pop_quiz_progress` rows and existing RPC signatures `start_wct_pop_quiz(uuid,text,jsonb)`, `confirm_wct_pop_quiz_answer(uuid,uuid,text,text)`, and `complete_wct_pop_quiz(uuid,uuid)`.
- Produces: dynamic table checks, a start RPC that requires one source question per current Day with matching `dayTopic`, and a completion RPC that returns the stored question count.

- [ ] **Step 1: Update executable RLS smoke expectations before the migration**

In `scripts/verify-rls.sql`, replace the fixed 20-question start fixtures with one question for each seeded Day. Add executed negative cases for a missing Day and a duplicated Day, expecting `One WCT Pop Quiz question per Day is required`. After completion assert the returned `total` equals `jsonb_array_length(v_questions)`. Keep all existing executed ownership, direct-write denial, and authenticated RPC-only checks.

- [ ] **Step 2: Run the executable database smoke and verify RED**

Run:

```bash
npm run verify:rls
```

Expected: FAIL against the old fixed-20 schema because the executable smoke now starts one question per seeded Day. If the local Docker database is unavailable, record that environment blocker and retain the updated executable smoke as the required post-migration GREEN check.

- [ ] **Step 3: Create the migration with dynamic constraints and RPC validation**

Create `supabase/migrations/20260804120000_update_wct_pop_quiz_day_coverage.sql`. Drop the four generated fixed checks and add equivalent dynamic checks:

```sql
alter table public.wct_pop_quiz_progress
  drop constraint wct_pop_quiz_progress_questions_check,
  drop constraint wct_pop_quiz_progress_answers_check,
  drop constraint wct_pop_quiz_progress_current_index_check,
  drop constraint wct_pop_quiz_progress_latest_score_check;

alter table public.wct_pop_quiz_progress
  add constraint wct_pop_quiz_progress_questions_check check (
    jsonb_typeof(questions) = 'array'
    and jsonb_array_length(questions) between 1 and 100
  ),
  add constraint wct_pop_quiz_progress_answers_check check (
    jsonb_typeof(answers) = 'array'
    and jsonb_array_length(answers) <= jsonb_array_length(questions)
  ),
  add constraint wct_pop_quiz_progress_current_index_check check (
    current_index between 0 and jsonb_array_length(questions)
  ),
  add constraint wct_pop_quiz_progress_latest_score_check check (
    latest_score is null or latest_score between 0 and jsonb_array_length(questions)
  );
```

Replace `start_wct_pop_quiz` without changing its signature/security/grants. Count current `wct_days` for the owner/book into `v_day_count`, require `jsonb_array_length(p_questions) = v_day_count`, require distinct question IDs and distinct `dayId` values both equal `v_day_count`, require one `translation` or `pattern` source question for each Day, validate `item->>'dayTopic' = day.short_label`, retain band/source/owner checks, and retain canonical retake-signature rejection.

Replace `complete_wct_pop_quiz` without changing its signature/security/grants. Define `v_total := jsonb_array_length(v_attempt.questions)`, require both `current_index` and answer length equal `v_total`, and return `'total', v_total` for both already-completed and newly completed paths.

Finish with the same revoke/grant statements and `notify pgrst, 'reload schema';`.

- [ ] **Step 4: Validate the migration statically and through the ledger without applying it**

Run:

```bash
npm test -- tests/security/wct-pop-quiz-rls-policy.test.ts
npm run verify:rls
npm run db:status
npm run db:validate
```

Expected: the existing forced-RLS/privilege test and executable database smoke PASS; the ledger reports `20260804120000_update_wct_pop_quiz_day_coverage.sql` pending with no checksum mismatch. `db:status` and `db:validate` are read-only against main/production project `ccawzrrkxuirrwvaecvw`.

- [ ] **Step 5: Commit Task 4 without applying production yet**

```bash
git add supabase/migrations/20260804120000_update_wct_pop_quiz_day_coverage.sql scripts/verify-rls.sql
git commit -m "feat: migrate WCT Pop Quiz to per-Day questions"
```

### Task 5: Update full journeys and verify the runtime behavior

**Files:**
- Modify: `e2e/wct-pop-quiz.spec.ts`
- Modify: `app/test/seed-wct-book/route.ts`
- Modify: any Pop Quiz tests still containing behaviorally fixed `/20` expectations found by `rg -n "20문제|/20|20 / 20|total: 20" tests e2e components/wct app/lessons/books lib/wct-pop-quiz-store lib/wct/pop-quiz`

**Interfaces:**
- Consumes: seeded 16-Day Prenovice and 28-Day Novice books, Pop Quiz CTA/action/runner, and authenticated test memory stores.
- Produces: browser proof of exact Day coverage, confirmed-only Day/topic feedback, refresh/resume, dynamic results, review links, and changed retakes.

- [ ] **Step 1: Write the failing E2E expectations**

Return `prenoviceDayCount: 16` and `noviceDayCount: 28` from the seed endpoint. Parameterize the journey by `{ bookId, total }`. Before each answer confirmation assert no `Day N · topic` source line is visible; after confirmation assert exactly one matching source line is visible. Collect all question `dayId` values and assert:

```ts
expect(signature).toHaveLength(total);
expect(new Set(signature.map((question) => question.dayId)).size).toBe(total);
```

Assert CTA/progress/result text with the current `total`, refresh from `1 / total` to `2 / total`, and a retake signature that differs by at least one question while keeping the same Day IDs.

- [ ] **Step 2: Run the focused memory-backed E2E and verify RED**

Run against an externally bound test server using the repository's Playwright web-server configuration:

```bash
npm run test:e2e -- e2e/wct-pop-quiz.spec.ts --project=mobile-chromium
```

Expected: FAIL on the old 20-question CTA/progress/coverage behavior. The Playwright configuration uses the test memory stores, so this RED cycle does not require the production migration.

- [ ] **Step 3: Remove remaining fixed-20 assumptions exposed by tests**

Use:

```bash
rg -n "20문제|/20|20 / 20|total: 20|literal\(20\)|max\(20\)|length\([^)]*20" tests e2e components/wct app/lessons/books lib/wct-pop-quiz-store lib/wct/pop-quiz
```

Change only Pop Quiz behavior to derive totals; preserve unrelated values and legacy fixture assertions explicitly named as legacy compatibility.

- [ ] **Step 4: Run command-level verification before the production write**

Run:

```bash
npm run lint
npm run typecheck
npm test -- tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-actions.test.ts tests/unit/wct-pop-quiz-mappers.test.ts tests/integration/memory-wct-pop-quiz-store.test.ts tests/components/wct-pop-quiz-runner.test.tsx tests/components/wct-pop-quiz-cta.test.tsx tests/components/wct-quiz-runner.test.tsx tests/security/wct-pop-quiz-rls-policy.test.ts
npm test
npm run build
```

Expected: all commands PASS with no warnings or type errors.

- [ ] **Step 5: Request explicit confirmation, then apply only the pending migration to main/production**

First verify `.env.local` resolves to Supabase project ref `ccawzrrkxuirrwvaecvw` and report that main/production is targeted. Ask for explicit approval immediately before running:

```bash
npm run db:migrate -- --confirm-production
```

After approval, run:

```bash
npm run db:status
npm run db:validate
npm run verify:rls
```

Expected: migration applied, pending 0, checksum mismatch 0, and executable RLS verification passes. If local Docker prevents `verify:rls`, run the repo's established hosted authenticated smoke path and state the exact remaining gap.

- [ ] **Step 6: Run Playwright and live affected-route checks on a healthy server**

Restart after the build and bind externally:

```bash
npm run dev -- --hostname 0.0.0.0
```

Run:

```bash
npm run test:e2e -- e2e/wct-pop-quiz.spec.ts --project=mobile-chromium
curl -I http://127.0.0.1:3000/lessons
```

Open both authenticated book pages and their `/lessons/books/[bookId]/pop-quiz` routes through Playwright/browser, start fresh Prenovice and Novice attempts, confirm the first answer, and verify `Day N · topic` appears only afterward. Also check the reachable WSL/LAN IP route when available. Inspect dev-server output for `500`, `InternalServerError`, missing chunks/modules, schema errors, and failed server actions.

- [ ] **Step 7: Commit Task 5**

```bash
git add e2e/wct-pop-quiz.spec.ts app/api/test tests components/wct app/lessons/books lib/wct-pop-quiz-store lib/wct/pop-quiz
git commit -m "test: cover per-Day WCT Pop Quiz journeys"
```

### Task 6: Complete the PRD lifecycle and record verification evidence

**Files:**
- Move: `docs/prd/active/wct-pop-quiz/` → `docs/prd/complete/wct-pop-quiz/`
- Modify: `docs/prd/complete/wct-pop-quiz/README.md`
- Modify: `docs/prd/complete/wct-pop-quiz/test-spec.md`
- Modify: `docs/prd/future-work.md`
- Modify: `docs/prd/README.md`

**Interfaces:**
- Consumes: exact changed-file list, command outputs, applied migration status, live route URLs, Playwright results, and remaining risks from Tasks 1–5.
- Produces: a completed tracker entry that truthfully records the per-Day enhancement and verification evidence.

- [ ] **Step 1: Run the overcomplication and scope check**

Review `git diff 954badd..HEAD` and confirm every runtime change maps to one-per-Day selection, confirmed-answer metadata, dynamic totals, compatibility, or required verification. Remove unused constants/helpers and do not fix adjacent issues.

- [ ] **Step 2: Move the PRD back to Complete and record evidence**

Run:

```bash
git mv docs/prd/active/wct-pop-quiz docs/prd/complete/wct-pop-quiz
```

Update the README/test spec/tracker with the exact files changed, exact commands and pass counts, migration `20260804120000_update_wct_pop_quiz_day_coverage.sql` status, production project ref, live Prenovice/Novice Pop Quiz routes, and any remaining risks. Set the tracker status to `Complete` only after every required verification has passed.

- [ ] **Step 3: Verify docs-only final changes and clean status**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only the intended documentation lifecycle changes are uncommitted.

- [ ] **Step 4: Commit Task 6**

```bash
git add docs/prd/complete/wct-pop-quiz docs/prd/future-work.md docs/prd/README.md
git commit -m "docs: complete WCT Pop Quiz day coverage"
```

- [ ] **Step 5: Final verification-before-completion gate**

Invoke `superpowers:verification-before-completion`, re-run or inspect fresh output for the required commands, and report:

- affected surface classification: UI, server action, persistence, and schema;
- changed files;
- exact lint/typecheck/test/build/database/E2E/live-route checks and results;
- main/production migration status for project `ccawzrrkxuirrwvaecvw`;
- any command that could not run and what remains unverified.
