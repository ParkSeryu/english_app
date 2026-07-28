# WCT Day Review Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one fixed, source-backed five-question multiple-choice review quiz and latest-score badge to all 45 existing WCT Days and every future WCT Day.

**Architecture:** A deterministic TypeScript generator converts standard or Premium lesson data into a validated JSON quiz set. A separate owner-scoped quiz store persists immutable sets and latest progress in Supabase or the E2E memory store; PostgreSQL recalculates submitted scores through an authenticated RPC. Standard imports ensure missing quizzes after the existing atomic Day import, Premium Days ensure a quiz on first authenticated detail load, and a committed Flyway-style data migration backfills the current 45 dev Days.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.9, Zod 4, Supabase/PostgreSQL with RLS, Vitest, Testing Library, Playwright, Tailwind CSS

## Global Constraints

- Work on `codex/wct-day-review-quiz`, based on `dev`; the integration target is `dev`, not `main`.
- Target hosted data only in `dev / .env.local / Supabase project uixpyibcpleuwsgemdno`.
- Do not read from or write to `main / .env.main.local / ccawzrrkxuirrwvaecvw` without a separate status check and explicit production confirmation.
- Apply schema and data only through new timestamped files in `supabase/migrations/` and `scripts/db-migrations.mjs`.
- Never edit an applied migration.
- Keep WCT quiz types, stores, routes, and data separate from expression cards and memorization.
- Every set has exactly five questions, four distinct choices per question, one correct choice, and a non-empty source-based explanation.
- Standard Days use three Korean-meaning recognition questions and two pattern-recognition questions.
- Premium Days use three concept/rule questions and two pattern/example questions without inventing Korean translations.
- Selecting a choice locks it and shows immediate feedback; only a completed five-question attempt is persisted.
- Persist only the latest score and completion time; retaking does not create attempt history.
- Existing quiz sets are immutable and idempotent; importing, replaying, or loading a Day must not overwrite one.
- Do not add runtime AI APIs, model dependencies, quiz editors, audio, free-text answers, scheduling, streaks, or adjacent WCT content changes.
- Follow TDD: write each behavior test, run it and observe the expected failure, implement the minimum production code, then rerun to green.
- Preserve unrelated worktree changes and keep every diff line traceable to this feature.
- Hosted writes containing Korean text require UTF-8 transport and exact readback comparison before completion is reported.
- Runtime-facing work is not complete until lint, typecheck, targeted tests, RLS verification, build, dev migration status, and live standard/Premium quiz routes pass.

---

## File Structure

### Domain and generation

- Create `lib/wct/quiz/types.ts`: quiz set, question, choice, source seed, summary, submission, and result types.
- Create `lib/wct/quiz/keys.ts`: stable standard and Premium lesson-key builders.
- Create `lib/wct/quiz/validation.ts`: strict Zod schemas for stored sets and answer submissions.
- Create `lib/wct/quiz/adapters.ts`: standard `WctDay`/book and code-backed Premium lesson adapters.
- Create `lib/wct/quiz/generator.ts`: stable hashing, seeded selection, choice shuffle, IDs, and the `wct-review-v1` generator.
- Create `lib/wct/quiz/ensure.ts`: idempotent standard-import and Premium-first-load orchestration.

### Storage and scoring

- Create `lib/wct-quiz-store/contract.ts`: read, create-if-missing, summary, and submit interfaces.
- Create `lib/wct-quiz-store/mappers.ts`: strict Supabase-row parsing.
- Create `lib/wct-quiz-store/memory-store.ts`: owner-scoped E2E implementation and reset hook.
- Create `lib/wct-quiz-store/supabase-store.ts`: RLS reads, service-role set creation, and scoring RPC calls.
- Create `lib/wct-quiz-store/factory.ts`: normal and admin store factories.
- Create `lib/wct-quiz-store.ts`: public barrel.

### Schema and data

- Create `supabase/migrations/20260728120000_create_wct_review_quizzes.sql`: tables, indexes, RLS, grants, and trusted scoring RPC.
- Create `scripts/generate-wct-quiz-backfill.ts`: read-only source audit, shared generator invocation, SQL emission, and post-apply verification.
- Create `supabase/migrations/20260728121000_backfill_wct_review_quizzes.sql`: generated, environment-portable inserts for the 45 approved sets.
- Modify `package.json`: explicit generate and verify commands for the backfill.
- Modify `tsconfig.json`: allow `.ts` imports for the Node 22 type-stripped generation script.
- Modify `scripts/verify-rls-local.sh`: executable quiz-set and progress privacy/scoring checks.

### App integration

- Modify `app/api/wct/import/route.ts`: ensure quizzes after first import and exact replay.
- Create `app/lessons/quiz-actions.ts`: authenticated typed attempt submission.
- Create `components/wct/WctQuizBadge.tsx`: pending/completed badge-style link.
- Create `components/wct/WctQuizRunner.tsx`: five-question client interaction and retry-save UI.
- Modify `app/lessons/books/[bookId]/days/[dayId]/page.tsx`: load and show standard quiz summary.
- Create `app/lessons/books/[bookId]/days/[dayId]/quiz/page.tsx`: standard quiz route and source-route verification.
- Modify `app/lessons/premium/days/[dayId]/page.tsx`: ensure/load Premium quiz and show the badge.
- Create `app/lessons/premium/days/[dayId]/quiz/page.tsx`: Premium quiz route.

### Tests and lifecycle docs

- Create `tests/unit/wct-quiz-generator.test.ts`.
- Create `tests/unit/wct-quiz-validation.test.ts`.
- Create `tests/unit/wct-quiz-actions.test.ts`.
- Create `tests/integration/memory-wct-quiz-store.test.ts`.
- Modify `tests/integration/wct-import-api.test.ts`.
- Create `tests/components/wct-quiz-badge.test.tsx`.
- Create `tests/components/wct-quiz-runner.test.tsx`.
- Modify `app/test/seed-wct-book/route.ts`.
- Modify `app/test/reset/route.ts`.
- Create `e2e/wct-day-review-quiz.spec.ts`.
- Create `docs/prd/active/wct-day-review-quiz/README.md`.
- Create `docs/prd/active/wct-day-review-quiz/prd.md`.
- Create `docs/prd/active/wct-day-review-quiz/test-spec.md`.
- Create `docs/prd/active/wct-day-review-quiz/implementation-plan.md`.
- Modify `docs/prd/future-work.md`.

---

### Task 1: Activate the WCT Review Quiz PRD

**Files:**
- Create: `docs/prd/active/wct-day-review-quiz/README.md`
- Create: `docs/prd/active/wct-day-review-quiz/prd.md`
- Create: `docs/prd/active/wct-day-review-quiz/test-spec.md`
- Create: `docs/prd/active/wct-day-review-quiz/implementation-plan.md`
- Modify: `docs/prd/future-work.md:108`

**Interfaces:**
- Consumes: approved design `docs/superpowers/specs/2026-07-28-wct-day-review-quiz-design.md`
- Produces: active tracker item `T-010` and canonical links used during implementation and completion

- [ ] **Step 1: Create the active feature folder and canonical links**

Write `README.md` with:

```markdown
# WCT Day Review Quiz

- Status: Active
- Tracker: `docs/prd/future-work.md#t-010-wct-day-review-quiz`
- PRD: `prd.md`
- Test spec: `test-spec.md`
- Canonical implementation plan:
  `docs/superpowers/plans/2026-07-28-wct-day-review-quiz.md`
- Approved design:
  `docs/superpowers/specs/2026-07-28-wct-day-review-quiz-design.md`

This folder remains Active until dev schema, 45-set backfill, RLS, automated tests,
and live standard/Premium quiz flows are verified.
```

- [ ] **Step 2: Write the implementation PRD**

Use the approved design to record the goal, included 45-Day inventory, fixed five-question behavior, future automatic creation, dev-only data boundary, non-goals, and acceptance criteria. Include this exact success statement:

```markdown
The feature is accepted when all 45 existing dev Days have one valid set,
standard and Premium Day details show the correct badge, immediate feedback
works across five questions, and the server-calculated latest score survives
returning to the Day.
```

- [ ] **Step 3: Write the test specification**

Include a table covering generator invariants, sparse-Day fallbacks, Premium adaptation, owner isolation, scoring RPC validation, import replay, 45-set/Korean readback, component state, both route families, Playwright, build, and live-route health.

- [ ] **Step 4: Link this canonical plan**

Write `implementation-plan.md` as:

```markdown
# WCT Day Review Quiz Implementation Plan

The canonical step-by-step implementation plan is:

`docs/superpowers/plans/2026-07-28-wct-day-review-quiz.md`
```

- [ ] **Step 5: Add `T-010` under `## Active`**

Record `Status: Active`, the user need, scope, success criteria, pull-readiness evidence, dev project ref, integration target `dev`, and the four active document links. Do not alter existing Complete records.

- [ ] **Step 6: Review and commit the lifecycle transition**

Run:

```bash
git diff --check
git status --short
```

Expected: only the four active PRD files and `docs/prd/future-work.md` are changed.

Commit:

```bash
git add docs/prd/active/wct-day-review-quiz docs/prd/future-work.md
git commit -m "docs: activate WCT Day review quiz PRD"
```

---

### Task 2: Define and Generate Valid Quiz Sets

**Files:**
- Create: `lib/wct/quiz/types.ts`
- Create: `lib/wct/quiz/keys.ts`
- Create: `lib/wct/quiz/validation.ts`
- Create: `lib/wct/quiz/adapters.ts`
- Create: `lib/wct/quiz/generator.ts`
- Create: `tests/unit/wct-quiz-generator.test.ts`
- Create: `tests/unit/wct-quiz-validation.test.ts`

**Interfaces:**
- Consumes: `WctBook`, `WctDay`, `WctPremiumLesson`
- Produces:
  - `standardWctLessonKey(bookTitle: string, dayNumber: number): string`
  - `premiumWctLessonKey(dayId: string): string`
  - `buildStandardWctQuizSource(book: WctBook, target: WctDay, allDays: readonly WctDay[]): WctQuizSource`
  - `buildPremiumWctQuizSource(lesson: WctPremiumLesson): WctQuizSource`
  - `generateWctQuizSetDraft(source: WctQuizSource): WctQuizSetCreateInput`
  - `wctQuizSetSchema` and `wctQuizSubmissionSchema`

- [ ] **Step 1: Write failing generator tests**

Create fixtures with at least four translated examples across two standard Days and a Premium lesson containing four sections plus two subheading/example pairs.

```ts
it("creates the fixed standard 3 translation + 2 pattern mix", () => {
  const source = buildStandardWctQuizSource(book, targetDay, allDays);
  const draft = generateWctQuizSetDraft(source);

  expect(draft.questions).toHaveLength(5);
  expect(draft.questions.map((question) => question.kind)).toEqual([
    "translation", "translation", "translation", "pattern", "pattern"
  ]);
  for (const question of draft.questions) {
    expect(question.choices).toHaveLength(4);
    expect(new Set(question.choices.map((choice) => choice.text))).toHaveSize(4);
    expect(question.choices.filter((choice) => choice.id === question.correctChoiceId)).toHaveLength(1);
    expect(question.explanation.trim()).not.toBe("");
  }
});

it("is byte-stable for the same source and generator version", () => {
  const source = buildStandardWctQuizSource(book, targetDay, allDays);
  expect(generateWctQuizSetDraft(source)).toEqual(generateWctQuizSetDraft(source));
});

it("uses Premium source text without inventing Korean translations", () => {
  const source = buildPremiumWctQuizSource(premiumLesson);
  const draft = generateWctQuizSetDraft(source);
  expect(draft.questions.map((question) => question.kind)).toEqual([
    "concept", "concept", "concept", "pattern", "pattern"
  ]);
  expect(JSON.stringify(draft)).not.toContain("번역:");
});

it("rejects a source that cannot provide three distinct distractors", () => {
  expect(() => generateWctQuizSetDraft(insufficientSource))
    .toThrow("WCT quiz needs four distinct choices");
});
```

- [ ] **Step 2: Run the generator tests and observe RED**

Run:

```bash
npm test -- tests/unit/wct-quiz-generator.test.ts
```

Expected: FAIL because the quiz modules do not exist.

- [ ] **Step 3: Define exact domain types and stable keys**

Implement:

```ts
export const WCT_QUIZ_GENERATOR_VERSION = "wct-review-v1" as const;
export type WctQuizSourceKind = "wct_day" | "wct_premium";
export type WctQuizQuestionKind = "translation" | "pattern" | "concept";

export type WctQuizChoice = { id: string; text: string };
export type WctQuizQuestion = {
  id: string;
  kind: WctQuizQuestionKind;
  prompt: string;
  choices: WctQuizChoice[];
  correctChoiceId: string;
  explanation: string;
};

export type WctQuizQuestionSeed = {
  seedKey: string;
  kind: WctQuizQuestionKind;
  prompt: string;
  correctText: string;
  explanation: string;
  distractorPool: string[];
};

export type WctQuizSource = {
  lessonKey: string;
  sourceKind: WctQuizSourceKind;
  sourceId: string;
  sourceHashInput: unknown;
  seeds: WctQuizQuestionSeed[];
};

export type WctQuizSetCreateInput = {
  lessonKey: string;
  sourceKind: WctQuizSourceKind;
  sourceId: string;
  generatorVersion: typeof WCT_QUIZ_GENERATOR_VERSION;
  sourceHash: string;
  questions: WctQuizQuestion[];
};

export type WctQuizSet = WctQuizSetCreateInput & {
  id: string;
  ownerId: string;
  createdAt: string;
};

export type WctQuizSummary = {
  quizSetId: string;
  questionCount: 5;
  latestScore: number | null;
  completedAt: string | null;
};

export type WctQuizAnswer = { questionId: string; choiceId: string };
export type WctQuizSubmission = { quizSetId: string; answers: WctQuizAnswer[] };
export type WctQuizAttemptResult = {
  score: number;
  total: 5;
  completedAt: string;
};

export type WctQuizActionResult =
  | ({ ok: true } & WctQuizAttemptResult)
  | { ok: false; message: string };
```

Build stable keys from normalized book identity rather than environment-specific UUIDs:

```ts
export function standardWctLessonKey(bookTitle: string, dayNumber: number) {
  return `wct-book:${normalizeWctIdentity(bookTitle)}:day:${dayNumber}`;
}

export function premiumWctLessonKey(dayId: string) {
  return `wct-premium:${normalizeWctIdentity(dayId)}`;
}
```

- [ ] **Step 4: Implement strict stored-set and submission schemas**

Require five questions, four choices, unique IDs/text, one matching correct choice, and exactly five unique submitted question IDs.

```ts
const choiceSchema = z.object({
  id: z.string().min(1).max(160),
  text: z.string().trim().min(1).max(2_000)
}).strict();

const questionSchema = z.object({
  id: z.string().min(1).max(160),
  kind: z.enum(["translation", "pattern", "concept"]),
  prompt: z.string().trim().min(1).max(2_000),
  choices: z.array(choiceSchema).length(4),
  correctChoiceId: z.string().min(1).max(160),
  explanation: z.string().trim().min(1).max(2_000)
}).strict().superRefine((question, context) => {
  const ids = question.choices.map((choice) => choice.id);
  const texts = question.choices.map((choice) => normalizeWctIdentity(choice.text));
  if (new Set(ids).size !== 4 || new Set(texts).size !== 4) {
    context.addIssue({ code: "custom", path: ["choices"], message: "Choices must be distinct" });
  }
  if (!ids.includes(question.correctChoiceId)) {
    context.addIssue({ code: "custom", path: ["correctChoiceId"], message: "Correct choice must exist" });
  }
});

export const wctQuizQuestionsSchema = z.array(questionSchema).length(5)
  .superRefine((questions, context) => {
    const prompts = questions.map((question) => normalizeWctIdentity(question.prompt));
    if (new Set(prompts).size !== 5) {
      context.addIssue({ code: "custom", message: "Question prompts must be distinct" });
    }
  });

const quizSetFields = {
  lessonKey: z.string().trim().min(1).max(240),
  sourceKind: z.enum(["wct_day", "wct_premium"]),
  sourceId: z.string().trim().min(1).max(240),
  generatorVersion: z.literal("wct-review-v1"),
  sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  questions: wctQuizQuestionsSchema
};
export const wctQuizSetCreateSchema = z.object(quizSetFields).strict();
export const wctQuizSetSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  ...quizSetFields,
  createdAt: z.string().datetime({ offset: true })
}).strict();

export const wctQuizSubmissionSchema = z.object({
  quizSetId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().min(1).max(160),
    choiceId: z.string().min(1).max(160)
  }).strict()).length(5)
}).strict().superRefine((value, context) => {
  if (new Set(value.answers.map((answer) => answer.questionId)).size !== 5) {
    context.addIssue({ code: "custom", path: ["answers"], message: "Each question must be answered once" });
  }
});
```

- [ ] **Step 5: Implement source adapters**

For standard Days:

- flatten examples in source order;
- select three translated-example seeds, cycling only when fewer than three translated examples exist;
- make repeated-example prompts distinct by including the stored pattern text;
- build two pattern/example seeds, cycling source pairs when the Day has only one pattern, and keep a repeated prompt distinct with its stored example meaning;
- order distractor candidates as same Day, nearest Day number, then remaining book Days.

For Premium:

- create three concept seeds from distinct section titles and their first paragraph/rule/list statement;
- create two pattern/example seeds by pairing a subheading with the next example block and choosing the final `→` line when present;
- use statements/examples from other sections as distractors;
- require facts from at least four distinct sections so every concept question can receive three distinct distractors;
- fail without four distinct section facts and two headed example seeds.

Use seed construction with stable source fields rather than database child UUIDs:

```ts
if (translatedExamples.length === 0) throw new Error("WCT quiz needs translated examples");
const selectedTranslations = Array.from(
  { length: 3 },
  (_, index) => translatedExamples[index % translatedExamples.length]
);
const translationSeeds = selectedTranslations.map((example, index) => ({
  seedKey: `translation:${index}:${normalizeWctIdentity(example.meaningKo)}`,
  kind: "translation" as const,
  prompt: index < translatedExamples.length
    ? `“${example.meaningKo}”에 맞는 영어 문장을 고르세요.`
    : `“${example.patternText}”을 사용해 “${example.meaningKo}”를 말한 문장을 고르세요.`,
  correctText: example.englishText,
  explanation: [example.patternText, example.meaningKo].filter(Boolean).join(" · "),
  distractorPool: orderedBookExamples.map((candidate) => candidate.englishText)
}));

const premiumConceptSeeds = sectionFacts.slice(0, 3).map((fact, index) => ({
  seedKey: `concept:${index}:${fact.sectionId}`,
  kind: "concept" as const,
  prompt: `다음 중 ‘${fact.sectionTitle}’에서 설명한 내용은?`,
  correctText: fact.text,
  explanation: fact.text,
  distractorPool: sectionFacts
    .filter((candidate) => candidate.sectionId !== fact.sectionId)
    .map((candidate) => candidate.text)
}));
```

- [ ] **Step 6: Implement deterministic generation**

Use SHA-256 to derive `sourceHash`, question IDs, choice IDs, and a stable numeric sort key:

```ts
function stableRank(scope: string, value: string) {
  return createHash("sha256").update(`${scope}\0${value}`).digest("hex");
}

export function generateWctQuizSetDraft(source: WctQuizSource): WctQuizSetCreateInput {
  const questions = source.seeds.slice(0, 5).map((seed, questionIndex) => {
    const distractors = [...new Set(seed.distractorPool.map((value) => value.trim()))]
      .filter((value) => value && value !== seed.correctText.trim())
      .sort((left, right) => stableRank(seed.seedKey, left).localeCompare(stableRank(seed.seedKey, right)))
      .slice(0, 3);
    if (distractors.length !== 3) throw new Error("WCT quiz needs four distinct choices");

    const questionId = `q-${stableRank(source.lessonKey, `${questionIndex}:${seed.seedKey}`).slice(0, 16)}`;
    const choices = [seed.correctText.trim(), ...distractors]
      .sort((left, right) => stableRank(questionId, left).localeCompare(stableRank(questionId, right)))
      .map((text) => ({ id: `c-${stableRank(questionId, text).slice(0, 16)}`, text }));
    const correctChoice = choices.find((choice) => choice.text === seed.correctText.trim());
    if (!correctChoice) throw new Error("WCT quiz correct choice is missing");

    return {
      id: questionId,
      kind: seed.kind,
      prompt: seed.prompt.trim(),
      choices,
      correctChoiceId: correctChoice.id,
      explanation: seed.explanation.trim()
    };
  });
  if (questions.length !== 5) throw new Error("WCT quiz needs exactly five questions");

  return wctQuizSetCreateSchema.parse({
    lessonKey: source.lessonKey,
    sourceKind: source.sourceKind,
    sourceId: source.sourceId,
    generatorVersion: WCT_QUIZ_GENERATOR_VERSION,
    sourceHash: stableRank(source.lessonKey, stableStringify(source.sourceHashInput)),
    questions
  });
}
```

- [ ] **Step 7: Run generator and validation tests to GREEN**

Run:

```bash
npm test -- tests/unit/wct-quiz-generator.test.ts tests/unit/wct-quiz-validation.test.ts
```

Expected: both files pass with deterministic IDs, exact mixes, and strict rejection cases.

- [ ] **Step 8: Commit the domain unit**

```bash
git add lib/wct/quiz tests/unit/wct-quiz-generator.test.ts tests/unit/wct-quiz-validation.test.ts
git commit -m "feat: generate source-backed WCT review quizzes"
```

---

### Task 3: Add Quiz Schema, RLS, and Trusted Scoring

**Files:**
- Create: `supabase/migrations/20260728120000_create_wct_review_quizzes.sql`
- Modify: `scripts/verify-rls-local.sh`

**Interfaces:**
- Consumes: stored JSON shape from `wctQuizSetCreateSchema`
- Produces:
  - `public.wct_quiz_sets`
  - `public.wct_quiz_progress`
  - `public.submit_wct_quiz_attempt(uuid, jsonb) returns jsonb`

- [ ] **Step 1: Add failing executable RLS/scoring checks**

Before adding the migration, extend `scripts/verify-rls-local.sh` to:

- insert one owner-A and one owner-B quiz set as `service_role`;
- assert anon cannot select either table;
- assert owner A sees only owner A's set;
- assert owner A cannot insert/update quiz sets or progress directly;
- call the scoring RPC with five answer pairs and expect a trusted score;
- assert owner B cannot submit owner A's set;
- call the RPC again with different answers and assert one progress row contains the latest score.

Use a valid five-question JSON fixture whose correct choice IDs are `a1` through `a5`.

- [ ] **Step 2: Run RLS verification and observe RED**

Run:

```bash
npm run verify:rls
```

Expected: FAIL because `public.wct_quiz_sets` does not exist.

- [ ] **Step 3: Create the tables and constraints**

Add:

```sql
create table public.wct_quiz_sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lesson_key text not null check (length(btrim(lesson_key)) between 1 and 240),
  source_kind text not null check (source_kind in ('wct_day', 'wct_premium')),
  source_id text not null check (length(btrim(source_id)) between 1 and 240),
  generator_version text not null check (length(btrim(generator_version)) between 1 and 80),
  source_hash text not null check (length(source_hash) = 64),
  questions jsonb not null check (
    jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) = 5
  ),
  created_at timestamptz not null default now(),
  unique (owner_id, lesson_key)
);

create table public.wct_quiz_progress (
  quiz_set_id uuid not null references public.wct_quiz_sets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  latest_score integer not null check (latest_score between 0 and 5),
  completed_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (quiz_set_id, user_id)
);
```

Create owner/lesson and user/update indexes. Enable and force RLS on both tables.

- [ ] **Step 4: Add read policies and deny direct browser writes**

```sql
create policy "wct_quiz_sets_select_own" on public.wct_quiz_sets
for select to authenticated using (owner_id = auth.uid());

create policy "wct_quiz_progress_select_own" on public.wct_quiz_progress
for select to authenticated using (
  user_id = auth.uid()
  and exists (
    select 1 from public.wct_quiz_sets quiz
    where quiz.id = quiz_set_id and quiz.owner_id = auth.uid()
  )
);

grant select on public.wct_quiz_sets, public.wct_quiz_progress to authenticated;
revoke insert, update, delete on public.wct_quiz_sets, public.wct_quiz_progress from authenticated;
revoke all on public.wct_quiz_sets, public.wct_quiz_progress from anon;
grant all on public.wct_quiz_sets, public.wct_quiz_progress to service_role;
```

- [ ] **Step 5: Implement the authenticated scoring RPC**

The security-definer function must:

1. reject null `auth.uid()`;
2. select only a quiz set whose `owner_id = auth.uid()`;
3. require `p_answers` to be an array of length five;
4. require five distinct submitted question IDs;
5. require every question and choice ID to exist in the stored JSON;
6. count matches against stored `correctChoiceId`;
7. upsert `(quiz_set_id, auth.uid())`;
8. return `{score,total,completedAt}`.

Implement the function body as:

```sql
create or replace function public.submit_wct_quiz_attempt(
  p_quiz_set_id uuid,
  p_answers jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_questions jsonb;
  v_answer_count integer;
  v_score integer;
  v_completed_at timestamptz := clock_timestamp();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select questions into v_questions
  from public.wct_quiz_sets
  where id = p_quiz_set_id and owner_id = v_user_id;
  if not found then
    raise exception 'WCT quiz not found';
  end if;

  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) <> 5 then
    raise exception 'Exactly five answers are required';
  end if;

  select count(distinct answer->>'questionId') into v_answer_count
  from jsonb_array_elements(p_answers) answer;
  if v_answer_count <> 5 then
    raise exception 'Each question must be answered once';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) answer
    where not exists (
      select 1
      from jsonb_array_elements(v_questions) question
      where question->>'id' = answer->>'questionId'
        and exists (
          select 1
          from jsonb_array_elements(question->'choices') choice
          where choice->>'id' = answer->>'choiceId'
        )
    )
  ) then
    raise exception 'Unknown WCT quiz question or choice';
  end if;

  select count(*) into v_score
  from jsonb_array_elements(p_answers) answer
  join jsonb_array_elements(v_questions) question
    on question->>'id' = answer->>'questionId'
  where question->>'correctChoiceId' = answer->>'choiceId';

  insert into public.wct_quiz_progress(
    quiz_set_id, user_id, latest_score, completed_at, updated_at
  ) values (
    p_quiz_set_id, v_user_id, v_score, v_completed_at, v_completed_at
  )
  on conflict (quiz_set_id, user_id) do update
  set latest_score = excluded.latest_score,
      completed_at = excluded.completed_at,
      updated_at = excluded.updated_at;

  return jsonb_build_object(
    'score', v_score,
    'total', 5,
    'completedAt', v_completed_at
  );
end;
$$;

revoke all on function public.submit_wct_quiz_attempt(uuid, jsonb)
from public, anon, service_role;
grant execute on function public.submit_wct_quiz_attempt(uuid, jsonb)
to authenticated;
```

Service-role backfill writes directly to the set table and does not need this RPC.

- [ ] **Step 6: Run RLS verification to GREEN**

```bash
npm run verify:rls
```

Expected: exit 0 and final output `RLS verification passed`, including direct-write denial and server-calculated latest-score replacement.

- [ ] **Step 7: Commit the schema unit**

```bash
git add supabase/migrations/20260728120000_create_wct_review_quizzes.sql scripts/verify-rls-local.sh
git commit -m "feat: add private WCT quiz persistence"
```

---

### Task 4: Implement Quiz Stores and Attempt Submission

**Files:**
- Create: `lib/wct-quiz-store/contract.ts`
- Create: `lib/wct-quiz-store/mappers.ts`
- Create: `lib/wct-quiz-store/memory-store.ts`
- Create: `lib/wct-quiz-store/supabase-store.ts`
- Create: `lib/wct-quiz-store/factory.ts`
- Create: `lib/wct-quiz-store.ts`
- Create: `tests/integration/memory-wct-quiz-store.test.ts`

**Interfaces:**
- Consumes: `WctQuizSetCreateInput`, `WctQuizSubmission`, current `UserIdentity`
- Produces:
  - `getSetByLessonKey(lessonKey: string): Promise<WctQuizSet | null>`
  - `getSummaryByLessonKey(lessonKey: string): Promise<WctQuizSummary | null>`
  - `createSetIfMissing(input: WctQuizSetCreateInput): Promise<WctQuizSet>`
  - `submitAttempt(input: WctQuizSubmission): Promise<WctQuizAttemptResult>`
  - `getWctQuizStore(user)` and `getAdminWctQuizStore(user)`

- [ ] **Step 1: Write failing memory-store contract tests**

```ts
it("creates once and returns the immutable existing set on replay", async () => {
  const admin = new MemoryWctQuizStore(USER_A, true);
  const first = await admin.createSetIfMissing(draft);
  const replay = await admin.createSetIfMissing({ ...draft, sourceHash: "f".repeat(64) });
  expect(replay).toEqual(first);
});

it("isolates sets and summaries by owner", async () => {
  await new MemoryWctQuizStore(USER_A, true).createSetIfMissing(draft);
  await expect(new MemoryWctQuizStore(USER_B).getSetByLessonKey(draft.lessonKey))
    .resolves.toBeNull();
});

it("scores stored answers and replaces the latest progress", async () => {
  const admin = new MemoryWctQuizStore(USER_A, true);
  const set = await admin.createSetIfMissing(draft);
  const learner = new MemoryWctQuizStore(USER_A);
  expect((await learner.submitAttempt(allCorrect(set))).score).toBe(5);
  expect((await learner.submitAttempt(allWrong(set))).score).toBe(0);
  await expect(learner.getSummaryByLessonKey(draft.lessonKey))
    .resolves.toMatchObject({ latestScore: 0 });
});
```

Also test unknown question IDs, duplicate answers, foreign set IDs, and non-admin creation.

- [ ] **Step 2: Run the store test and observe RED**

```bash
npm test -- tests/integration/memory-wct-quiz-store.test.ts
```

Expected: FAIL because the store modules do not exist.

- [ ] **Step 3: Define the store contract and strict row mappers**

```ts
export interface WctQuizStore {
  getSetByLessonKey(lessonKey: string): Promise<WctQuizSet | null>;
  getSummaryByLessonKey(lessonKey: string): Promise<WctQuizSummary | null>;
  createSetIfMissing(input: WctQuizSetCreateInput): Promise<WctQuizSet>;
  submitAttempt(input: WctQuizSubmission): Promise<WctQuizAttemptResult>;
}
```

`mapWctQuizSet` must parse `questions` through `wctQuizQuestionsSchema`; malformed stored JSON throws `Invalid stored WCT quiz`.

- [ ] **Step 4: Implement the memory store**

Use one global-symbol state:

```ts
type MemoryWctQuizState = {
  sets: Map<string, StoredQuizSet>;
  progress: Map<string, WctQuizProgress>;
};
```

Key sets by `${ownerId}:${lessonKey}` and progress by `${userId}:${quizSetId}`. Clone every returned object. Export `resetMemoryWctQuizStoreForTests()`.

Use the stored answer key for memory-mode scoring:

```ts
async submitAttempt(input: WctQuizSubmission): Promise<WctQuizAttemptResult> {
  const parsed = wctQuizSubmissionSchema.parse(input);
  const set = [...getState().sets.values()].find((candidate) => (
    candidate.id === parsed.quizSetId && candidate.ownerId === this.user.id
  ));
  if (!set) throw new Error("WCT quiz not found");

  const correctByQuestion = new Map(
    set.questions.map((question) => [question.id, question.correctChoiceId])
  );
  for (const answer of parsed.answers) {
    const question = set.questions.find((candidate) => candidate.id === answer.questionId);
    if (!question?.choices.some((choice) => choice.id === answer.choiceId)) {
      throw new Error("Unknown WCT quiz question or choice");
    }
  }
  const score = parsed.answers.filter((answer) => (
    correctByQuestion.get(answer.questionId) === answer.choiceId
  )).length;
  const completedAt = new Date().toISOString();
  getState().progress.set(`${this.user.id}:${set.id}`, {
    quizSetId: set.id,
    userId: this.user.id,
    latestScore: score,
    completedAt
  });
  return { score, total: 5, completedAt };
}
```

- [ ] **Step 5: Implement the Supabase store**

- User reads use `createServerSupabaseClient`.
- Admin creation uses `createServiceRoleSupabaseClient`.
- `createSetIfMissing` first inserts with `upsert(..., { onConflict: "owner_id,lesson_key", ignoreDuplicates: true })`, then selects the owner/key row.
- `submitAttempt` calls:

```ts
client.rpc("submit_wct_quiz_attempt", {
  p_quiz_set_id: input.quizSetId,
  p_answers: input.answers
});
```

- `getSummaryByLessonKey` loads the set ID/question count and the current user's progress row.
- Convert all Supabase errors to messages prefixed with `WCT quiz`.

- [ ] **Step 6: Implement normal/admin factories**

Mirror `lib/wct-store/factory.ts`:

```ts
export function getWctQuizStore(user: UserIdentity): WctQuizStore {
  return isE2EMemoryMode()
    ? new MemoryWctQuizStore(user, false)
    : new SupabaseWctQuizStore(user);
}

export function getAdminWctQuizStore(user: UserIdentity): WctQuizStore {
  return isE2EMemoryMode()
    ? new MemoryWctQuizStore(user, true)
    : new SupabaseWctQuizStore(user, createServiceRoleSupabaseClient, true);
}
```

- [ ] **Step 7: Run store tests to GREEN**

```bash
npm test -- tests/integration/memory-wct-quiz-store.test.ts
```

Expected: all owner, idempotency, validation, scoring, and latest-progress cases pass.

- [ ] **Step 8: Commit the storage unit**

```bash
git add lib/wct-quiz-store lib/wct-quiz-store.ts tests/integration/memory-wct-quiz-store.test.ts
git commit -m "feat: store and score WCT review quizzes"
```

---

### Task 5: Ensure Quizzes for Imports and Premium First Loads

**Files:**
- Create: `lib/wct/quiz/ensure.ts`
- Modify: `app/api/wct/import/route.ts:29-40`
- Modify: `tests/integration/wct-import-api.test.ts`
- Create: `tests/unit/wct-quiz-ensure.test.ts`

**Interfaces:**
- Consumes: `WctStore`, admin `WctQuizStore`, `WctImportResult`, `WctPremiumLesson`
- Produces:
  - `ensureImportedWctQuizzes(wctStore, quizStore, result): Promise<void>`
  - `ensurePremiumWctQuiz(quizStore, lesson): Promise<WctQuizSet>`

- [ ] **Step 1: Write failing orchestration tests**

Test:

- all created/replaced/merged/skipped operation Day IDs are ensured;
- an exact import replay calls ensure again but returns the existing set;
- one create failure rejects with the Day label and succeeds on retry;
- Premium ensure creates once and returns the same set on repeat.

```ts
it("retries a missing quiz after an exact import replay", async () => {
  quizStore.createSetIfMissing
    .mockRejectedValueOnce(new Error("temporary quiz failure"))
    .mockResolvedValueOnce(storedSet);

  await expect(ensureImportedWctQuizzes(wctStore, quizStore, result)).rejects.toThrow("Day 1");
  await expect(ensureImportedWctQuizzes(wctStore, quizStore, result)).resolves.toBeUndefined();
  expect(quizStore.createSetIfMissing).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2: Run focused tests and observe RED**

```bash
npm test -- tests/unit/wct-quiz-ensure.test.ts tests/integration/wct-import-api.test.ts
```

Expected: ensure module missing and API does not create quiz sets.

- [ ] **Step 3: Implement standard import ensure**

Load the imported book once, load every book Day for the distractor corpus, and ensure each operation target:

```ts
export async function ensureImportedWctQuizzes(
  wctStore: WctStore,
  quizStore: WctQuizStore,
  result: WctImportResult
) {
  const book = await wctStore.getBook(result.bookId);
  if (!book) throw new Error("WCT quiz book was not found after import");
  const allDays = (await Promise.all(book.days.map((item) => wctStore.getDay(item.id))))
    .filter((item): item is WctDay => item !== null);

  for (const operation of result.operations) {
    const day = allDays.find((item) => item.id === operation.dayId);
    if (!day) throw new Error(`WCT quiz Day ${operation.dayNumber} was not found after import`);
    try {
      const source = buildStandardWctQuizSource(book, day, allDays);
      await quizStore.createSetIfMissing(generateWctQuizSetDraft(source));
    } catch (error) {
      throw new Error(`WCT quiz generation failed for ${day.displayLabel}`, { cause: error });
    }
  }
}
```

- [ ] **Step 4: Implement Premium ensure**

Adapt the code-backed lesson and call the same idempotent create path. The helper must not modify `WctPremiumLesson`.

```ts
export async function ensurePremiumWctQuiz(
  quizStore: WctQuizStore,
  lesson: WctPremiumLesson
) {
  const source = buildPremiumWctQuizSource(lesson);
  return quizStore.createSetIfMissing(generateWctQuizSetDraft(source));
}
```

- [ ] **Step 5: Wire the import route**

Create `wctStore` and `quizStore` for the authenticated configured owner, import first, then ensure before returning:

```ts
const wctStore = getAdminWctStore(ownerOrResponse);
const result = await wctStore.importApprovedBatch({ ... });
await ensureImportedWctQuizzes(
  wctStore,
  getAdminWctQuizStore(ownerOrResponse),
  result
);
return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
```

Leave the existing approval, payload hash, and import idempotency behavior unchanged.

- [ ] **Step 6: Expand the API fixture to be quiz-ready**

Give `validBody` at least two patterns and four distinct translated examples so the route's generator can form four-choice questions. Assert after first import and replay:

```ts
const quizStore = getWctQuizStore({ id: OWNER_ID });
const book = (await new MemoryWctStore({ id: OWNER_ID }).listBooks())[0];
await expect(quizStore.getSetByLessonKey(standardWctLessonKey(book.title, 1)))
  .resolves.toMatchObject({ generatorVersion: "wct-review-v1" });
```

- [ ] **Step 7: Run orchestration/API tests to GREEN**

```bash
npm test -- tests/unit/wct-quiz-ensure.test.ts tests/integration/wct-import-api.test.ts
```

Expected: import creates one set, replay reuses it, and failure/retry behavior is explicit.

- [ ] **Step 8: Commit automatic creation**

```bash
git add lib/wct/quiz/ensure.ts app/api/wct/import/route.ts tests/unit/wct-quiz-ensure.test.ts tests/integration/wct-import-api.test.ts
git commit -m "feat: create WCT quizzes with lesson imports"
```

---

### Task 6: Generate and Apply the 45-Set Dev Backfill

**Files:**
- Create: `scripts/generate-wct-quiz-backfill.ts`
- Create: `supabase/migrations/20260728121000_backfill_wct_review_quizzes.sql`
- Modify: `package.json:21-29`
- Modify: `tsconfig.json:3-17`
- Test: `tests/unit/wct-quiz-generator.test.ts`

**Interfaces:**
- Consumes: `.env.local`, dev WCT source graph, shared adapters/generator, Premium lesson list
- Produces:
  - `npm run wct:quiz-backfill:generate`
  - `npm run wct:quiz-backfill:verify`
  - environment-portable 45-set SQL migration

- [ ] **Step 1: Add a failing script-mode generator test**

Export a pure `buildBackfillRows(books, premiumLessons)` helper and test:

```ts
it("builds 44 standard plus 1 Premium row without owner or source UUID literals", () => {
  const rows = buildBackfillRows(devFixtureBooks, listWctPremiumLessons());
  expect(rows).toHaveLength(45);
  expect(rows.filter((row) => row.sourceKind === "wct_day")).toHaveLength(44);
  expect(rows.filter((row) => row.sourceKind === "wct_premium")).toHaveLength(1);
  expect(rows.every((row) => row.questions.length === 5)).toBe(true);
});
```

Run:

```bash
npm test -- tests/unit/wct-quiz-generator.test.ts
```

Expected: FAIL because `buildBackfillRows` is not exported.

- [ ] **Step 2: Enable the shared TypeScript generator in Node 22**

Add `"allowImportingTsExtensions": true` under `compilerOptions`. Add:

```json
"wct:quiz-backfill:generate": "node --experimental-strip-types scripts/generate-wct-quiz-backfill.ts generate --env dev --output supabase/migrations/20260728121000_backfill_wct_review_quizzes.sql",
"wct:quiz-backfill:verify": "node --experimental-strip-types scripts/generate-wct-quiz-backfill.ts verify --env dev"
```

Use explicit relative `.ts` imports in the script and the quiz modules loaded by that script; do not change unrelated imports.

- [ ] **Step 3: Implement safe environment loading and source reads**

The script must:

- map `dev` to `.env.local` and expected project `uixpyibcpleuwsgemdno`;
- reject any other project ref before network access;
- require `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`;
- never print secret values;
- query WCT books, Days, patterns, and examples read-only;
- preserve Korean with UTF-8;
- assert the current inventory is Prenovice 16 + Novice 28 + Premium 1;
- re-confirm the pre-implementation dev audit: all 211 standard examples have a non-empty Korean meaning (missingMeaningCount=0);
- treat 211/211 as current backfill evidence, not a future invariant: a future sparse Day must fail with the exact book/Day context rather than emit a partial quiz.

Use a guarded entry point so the pure row builder remains importable by Vitest:

```ts
type BackfillBook = Omit<WctBook, "days"> & { days: WctDay[] };
type StandardBackfillRow = WctQuizSetCreateInput & {
  normalizedBookTitle: string;
  dayNumber: number;
};
type PremiumBackfillRow = WctQuizSetCreateInput & { premiumDayId: string };

export function buildBackfillRows(
  books: readonly BackfillBook[],
  premiumLessons: readonly WctPremiumLesson[]
): Array<StandardBackfillRow | PremiumBackfillRow> {
  const standardRows = books.flatMap((book) => book.days.map((day) => ({
    ...generateWctQuizSetDraft(buildStandardWctQuizSource(book, day, book.days)),
    normalizedBookTitle: normalizeWctIdentity(book.title),
    dayNumber: day.dayNumber
  })));
  const premiumRows = premiumLessons.map((lesson) => ({
    ...generateWctQuizSetDraft(buildPremiumWctQuizSource(lesson)),
    premiumDayId: lesson.id
  }));
  return [...standardRows, ...premiumRows];
}

const scriptPath = process.argv[1];
if (scriptPath && import.meta.url === pathToFileURL(scriptPath).href) {
  await main(process.argv.slice(2));
}
```

- [ ] **Step 4: Generate an environment-portable migration**

For standard sets, emit one `insert ... select` per normalized book title and Day number with this escaping function:

```ts
function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function standardInsertSql(row: StandardBackfillRow) {
  return `insert into public.wct_quiz_sets(
  owner_id, lesson_key, source_kind, source_id,
  generator_version, source_hash, questions
)
select
  b.owner_id,
  ${sqlLiteral(row.lessonKey)},
  'wct_day',
  d.id::text,
  ${sqlLiteral(row.generatorVersion)},
  ${sqlLiteral(row.sourceHash)},
  ${sqlLiteral(JSON.stringify(row.questions))}::jsonb
from public.wct_books b
join public.wct_days d on d.book_id = b.id
where b.normalized_title = ${sqlLiteral(row.normalizedBookTitle)}
  and d.day_number = ${row.dayNumber}
on conflict (owner_id, lesson_key) do nothing;`;
}
```

For Premium Day 1, insert one row for every distinct current WCT owner:

```ts
function premiumInsertSql(row: PremiumBackfillRow) {
  return `insert into public.wct_quiz_sets(
  owner_id, lesson_key, source_kind, source_id,
  generator_version, source_hash, questions
)
select distinct
  b.owner_id,
  ${sqlLiteral(row.lessonKey)},
  'wct_premium',
  ${sqlLiteral(row.premiumDayId)},
  ${sqlLiteral(row.generatorVersion)},
  ${sqlLiteral(row.sourceHash)},
  ${sqlLiteral(JSON.stringify(row.questions))}::jsonb
from public.wct_books b
where b.normalized_title in ('wct prenovice', 'wct novice')
on conflict (owner_id, lesson_key) do nothing;`;
}
```

End the generated migration with this integrity block. It checks only owners who have both target books, so fresh environments without the historical backfill inventory remain migratable:

```sql
do $$
begin
  if exists (
    select target.owner_id
    from (
      select owner_id
      from public.wct_books
      where normalized_title in ('wct prenovice', 'wct novice')
      group by owner_id
      having count(distinct normalized_title) = 2
    ) target
    left join public.wct_quiz_sets quiz on quiz.owner_id = target.owner_id
    group by target.owner_id
    having count(quiz.id) filter (
      where quiz.generator_version = 'wct-review-v1'
        and jsonb_typeof(quiz.questions) = 'array'
        and jsonb_array_length(quiz.questions) = 5
    ) <> 45
  ) then
    raise exception 'WCT review quiz backfill did not create 45 valid sets';
  end if;
end;
$$;
```

Do not hard-code auth user UUIDs or environment-specific Day UUIDs.

- [ ] **Step 5: Generate and inspect the migration**

Run:

```bash
npm run wct:quiz-backfill:generate
git diff --check
rg -n "wct-review-v1|wct_premium|on conflict" supabase/migrations/20260728121000_backfill_wct_review_quizzes.sql
```

Expected: one generated migration, 44 standard inserts, one Premium insert template, no secrets, and no replacement characters.

- [ ] **Step 6: Check and apply dev migrations**

Run:

```bash
npm run db:status:dev
npm run db:migrate:dev
npm run db:status:dev
```

Expected:

- project ref is `uixpyibcpleuwsgemdno`;
- both new migrations apply in order;
- pending migrations `0`;
- checksum mismatches `0`.

- [ ] **Step 7: Verify count, validity, and Korean integrity**

Run:

```bash
npm run wct:quiz-backfill:verify
```

The command must regenerate the expected drafts in memory, load all stored sets, compare `lessonKey`, `sourceHash`, and the complete question payload, and print:

```text
projectRef=uixpyibcpleuwsgemdno
standardSets=44
premiumSets=1
questionSetsMatched=45
koreanTextMatched=45
```

Any `???`, Unicode replacement character, count mismatch, or field difference must exit nonzero.

- [ ] **Step 8: Re-run focused automated checks**

```bash
npm test -- tests/unit/wct-quiz-generator.test.ts tests/unit/wct-quiz-validation.test.ts
npm run verify:rls
```

Expected: all focused tests and local PostgreSQL RLS verification pass.

- [ ] **Step 9: Commit schema-backed data**

```bash
git add package.json tsconfig.json scripts/generate-wct-quiz-backfill.ts supabase/migrations/20260728121000_backfill_wct_review_quizzes.sql
git commit -m "data: backfill WCT Day review quizzes"
```

---

### Task 7: Build the Badge, Quiz Routes, and Immediate Feedback

**Files:**
- Create: `app/lessons/quiz-actions.ts`
- Create: `components/wct/WctQuizBadge.tsx`
- Create: `components/wct/WctQuizRunner.tsx`
- Modify: `app/lessons/books/[bookId]/days/[dayId]/page.tsx`
- Create: `app/lessons/books/[bookId]/days/[dayId]/quiz/page.tsx`
- Modify: `app/lessons/premium/days/[dayId]/page.tsx`
- Create: `app/lessons/premium/days/[dayId]/quiz/page.tsx`
- Create: `tests/unit/wct-quiz-actions.test.ts`
- Create: `tests/components/wct-quiz-badge.test.tsx`
- Create: `tests/components/wct-quiz-runner.test.tsx`

**Interfaces:**
- Consumes: `WctQuizSet`, `WctQuizSummary`, `WctQuizSubmission`, quiz store factories
- Produces:
  - `submitWctQuizAttemptAction(input): Promise<WctQuizActionResult>`
  - `<WctQuizBadge href summary />`
  - `<WctQuizRunner quizSet returnHref />`

- [ ] **Step 1: Write failing badge tests**

```tsx
it("shows the pending and completed labels", () => {
  const { rerender } = render(
    <WctQuizBadge href="/quiz" summary={{ quizSetId: "set-1", questionCount: 5, latestScore: null, completedAt: null }} />
  );
  expect(screen.getByRole("link", { name: "복습 문제 5개" })).toHaveAttribute("href", "/quiz");

  rerender(
    <WctQuizBadge href="/quiz" summary={{ quizSetId: "set-1", questionCount: 5, latestScore: 4, completedAt: "2026-07-28T00:00:00Z" }} />
  );
  expect(screen.getByRole("link", { name: "복습 완료 · 4/5" })).toBeVisible();
});
```

- [ ] **Step 2: Write failing runner tests**

Cover:

- progress begins at `1 / 5`;
- one selection locks all four choices;
- correct selection shows `정답이에요`;
- wrong selection shows `아쉬워요. 정답을 확인해 보세요.`;
- explanation appears only after selection;
- `다음 문제` advances;
- fifth answer still shows feedback, then `결과 보기` submits exactly five question/choice pairs;
- results show trusted `N / 5`;
- save failure shows `결과를 저장하지 못했어요. 다시 시도해 주세요.` and a retry button;
- `다시 풀기` resets local state with the same set;
- `Day로 돌아가기` uses the supplied return path.

- [ ] **Step 3: Run component tests and observe RED**

```bash
npm run test:components -- tests/components/wct-quiz-badge.test.tsx tests/components/wct-quiz-runner.test.tsx
```

Expected: FAIL because both components do not exist.

- [ ] **Step 4: Implement the typed server action test-first**

Write `tests/unit/wct-quiz-actions.test.ts` with mocked auth/store:

```ts
it("authenticates and returns the store-calculated score", async () => {
  mocks.submitAttempt.mockResolvedValue({ score: 4, total: 5, completedAt: "2026-07-28T00:00:00Z" });
  await expect(submitWctQuizAttemptAction(submission)).resolves.toEqual({
    ok: true, score: 4, total: 5, completedAt: "2026-07-28T00:00:00Z"
  });
});
```

Implement:

```ts
"use server";

export async function submitWctQuizAttemptAction(input: unknown): Promise<WctQuizActionResult> {
  const parsed = wctQuizSubmissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "답안을 확인해 주세요." };
  try {
    const user = await requireCurrentUser();
    const result = await getWctQuizStore(user).submitAttempt(parsed.data);
    return { ok: true, ...result };
  } catch {
    return { ok: false, message: "결과를 저장하지 못했어요. 다시 시도해 주세요." };
  }
}
```

- [ ] **Step 5: Implement the badge and runner**

The badge is a `Link` with the existing teal/white rounded style. The runner imports the server action, keeps `questionIndex`, selected answers, feedback, saving, result, and save-error state, and never accepts a second choice for the current question.

Implement the badge label exactly:

```tsx
export function WctQuizBadge({ href, summary }: {
  href: string;
  summary: WctQuizSummary;
}) {
  const label = summary.latestScore == null
    ? `복습 문제 ${summary.questionCount}개`
    : `복습 완료 · ${summary.latestScore}/${summary.questionCount}`;
  return (
    <Link
      href={href}
      className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-black text-teal-700"
    >
      {label}
    </Link>
  );
}
```

Use this locked-selection guard and final submission branch in the runner:

```tsx
function selectChoice(choiceId: string) {
  if (selectedChoiceId || saving || result) return;
  setSelectedChoiceId(choiceId);
  setAnswers([...answers, { questionId: question.id, choiceId }]);
}

async function showAndSaveResult() {
  if (answers.length !== 5 || saving) return;
  setShowResult(true);
  setSaving(true);
  const actionResult = await submitWctQuizAttemptAction({
    quizSetId: quizSet.id,
    answers
  });
  setSaving(false);
  if (actionResult.ok) {
    setResult(actionResult);
    setSaveError(null);
  } else {
    setSaveError(actionResult.message);
  }
}
```

After the fifth selection, keep the immediate feedback and explanation visible and render `결과 보기`. The results view calculates a local score from the stored answer key while saving; on failure it keeps that score visible with `저장되지 않았어요` and a retry button. Only a successful server result is treated as saved.

Render both quiz routes as a focused, full-screen, single-column experience with min-h-screen. Do not render the Day lesson body, adjacent lesson navigation, or a quiz modal around the runner.

Mark choices accessibly after selection:

- selected correct: ``aria-label={`${choice.text}, 정답`}``
- selected wrong: ``aria-label={`${choice.text}, 오답`}``
- unselected correct revealed after a wrong answer: ``aria-label={`${choice.text}, 정답`}``

- [ ] **Step 6: Add the standard detail badge and quiz route**

On the detail page, derive:

```ts
const lessonKey = standardWctLessonKey(book.title, day.dayNumber);
const summary = await getWctQuizStore(user).getSummaryByLessonKey(lessonKey);
```

Render the badge after the header only when `summary` is non-null.

The quiz page must load book, Day, and set; require `day.bookId === book.id`, `set.sourceKind === "wct_day"`, and `set.sourceId === day.id`. Any mismatch calls `notFound()`.

- [ ] **Step 7: Add Premium ensure, badge, and quiz route**

On authenticated Premium detail/quiz requests:

1. load the code-backed lesson;
2. query the normal quiz store;
3. if missing, call `ensurePremiumWctQuiz(getAdminWctQuizStore(user), lesson)`;
4. query the summary/set again;
5. verify `sourceKind === "wct_premium"` and `sourceId === lesson.id`.

Use return path `/lessons/premium/days/${lesson.id}`.

- [ ] **Step 8: Run unit and component tests to GREEN**

```bash
npm test -- tests/unit/wct-quiz-actions.test.ts
npm run test:components -- tests/components/wct-quiz-badge.test.tsx tests/components/wct-quiz-runner.test.tsx
```

Expected: action, badge, interaction, results, retry, and both return-path behaviors pass.

- [ ] **Step 9: Run lint and typecheck before committing**

```bash
npm run lint
npm run typecheck
```

Expected: zero warnings and zero type errors.

- [ ] **Step 10: Commit the learner-facing unit**

```bash
git add app/lessons components/wct/WctQuizBadge.tsx components/wct/WctQuizRunner.tsx tests/unit/wct-quiz-actions.test.ts tests/components/wct-quiz-badge.test.tsx tests/components/wct-quiz-runner.test.tsx
git commit -m "feat: add WCT Day review quiz flow"
```

---

### Task 8: Verify Standard and Premium Flows End to End

**Files:**
- Modify: `app/test/seed-wct-book/route.ts`
- Modify: `app/test/reset/route.ts`
- Create: `e2e/wct-day-review-quiz.spec.ts`
- Modify: `e2e/wct-course-library.spec.ts` only if an existing assertion must account for the new badge link

**Interfaces:**
- Consumes: E2E memory stores and automatic ensure helpers
- Produces: repeatable authenticated standard/Premium browser flow and owner-isolation coverage

- [ ] **Step 1: Write the failing Playwright flow**

Create tests that:

1. seed/reset memory data;
2. open standard Day 13;
3. see `복습 문제 5개`;
4. enter the standard quiz;
5. answer all five questions and observe feedback/explanation each time;
6. capture the trusted result text;
7. return and assert `복습 완료 · N/5` matches;
8. retake, finish, and assert the badge matches the second displayed result;
9. repeat one complete flow for Premium Day 1;
10. verify an other-owner standard quiz URL returns 404.

Use the visible first option for each question and parse the returned score rather than relying on a hidden correct-answer test hook.

```ts
for (let questionNumber = 1; questionNumber <= 5; questionNumber += 1) {
  await expect(page.getByText(`${questionNumber} / 5`)).toBeVisible();
  await page.getByRole("button").filter({ hasNotText: /다음 문제|다시/ }).first().click();
  await expect(page.getByText(/정답이에요|아쉬워요/)).toBeVisible();
  await expect(page.getByText("해설")).toBeVisible();
  if (questionNumber < 5) await page.getByRole("button", { name: "다음 문제" }).click();
}
await page.getByRole("button", { name: "결과 보기" }).click();
const scoreText = await page.getByText(/^[0-5] \/ 5$/).textContent();
expect(scoreText).not.toBeNull();
```

- [ ] **Step 2: Run the new E2E test and observe RED**

```bash
npx playwright test e2e/wct-day-review-quiz.spec.ts --project=mobile-chromium
```

Expected: FAIL because the test seed does not yet create/reset quiz state.

- [ ] **Step 3: Extend E2E seed/reset**

- Give the seeded book enough patterns and translated examples for valid four-choice generation.
- Call the same `ensureImportedWctQuizzes` helper after memory WCT import.
- Return both owner and other-owner book/Day IDs required by the guessed-route test.
- Reset `MemoryWctQuizStore` together with the existing expression and WCT stores.
- Do not add production-only behavior to test routes.

- [ ] **Step 4: Run targeted E2E to GREEN**

```bash
npx playwright test e2e/wct-day-review-quiz.spec.ts --project=mobile-chromium
npx playwright test e2e/wct-course-library.spec.ts --project=mobile-chromium
```

Expected: new quiz flow and existing WCT library regression flow pass.

- [ ] **Step 5: Run the full command-level gate**

```bash
npm run lint
npm run typecheck
npm test
npm run verify:rls
npm run db:status:dev
npm run wct:quiz-backfill:verify
npm run build
```

Expected:

- lint warnings `0`;
- type errors `0`;
- all Vitest projects pass;
- RLS verification passes;
- dev pending migrations `0`, checksum mismatches `0`;
- 45 stored sets and exact Korean payload matches;
- production build exits `0`.

- [ ] **Step 6: Restart the dev server after build**

Because `next build` may replace chunks used by an existing dev process, stop only the task-owned dev server and start:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Do not stop unrelated Node processes.

- [ ] **Step 7: Verify local and external route health**

Run:

```bash
curl -I http://127.0.0.1:3000/lessons
wsl_quiz_ip=$(hostname -I | awk '{print $1}')
curl -I "http://${wsl_quiz_ip}:3000/lessons"
```

Expected: authenticated content or the expected login redirect, never 500.

Use Playwright against the running app for one standard and one Premium route, complete five questions, return, and confirm the saved-score badge. Inspect the server log for `InternalServerError`, `500`, `Cannot find module`, missing chunks, schema errors, and failed server actions.

- [ ] **Step 8: Run the overcomplication and scope check**

Inspect:

```bash
git diff dev...HEAD --stat
git diff dev...HEAD -- app lib components scripts supabase tests e2e docs
```

Remove any abstraction, dependency, UI copy, or adjacent cleanup not required by the approved design. Keep the pre-existing duplicate `sourceNeedsReview` line in `lib/wct-store/memory-store.ts` out of this feature unless a failing task-owned test proves it blocks the work.

- [ ] **Step 9: Commit E2E and seed coverage**

```bash
git add app/test/seed-wct-book/route.ts app/test/reset/route.ts e2e/wct-day-review-quiz.spec.ts e2e/wct-course-library.spec.ts
git commit -m "test: cover WCT review quizzes end to end"
```

---

### Task 9: Complete the PRD and Record Verification Evidence

**Files:**
- Move: `docs/prd/active/wct-day-review-quiz/` to `docs/prd/complete/wct-day-review-quiz/`
- Modify: `docs/prd/complete/wct-day-review-quiz/README.md`
- Modify: `docs/prd/complete/wct-day-review-quiz/test-spec.md`
- Modify: `docs/prd/future-work.md`

**Interfaces:**
- Consumes: fresh outputs from Task 8 and dev data verification
- Produces: truthful Complete status with changed files, exact commands, live routes, and remaining risks

- [ ] **Step 1: Re-run the final evidence commands fresh**

```bash
npm run lint
npm run typecheck
npm test
npm run verify:rls
npm run db:status:dev
npm run wct:quiz-backfill:verify
npm run build
npx playwright test e2e/wct-day-review-quiz.spec.ts e2e/wct-course-library.spec.ts --project=mobile-chromium
```

Record exit codes, test counts, the two live quiz URLs used, local/external route results, and the server-log health check. Do not reuse earlier outputs.

- [ ] **Step 2: Move the PRD folder to Complete**

Move only the feature folder to `docs/prd/complete/wct-day-review-quiz/`. Change its status to `Complete` and record:

- schema/data migrations;
- domain/store/route/component/test files;
- dev project ref;
- 44 standard + 1 Premium set counts;
- Korean exact-match result;
- every verification command and outcome;
- remaining risk that main/production is untouched and requires separate authorization.

- [ ] **Step 3: Move `T-010` from Active to Complete**

In `docs/prd/future-work.md`, remove the active entry and add a dated Complete entry with the same evidence. Leave other tracker records unchanged.

- [ ] **Step 4: Check final status and diff**

```bash
git diff --check
git status --short
git log --oneline --decorate -10
```

Expected: only the PRD lifecycle move and evidence updates remain uncommitted; runtime files are already committed.

- [ ] **Step 5: Commit completion evidence**

```bash
git add -A docs/prd/active/wct-day-review-quiz docs/prd/complete/wct-day-review-quiz docs/prd/future-work.md
git commit -m "docs: complete WCT Day review quiz PRD"
```

- [ ] **Step 6: Verify the committed tree once more**

```bash
git status --short
git diff --check HEAD^ HEAD
```

Expected: clean working tree and no whitespace errors.

Do not merge, push, apply main migrations, or delete the feature branch without a separate user instruction. The source branch is `codex/wct-day-review-quiz`; the intended integration target remains `dev`.
