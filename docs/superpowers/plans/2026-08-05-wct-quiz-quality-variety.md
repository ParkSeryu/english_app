# WCT Quiz Quality and Variety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 44 standard WCT Day quiz sets with audited, source-faithful v2 questions in three choice-only formats, make Pop Quiz retakes rotate every Day's format/question, reset obsolete progress, and release the result safely to production.

**Architecture:** Preserve the stored five-question set and choice-ID scoring model, while separating semantic `kind` from optional interaction `format`. A target-Day-only standard source adapter feeds finite controlled mutations, format-specific candidates, a book-level composer, hash-guarded overrides, and a full-inventory audit; Premium stays on a separate v1 entry point. Standard set synchronization and Pop snapshot invalidation happen through one service-role-only batch RPC, while deployment is split into compatibility checkpoint A and reviewed data checkpoint B.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.9, Zod 4, Vitest/Testing Library, Playwright mobile Chromium, Supabase PostgreSQL/RLS, Flyway-style migration ledger, Vercel Production from `main`.

## Global Constraints

- Scope is standard WCT Prenovice 16 Days and Novice 28 Days: 44 sets and 220 questions.
- Production target book IDs are immutable release constants: Prenovice `740b33b4-4338-4d43-8287-6edaa7bd0635` and Novice `aa2233e4-6eca-4716-94d6-78e605eb1523`; hosted tooling must select by these IDs and then verify title/level/count, never select by title alone.
- WCT Premium remains `wct-review-v1`; its questions, progress, routes, and learner behavior do not change.
- Standard sets use `wct-review-v2` and exactly five questions: two `multiple_choice`, two `fill_blank`, and one `true_false`.
- Every standard set has three `translation` and two `pattern` semantic kinds, with no adjacent identical formats.
- O/X answers balance exactly `8 O / 8 X` for Prenovice and `14 O / 14 X` for Novice; each Pop attempt's O/X subset differs by at most one.
- `true_false` has exactly two choice buttons (`O`, `X`); the other formats have exactly four choice buttons.
- No typing, free-text, audio, speech, runtime model call, quiz editor, attempt history, timer, ranking, or unrelated WCT cleanup.
- Correct sentences and patterns come only from the target Day's approved, non-review-pending source. No neighboring-Day corpus distractors.
- Prompts, choices, and structured question feedback must not contain `WCT`, `Day N`, `Prenovice`, or `Novice`; the confirmed source line `Day N · topic` is the sole intentional exception.
- A wrong choice changes exactly one declared target under one grammar-rule family. If one answer cannot be defended, generation fails closed and the Day uses a source-hash-guarded full-Day override.
- Legacy questions omit `format` and structured feedback. Interpret them as multiple choice without adding fields to parsed/snapshotted JSON.
- Pop Quiz stays one question per Day: 16 Prenovice and 28 Novice, ascending by Day.
- First v2 Pop attempts use a balanced three-format schedule. Retakes rotate each previous format with `multiple_choice → fill_blank → true_false → multiple_choice`, and every Day must change both format and question ID.
- Refresh/resume preserves the stored attempt. Day/topic remains hidden until `정답 확인` and then appears with correct sentence, original pattern, and exact reason.
- Existing standard Day scores and targeted Prenovice/Novice Pop attempts are reset once when v2 data replaces v1. WCT source rows and Premium rows are untouched.
- Standard sync idempotence is keyed by generator version plus source hash. If those match but canonical question JSON differs, fail as a generator/version integrity collision; do not overwrite or reset progress until the generator version or source hash legitimately changes.
- The sole hosted target is main/production Supabase project `ccawzrrkxuirrwvaecvw`; verify `.env.local` before every hosted read or write.
- Every migration-managed hosted schema/data release write uses `npm run db:migrate -- --confirm-production` with fresh explicit confirmation immediately before execution. Any separate learner/API smoke action that would write production rows needs its own immediately-before confirmation, exact test-user scope, and rollback or narrowly identified cleanup; it does not bypass or masquerade as a migration.
- Do not edit or baseline an applied migration. Checkpoint A creates only `20260805120000_add_wct_quiz_v2_compatibility.sql`; checkpoint B creates `20260805130000_replace_wct_standard_quizzes_v2.sql` only after checkpoint A is deployed and healthy.
- The migration runner applies every pending file. The checkpoint-B data migration must not exist when checkpoint A is applied.
- After data conversion, never roll production back to a v1-only app without first restoring compatible data through a new forward migration.
- Hosted Korean text must be read back and compared exactly; JSONB is compared through canonical semantic serialization/hash, not byte order.
- Follow TDD for runtime code: write the focused failing test, observe the expected failure, implement the minimum behavior, rerun green, then commit.
- Preserve unrelated worktree changes. Every changed line must trace to this feature.
- Runtime completion requires lint, typecheck, focused/full tests, RLS verification, build, mobile E2E, healthy `0.0.0.0` routes, fatal-log scan, production readback, and authenticated deployed-route smoke.

---

## File Structure

### Shared contract and legacy compatibility

- Modify `lib/wct/quiz/types.ts`: separate v1/v2 constants, optional format/feedback, standard sync types, and non-materializing format helper.
- Modify `lib/wct/quiz/validation.ts`: one shared question parser plus version-specific set refinements.
- Modify `lib/wct/pop-quiz/validation.ts`: reuse the shared question parser instead of maintaining a second four-choice schema.
- Modify `lib/wct/quiz/adapters.ts`: rename the old standard adapter as legacy-only and preserve the Premium v1 adapter.
- Modify `lib/wct/quiz/generator.ts`: expose explicit legacy and Premium v1 entry points; never dispatch standard v2 through it.

### Standard v2 source and generation

- Create `lib/wct/quiz/standard/types.ts`: source entries, mutation evidence, candidates, overrides, audit rows, and generated-book result.
- Create `lib/wct/quiz/standard/source.ts`: target-Day canonicalization, eligibility checks, level identity, and source hash.
- Create `lib/wct/quiz/standard/mutations.ts`: finite token/span mutation recipes with one-change evidence.
- Create `lib/wct/quiz/standard/candidates.ts`: sentence-choice, blank-choice, and O/X candidate builders.
- Create `lib/wct/quiz/standard/overrides.ts`: full-Day overrides keyed by level, Day number, and expected source hash.
- Create `lib/wct/quiz/standard/generator.ts`: five-slot composition, book-wide O/X allocation, deterministic IDs/order, override application, and validated drafts.
- Create `lib/wct/quiz/standard/audit.ts`: 44/220 inventory validation, provenance checks, metadata leak checks, canonical hashes, and human-readable rows.

### Store, import, and stale-source protection

- Modify `lib/wct-quiz-store/contract.ts`: add service-role-only atomic `syncStandardSets`.
- Modify `lib/wct-quiz-store/memory-store.ts`: atomic batch replacement, progress reset, and result counts.
- Modify `lib/wct-quiz-store/supabase-store.ts`: call the v2 batch RPC and preserve Premium create-if-missing.
- Modify `lib/wct-quiz-store/mappers.ts`: parse v1/v2 sets without adding legacy fields.
- Modify `lib/wct-pop-quiz-store/memory-store.ts`: expose exact owner/book invalidation for the memory sync path.
- Modify `lib/wct/quiz/ensure.ts`: zero/all-v1/all-v2/mixed inventory gate, full-book preflight, and one batch sync after an approved import; Premium stays v1.
- Modify `app/api/wct/import/route.ts`: preserve the separate source-import transaction and surface the exact quiz-sync failure.
- Create `lib/wct/quiz/current-set.ts`: version-aware current source-hash comparison for standard sets.
- Modify standard Day/detail/quiz routes, `app/lessons/quiz-actions.ts`, Pop service, and Pop route to reject stale sets/snapshots.

### Pop selection and learner UI

- Modify `lib/wct/pop-quiz/types.ts`, `selector.ts`, and `service.ts`: complete-version detection, first-attempt format schedule, per-Day retake rotation, current-source checks, and mixed-inventory rejection.
- Modify `components/wct/WctQuizQuestionStep.tsx`: explicit-format badge/layout and structured feedback.
- Modify `components/wct/WctQuizRunner.tsx`: standard Day/topic feedback context and source context for trusted submission.
- Modify `components/wct/WctPopQuizRunner.tsx`: retain confirmed-only Day/topic feedback and render v2 details.
- Modify `app/lessons/books/[bookId]/days/[dayId]/quiz/page.tsx` and Pop actions/page for new contracts and stale-attempt messaging.

### Schema, release tooling, fixtures, and lifecycle

- Create `supabase/migrations/20260805120000_add_wct_quiz_v2_compatibility.sql`: batch sync RPC plus dual-version Pop start validation.
- Create only after checkpoint A: `supabase/migrations/20260805130000_replace_wct_standard_quizzes_v2.sql`.
- Create `scripts/generate-wct-quiz-v2.ts`: main-only source read, audit, approval, fixture/SQL generation, and post-apply verification.
- Modify `package.json`: safe v2 audit/approve/generate/fixture/verify commands; remove the command that can overwrite the applied v1 backfill migration.
- Modify `scripts/verify-rls.sql`/`verify-rls-local.sh`, create bounded concurrency and seeded checkpoint-B effect/rollback helpers, and add static migration tests.
- Modify `app/test/seed-wct-book/route.ts`, `app/test/reset/route.ts`, and both WCT E2E specs.
- Create and later move `docs/prd/active/wct-quiz-quality-variety/`; update `docs/prd/future-work.md` and `docs/prd/README.md`.

---

### Task 1: Activate T-011 and create the implementation artifacts

**Files:**
- Create: `docs/prd/active/wct-quiz-quality-variety/README.md`
- Create: `docs/prd/active/wct-quiz-quality-variety/prd.md`
- Create: `docs/prd/active/wct-quiz-quality-variety/test-spec.md`
- Create: `docs/prd/active/wct-quiz-quality-variety/implementation-plan.md`
- Modify: `docs/prd/future-work.md`
- Modify: `docs/prd/README.md`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-08-05-wct-quiz-quality-variety-design.md` and this plan.
- Produces: one Active tracker item, `T-011`, whose folder remains Active through both production checkpoints.

- [ ] **Step 1: Create the active README and canonical links**

Write this exact role/status structure:

```markdown
# WCT Quiz Quality and Variety

- Status: Active
- Tracker: `docs/prd/future-work.md#t-011-wct-quiz-quality-and-variety`
- PRD: `prd.md`
- Test spec: `test-spec.md`
- Canonical implementation plan:
  `docs/superpowers/plans/2026-08-05-wct-quiz-quality-variety.md`
- Approved design:
  `docs/superpowers/specs/2026-08-05-wct-quiz-quality-variety-design.md`

This folder remains Active until checkpoint A compatibility deployment,
checkpoint B 44-set replacement/readback, and authenticated production route
verification all pass.
```

- [ ] **Step 2: Write the PRD from the approved specification**

Record the user problem, 44-Day scope, three formats, no typing, target-Day-only source rule, per-Day Pop retake rotation, progress reset, Premium exclusion, two-checkpoint production boundary, and acceptance criteria. Use this testable summary:

```markdown
The feature is accepted when all 44 standard sets are audited v2 payloads,
every Day quiz has the 2/2/1 button-only format mix, every Pop retake changes
format and question for all 16 or 28 Days, old targeted progress is reset,
Premium remains v1, and production readback plus live routes pass.
```

- [ ] **Step 3: Write the test specification**

Include a table with rows for shared validation, source/provenance, controlled mutations, five-slot composition, O/X balances, overrides, 44/220 audit, memory/Supabase sync, progress reset, v1/Premium compatibility, Pop selection/retakes, UI feedback timing, RLS/RPC, migration rollback, mobile E2E, local routes, production readback, and deployed smoke.

- [ ] **Step 4: Link this canonical plan**

Write `implementation-plan.md` as:

```markdown
# WCT Quiz Quality and Variety Implementation Plan

The canonical step-by-step plan is:

`docs/superpowers/plans/2026-08-05-wct-quiz-quality-variety.md`
```

- [ ] **Step 5: Add T-011 under `## Active` and update the index**

In `docs/prd/future-work.md`, add `T-011: WCT Quiz Quality and Variety` with `Status: Active`, the exact surface, both migration names, the four artifact links, explicit 44/220 and production criteria, and no adjacent scope. Add one Active row to `docs/prd/README.md`.

- [ ] **Step 6: Verify and commit the lifecycle transition**

Run:

```bash
git diff --check
git status --short
```

Expected: this canonical plan is already committed before execution, so only the four new active PRD files and the two tracker/index files are changed.

Commit:

```bash
git add docs/prd/active/wct-quiz-quality-variety docs/prd/future-work.md docs/prd/README.md
git commit -m "docs: activate WCT quiz quality overhaul"
```

---

### Task 2: Add the dual-version, format-aware question contract

**Files:**
- Modify: `lib/wct/quiz/types.ts`
- Modify: `lib/wct/quiz/validation.ts`
- Modify: `lib/wct/pop-quiz/validation.ts`
- Modify: `lib/wct/quiz/adapters.ts`
- Modify: `lib/wct/quiz/generator.ts`
- Modify: `lib/wct-quiz-store/mappers.ts`
- Modify: `scripts/generate-wct-quiz-backfill.ts`
- Test: `tests/unit/wct-quiz-validation.test.ts`
- Test: `tests/unit/wct-pop-quiz-validation.test.ts`
- Test: `tests/unit/wct-quiz-generator.test.ts`
- Test: `tests/unit/wct-quiz-backfill.test.ts`

**Interfaces:**
- Consumes: legacy v1 standard/Premium rows and immutable Pop question snapshots.
- Produces:
  - `WCT_STANDARD_QUIZ_GENERATOR_VERSION = "wct-review-v2"`
  - `WCT_PREMIUM_QUIZ_GENERATOR_VERSION = "wct-review-v1"`
  - `WctQuizQuestionFormat`
  - optional `WctQuizQuestion.format` and `WctQuizQuestion.feedback`
  - `getWctQuizQuestionFormat(question)` without JSON mutation
  - exported `wctQuizQuestionSchema` reused by Pop validation
  - explicit `generateLegacyWctQuizSetDraft` and `generatePremiumWctQuizSetDraft`

- [ ] **Step 1: Write failing shared-contract tests**

Add these cases:

```ts
it("accepts v2 O/X with two choices and structured feedback", () => {
  const parsed = wctStandardQuizSetCreateSchema.parse(v2Draft({
    format: "true_false",
    choices: [choice("o", "O"), choice("x", "X")]
  }));
  expect(parsed.questions[0].format).toBe("true_false");
});

it("accepts v1 without materializing format or feedback", () => {
  const parsed = wctQuizSetSchema.parse(legacyStoredSet());
  expect("format" in parsed.questions[0]).toBe(false);
  expect(getWctQuizQuestionFormat(parsed.questions[0])).toBe("multiple_choice");
});

it("rejects format/count and version/source mismatches", () => {
  expect(() => wctStandardQuizSetCreateSchema.parse(v2TrueFalseWithFourChoices()))
    .toThrow();
  expect(() => wctStandardQuizSetCreateSchema.parse(v2SetWithWrongFormatMix()))
    .toThrow();
  expect(() => wctStandardQuizSetCreateSchema.parse(v2SetWithAdjacentFormats()))
    .toThrow();
  expect(() => wctStandardQuizSetCreateSchema.parse(v2PremiumSet()))
    .toThrow();
});
```

In the Pop validation test, feed the same two-choice v2 question through `wctPopQuizQuestionsSchema`, retain a raw legacy snapshot without `format`, and prove the parsed legacy question still has no own `format` property. In the generator/backfill tests, prove Premium output remains v1 and the historical v1 backfill still produces 45 legacy sets without calling the standard v2 generator.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
npm test -- tests/unit/wct-quiz-validation.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/unit/wct-quiz-generator.test.ts tests/unit/wct-quiz-backfill.test.ts
```

Expected: FAIL because only one v1 constant exists, every schema requires four choices, Pop duplicates the old schema, and there are no explicit Premium/legacy entry points.

- [ ] **Step 3: Define the exact shared types**

In `lib/wct/quiz/types.ts`, add:

```ts
export const WCT_STANDARD_QUIZ_GENERATOR_VERSION = "wct-review-v2" as const;
export const WCT_PREMIUM_QUIZ_GENERATOR_VERSION = "wct-review-v1" as const;

export type WctQuizGeneratorVersion =
  | typeof WCT_STANDARD_QUIZ_GENERATOR_VERSION
  | typeof WCT_PREMIUM_QUIZ_GENERATOR_VERSION;

export type WctQuizQuestionFormat =
  | "multiple_choice"
  | "fill_blank"
  | "true_false";

export type WctQuizFeedback = {
  correctSentence: string;
  pattern: string;
  reason: string;
};

export type WctQuizQuestion = {
  id: string;
  kind: WctQuizQuestionKind;
  format?: WctQuizQuestionFormat;
  prompt: string;
  choices: WctQuizChoice[];
  correctChoiceId: string;
  explanation: string;
  feedback?: WctQuizFeedback;
};

export function getWctQuizQuestionFormat(
  question: WctQuizQuestion
): WctQuizQuestionFormat {
  return question.format ?? "multiple_choice";
}
```

Change set-create/stored-set generator versions to `WctQuizGeneratorVersion`. Do not use a Zod or object-spread default for `format` or `feedback`.

- [ ] **Step 4: Implement one format-aware shared question parser**

Export `wctQuizQuestionSchema` from `lib/wct/quiz/validation.ts`. Keep `format` and `feedback` optional in the base object, then refine without transforming:

```ts
const format = question.format ?? "multiple_choice";
const expectedChoices = format === "true_false" ? 2 : 4;
if (question.choices.length !== expectedChoices) {
  context.addIssue({
    code: "custom",
    path: ["choices"],
    message: `${format} needs exactly ${expectedChoices} choices`
  });
}
```

Keep unique IDs/text and correct-choice membership. Add `wctStandardQuizSetCreateSchema` that requires `sourceKind === "wct_day"`, generator v2, explicit `format` plus complete `feedback` on all five questions, exact 2/2/1 format counts, exact 3/2 translation/pattern counts, and no adjacent identical formats. Reject `concept` in v2 standard sets. Keep `wctQuizSetSchema` dual-read and allow legacy v1 standard rows plus v1 Premium rows. In `lib/wct/pop-quiz/validation.ts`, import the shared parser and remove its duplicate choice/question schema.

- [ ] **Step 5: Split legacy/Premium generation from standard v2**

Rename the existing standard adapter to `buildLegacyStandardWctQuizSource`. Rename the generic v1 generator to `generateLegacyWctQuizSetDraft`, then add a guarded wrapper:

```ts
export function generatePremiumWctQuizSetDraft(
  source: WctQuizSource
): WctQuizSetCreateInput {
  if (source.sourceKind !== "wct_premium") {
    throw new Error("Premium v1 generator requires a Premium source");
  }
  return generateLegacyWctQuizSetDraft(source);
}
```

Use the explicit v1 constant inside legacy generation. Update the historical backfill script/tests to the renamed legacy functions. Do not change any applied migration file.

- [ ] **Step 6: Run the focused tests and verify GREEN**

Run:

```bash
npm test -- tests/unit/wct-quiz-validation.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/unit/wct-quiz-generator.test.ts tests/unit/wct-quiz-backfill.test.ts
npm run typecheck
```

Expected: all focused tests pass; v1 JSON remains raw, O/X accepts two choices, v2 standard validation is strict, Premium remains v1, and types compile.

- [ ] **Step 7: Commit the contract**

```bash
git add lib/wct/quiz/types.ts lib/wct/quiz/validation.ts lib/wct/pop-quiz/validation.ts lib/wct/quiz/adapters.ts lib/wct/quiz/generator.ts lib/wct-quiz-store/mappers.ts scripts/generate-wct-quiz-backfill.ts tests/unit/wct-quiz-validation.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/unit/wct-quiz-generator.test.ts tests/unit/wct-quiz-backfill.test.ts
git commit -m "refactor: add dual-version WCT quiz contract"
```

---

### Task 3: Build target-Day source canonicalization and controlled candidates

**Files:**
- Create: `lib/wct/quiz/standard/types.ts`
- Create: `lib/wct/quiz/standard/source.ts`
- Create: `lib/wct/quiz/standard/mutations.ts`
- Create: `lib/wct/quiz/standard/candidates.ts`
- Test: `tests/unit/wct-quiz-standard-source.test.ts`
- Test: `tests/unit/wct-quiz-mutations.test.ts`
- Test: `tests/unit/wct-quiz-candidates.test.ts`

**Interfaces:**
- Consumes: one `WctBook`, one complete `WctDay`, approved pattern/example relations, and `normalizeWctIdentity`/`stableStringify`.
- Produces:
  - `buildStandardWctQuizSource(book, day): WctStandardQuizSource`
  - `computeStandardWctQuizSourceHash(book, day): string`
  - `enumerateSentenceMutations(entry): WctMutationEvidence[]`
  - `enumerateBlankCandidates(entry): WctBlankCandidate[]`
  - format-specific candidate builders carrying audit provenance

- [ ] **Step 1: Write failing source-isolation and eligibility tests**

Use two complete Day fixtures and assert target-Day canonicalization:

```ts
it("keeps exact approved target-Day source references", () => {
  const first = buildStandardWctQuizSource(book, dayOne);

  expect(first.sourceHash).toBe(
    computeStandardWctQuizSourceHash(book, dayOne)
  );
  expect(first.entries[0]).toMatchObject({
    patternId: dayOne.patterns[0].id,
    exampleId: dayOne.patterns[0].examples[0].id,
    englishText: dayOne.patterns[0].examples[0].englishText
  });
});

it("rejects review-pending and course-metadata source", () => {
  expect(() => buildStandardWctQuizSource(book, { ...dayOne, sourceNeedsReview: true }))
    .toThrow("WCT v2 needs approved target-Day source");
  expect(() => buildStandardWctQuizSource(book, dayWithOnlyReviewPendingSource))
    .toThrow("WCT v2 needs approved target-Day source");
  expect(() => buildStandardWctQuizSource(book, dayWhoseExamplesContainWctAndDayLabels))
    .toThrow("WCT v2 needs approved target-Day source");
});
```

Clone the same Day content under a different Day ID/lesson key and assert its source hash differs, preventing cross-Day identity collisions. Prove an approved entry with no Korean meaning remains available for `pattern` candidates but is excluded from `translation` candidates. Also prove level resolution accepts `Pre Novice`/Prenovice and Novice, but rejects Premium or a title/level mismatch. The public source/hash signatures must not accept `allDays` or a book-wide sentence corpus; Task 4's book-generation test proves changing `dayTwo` leaves `dayOne`'s hash, IDs, and payload unchanged.

- [ ] **Step 2: Write failing mutation, blank, and format-candidate tests**

Use explicit source entries for modal, agreement, tense, conditional, and indirect-question families. Assert every mutation records one changed span and one shared rule family:

```ts
const mutations = enumerateSentenceMutations(modalEntry);
expect(mutations).toEqual(expect.arrayContaining([
  expect.objectContaining({
    recipe: "modal_choice",
    changedFrom: "can",
    reason: expect.stringContaining("can")
  })
]));
for (const mutation of mutations) {
  expect(diffSpans(modalEntry.englishText, mutation.text)).toHaveLength(1);
}
```

For blanks, require exactly one `____` marker and exact reconstruction:

```ts
const blank = enumerateBlankCandidates(indirectQuestionEntry)[0];
expect(blank.promptSentence.match(/____/g)).toHaveLength(1);
expect(blank.reconstruct(blank.correctText)).toBe(indirectQuestionEntry.englishText);
expect(new Set(blank.choices.map((choice) => choice.category))).toEqual(
  new Set([blank.choices[0].category])
);
```

In `wct-quiz-candidates.test.ts`, assert sentence choice uses the exact source plus three same-family one-span mutations, fill-blank has one marker and exact reconstruction, O uses the source verbatim, X uses exactly one evidenced mutation, and only O/X has two choices. Add negative fixtures where the source pattern/usage explicitly permits an alternative, a token occurs twice, no pattern anchor exists, or a mutation changes two spans; expect no candidate instead of a guessed distractor.

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
npm test -- tests/unit/wct-quiz-standard-source.test.ts tests/unit/wct-quiz-mutations.test.ts tests/unit/wct-quiz-candidates.test.ts
```

Expected: FAIL because the standard v2 source and mutation modules do not exist.

- [ ] **Step 4: Define the internal source and evidence types**

In `lib/wct/quiz/standard/types.ts`, define focused non-React types:

```ts
export type WctStandardLevel = "prenovice" | "novice";

export type WctStandardSourceEntry = {
  patternId: string;
  exampleId: string;
  patternText: string;
  patternMeaningKo: string | null;
  usageNote: string | null;
  englishText: string;
  meaningKo: string | null;
};

export type WctStandardQuizSource = {
  lessonKey: string;
  sourceId: string;
  level: WctStandardLevel;
  dayNumber: number;
  topic: string;
  sourceHash: string;
  entries: WctStandardSourceEntry[];
};

export type WctMutationEvidence = {
  recipe: string;
  ruleFamily: string;
  text: string;
  changedFrom: string;
  changedTo: string;
  start: number;
  end: number;
  reason: string;
};

export type WctQuestionProvenance = {
  patternId: string;
  exampleId: string;
  sourceSentence: string;
  choiceEvidence: Array<{
    choiceText: string;
    role: "correct" | "distractor";
    mutation?: WctMutationEvidence;
  }>;
  statementMutation?: WctMutationEvidence;
  blankSpan?: { start: number; end: number; correctText: string };
};

export type WctBlankCandidate = {
  promptSentence: string;
  correctText: string;
  choices: Array<{
    text: string;
    category: string;
    role: "correct" | "distractor";
    mutation?: WctMutationEvidence;
  }>;
  reconstruct(choiceText: string): string;
};

export type WctStandardQuestionCandidate = {
  question: WctQuizQuestion & {
    kind: "translation" | "pattern";
    format: WctQuizQuestionFormat;
    feedback: WctQuizFeedback;
  };
  provenance: WctQuestionProvenance;
};

export type WctGeneratedStandardQuizSet = {
  source: WctStandardQuizSource;
  draft: WctQuizSetCreateInput & {
    sourceKind: "wct_day";
    generatorVersion: "wct-review-v2";
  };
  candidates: readonly WctStandardQuestionCandidate[];
};

export type WctGeneratedStandardQuizBook = {
  bookId: string;
  level: WctStandardLevel;
  sets: readonly WctGeneratedStandardQuizSet[];
};
```

Add candidate types that contain a complete explicit-format v2 question plus provenance; only the question is persisted later. Every sentence/blank distractor has its own `choiceEvidence.mutation`; the correct choice has no mutation; an X statement uses `statementMutation`. Audit fails when evidence cardinality does not match the displayed alternatives.

- [ ] **Step 5: Implement target-Day canonicalization and hashing**

In `source.ts`, reject the complete Day when `day.sourceNeedsReview` is true. Resolve level from normalized book title plus `levelLabel`, sort patterns/examples by `sortOrder`, and keep only entries with non-empty English/pattern text, false `sourceNeedsReview` on pattern and example, and no forbidden learner text. Preserve nullable Korean meanings: a pattern-format candidate may use an otherwise approved entry without Korean, while a translation-format candidate must require the exact non-empty Korean meaning it displays. Use a token-aware forbidden regex and hash only the normalized target-Day payload:

```ts
const sourceHashInput = {
  lessonKey,
  sourceId: day.id,
  level,
  dayNumber: day.dayNumber,
  topic: day.shortLabel,
  entries: entries.map((entry) => ({
    patternId: entry.patternId,
    exampleId: entry.exampleId,
    patternText: entry.patternText,
    patternMeaningKo: entry.patternMeaningKo,
    usageNote: entry.usageNote,
    englishText: entry.englishText,
    meaningKo: entry.meaningKo
  }))
};
```

Hash with SHA-256 over `stableStringify(sourceHashInput)`. Do not accept or read `allDays`, and do not include book-wide examples.

- [ ] **Step 6: Implement finite one-span mutation recipes**

In `mutations.ts`, implement token-aware recipes with explicit preconditions. Start with these reviewable families:

```ts
const agreementPairs = [["do", "does"], ["is", "are"], ["was", "were"], ["has", "have"]] as const;
const tensePairs = [["do", "did"], ["is", "was"], ["are", "were"], ["will", "would"], ["can", "could"]] as const;
const modalChoices = ["can", "could", "will", "would", "should", "might"] as const;
```

Add anchored recipes for modal presence, conditional-clause tense, and indirect-question word order only when `patternText`/`usageNote` declares that rule. A helper must replace exactly one token/span and return no evidence when the match is missing or repeated. Keep three distractors in one question under the same `ruleFamily`, so the single structured `reason` explains every alternative precisely.

- [ ] **Step 7: Implement format-specific candidate builders**

In `candidates.ts`:

- `multiple_choice` uses the Korean meaning or pattern target, exact source sentence, and three one-span mutations in one family.
- `fill_blank` blanks one anchored core chunk, produces four same-category chunks, verifies correct insertion reconstructs the exact source, and records one full-sentence reconstruction/mutation evidence item for each wrong chunk.
- `true_false` receives the required O/X state. O uses exact source; X uses one safe mutation. Choices are exactly `O` and `X`.

The candidate's `choiceEvidence` must correspond one-to-one with its stored sentence/blank choices; X additionally carries `statementMutation`. Every question prompt must avoid Day/course metadata. Populate:

```ts
feedback: {
  correctSentence: entry.englishText,
  pattern: entry.patternText,
  reason: candidate.reason
}
```

Reject candidates with duplicate normalized choices, a source-declared equivalent alternative, missing provenance, or more than one mutation span. Mechanical code may reject only explicit deterministic ambiguity signals; general answer defensibility remains a mandatory row-by-row editorial decision in Task 9/11.

- [ ] **Step 8: Run focused tests and verify GREEN**

Run:

```bash
npm test -- tests/unit/wct-quiz-standard-source.test.ts tests/unit/wct-quiz-mutations.test.ts tests/unit/wct-quiz-candidates.test.ts
npm run typecheck
```

Expected: all source isolation, forbidden-text, one-span, anchored recipe, blank reconstruction, and deterministic ambiguity-guard tests pass.

- [ ] **Step 9: Commit source and candidates**

```bash
git add lib/wct/quiz/standard/types.ts lib/wct/quiz/standard/source.ts lib/wct/quiz/standard/mutations.ts lib/wct/quiz/standard/candidates.ts tests/unit/wct-quiz-standard-source.test.ts tests/unit/wct-quiz-mutations.test.ts tests/unit/wct-quiz-candidates.test.ts
git commit -m "feat: build controlled WCT v2 candidates"
```

---

### Task 4: Compose five-question books, overrides, and the quality audit

**Files:**
- Create: `lib/wct/quiz/standard/overrides.ts`
- Create: `lib/wct/quiz/standard/generator.ts`
- Create: `lib/wct/quiz/standard/audit.ts`
- Test: `tests/unit/wct-quiz-standard-generator.test.ts`
- Test: `tests/unit/wct-quiz-audit.test.ts`

**Interfaces:**
- Consumes: all complete Days for one eligible book and the candidate/provenance contract from Task 3.
- Produces:
  - `generateStandardWctQuizBook(book, days, overrides?)`
  - exact five-slot v2 sets for every current Day
  - residue-balanced O/X allocation
  - fail-closed `(level, dayNumber, expectedSourceHash)` overrides
  - `auditStandardWctQuizInventory(generated)` and stable canonical hashes

- [ ] **Step 1: Write failing five-slot and deterministic-output tests**

Build metadata-free 16-Day and 28-Day fixtures with safe anchored patterns. Assert each set:

```ts
expect(countBy(set.questions, "format")).toEqual({
  multiple_choice: 2,
  fill_blank: 2,
  true_false: 1
});
expect(countBy(set.questions, "kind")).toEqual({
  translation: 3,
  pattern: 2
});
expect(hasAdjacentEqual(set.questions.map((question) => question.format)))
  .toBe(false);
expect(new Set(set.questions.map((question) => question.prompt))).toHaveSize(5);
```

Assert the generator rejects missing/duplicate/extra Day numbers and any Prenovice count other than 16 or Novice count other than 28. Assert the same valid book generates equal lesson keys/source IDs/question IDs/order/payload twice, v1 question IDs cannot collide with v2 IDs, and every draft passes `wctStandardQuizSetCreateSchema`. Change only Day 2's topic/example, regenerate the book, and assert Day 1's source hash, lesson key, source ID, question IDs, and payload are identical while only Day 2 changes. Stored database set UUID preservation is tested later in Task 5 because create drafts do not have a set ID.

- [ ] **Step 2: Write failing O/X allocation and override tests**

For each book, group ordered Day positions by `index % 3`. Assert each group alternates O/X and differs by at most one; assert total truth values are 8/8 and 14/14. This proves every Pop format offset receives a balanced O/X subset.

Add an X-unsafe fixture and a safe O Day in the same residue group. Assert the allocator swaps their states within that group without changing counts. Add a stale override:

```ts
expect(() => generateStandardWctQuizBook(book, days, [{
  level: "prenovice",
  dayNumber: 7,
  expectedSourceHash: "0".repeat(64),
  questions: overrideQuestions
}])).toThrow("WCT v2 override source hash mismatch");
```

Prove an override correct answer/pattern not present in the target source is rejected.

- [ ] **Step 3: Write failing full-audit tests**

Create an inventory with one mutation lacking evidence, one `Day 2` prompt, one duplicate normalized choice, one blank that does not reconstruct, and one question whose two choices collapse to the same normalized/source-declared answer. Each mechanically provable case must report level, Day number, question ID, and exact failed rule. Do not claim the audit can prove general semantic ambiguity; that gate is the complete editorial review. For good fixtures assert:

```ts
expect(audit.summary).toEqual({
  books: 2,
  days: 44,
  questions: 220,
  prenoviceTrue: 8,
  prenoviceFalse: 8,
  noviceTrue: 14,
  noviceFalse: 14
});
expect(audit.rows).toHaveLength(220);
expect(audit.questionArtifactHash).toMatch(/^[a-f0-9]{64}$/);
```

- [ ] **Step 4: Run the focused tests and verify RED**

Run:

```bash
npm test -- tests/unit/wct-quiz-standard-generator.test.ts tests/unit/wct-quiz-audit.test.ts
```

Expected: FAIL because composition, allocation, overrides, and audit modules do not exist.

- [ ] **Step 5: Implement the hash-derived slot composer and deterministic IDs**

Build the slot contract from the lesson key and source hash:

```ts
const formats = hashRankedValidPermutation(
  ["multiple_choice", "multiple_choice", "fill_blank", "fill_blank", "true_false"],
  `${lessonKey}\0${sourceHash}\0formats`,
  { rejectAdjacentEqual: true }
);
const kinds = hashRankedPermutation(
  ["translation", "translation", "translation", "pattern", "pattern"],
  `${lessonKey}\0${sourceHash}\0kinds`
);
const slots = formats.map((format, index) => ({ format, kind: kinds[index] }));
```

Enumerate unique permutations before ranking so duplicated format/kind values do not bias selection. Tests must prove two distinct source hashes can select different valid orders while identical input stays byte-stable. Rank eligible candidates by SHA-256 of generator version, lesson key, source hash, slot, pattern ID, and example ID. Salt every question ID with `wct-review-v2`, lesson key, source hash, slot index, format, pattern/example IDs, and displayed content; salt each choice ID with its question ID and choice text. Add a collision test that reuses one source entry in both same-format slots and proves slot-distinct question IDs. Validate the complete set only after all five candidates exist; never return a partial set.

- [ ] **Step 6: Implement residue-balanced O/X allocation**

Group Days by their ordered zero-based position modulo 3. Alternate truth state inside each group. For the two odd-sized groups in 16/28 books, start one with O and the other with X. This gives exact whole-book balance and keeps every possible Pop true/false residue balanced.

If an assigned X Day has no safe X candidate, swap its state only with an O Day in the same residue group that has a safe X candidate. Recompose both. If no such swap or override exists, throw a Day-specific generation error.

- [ ] **Step 7: Implement full-Day, hash-guarded overrides**

In `overrides.ts`, export a typed readonly list:

```ts
export type WctStandardDayOverride = {
  level: WctStandardLevel;
  dayNumber: number;
  expectedSourceHash: string;
  questions: readonly WctStandardQuestionCandidate[];
};

export const STANDARD_WCT_DAY_OVERRIDES = [] satisfies readonly WctStandardDayOverride[];
```

The generator indexes overrides by normalized level plus Day number, verifies `expectedSourceHash` before use, and validates every override candidate against the same target-Day provenance and five-slot contract. The default is a real empty collection for test fixtures. During the production inventory audit in Task 9, add a concrete full-Day override only when an automatically generated Day is unsafe or ambiguous; an empty production collection is acceptable only if all 220 automatic questions pass every audit rule and editorial review.

- [ ] **Step 8: Implement the release-blocking audit**

`auditStandardWctQuizInventory` must validate counts, format/kind sequences, no adjacent formats, choice counts, normalized uniqueness, forbidden text, source membership, mutation evidence, one-span difference, blank reconstruction, O/X rules, feedback completeness, and Korean integrity. Emit the complete sorted canonical source inventory used for hashing, plus one audit row per question with level, Day/topic, prompt, choices, correct answer, source IDs/text, pattern, mutation/blank evidence, and reason. Compute:

```ts
sourceInventoryHash = sha256(stableStringify(sortedSourceInventory));
questionArtifactHash = sha256(stableStringify(sortedAuditRows));
```

- [ ] **Step 9: Run focused tests and verify GREEN**

Run:

```bash
npm test -- tests/unit/wct-quiz-standard-generator.test.ts tests/unit/wct-quiz-audit.test.ts
npm run typecheck
```

Expected: 16/28 generation, deterministic composition, exact/residue O/X balances, swap behavior, stale/foreign overrides, all negative audit fixtures, and 44/220 good inventory pass.

- [ ] **Step 10: Commit the generator and audit**

```bash
git add lib/wct/quiz/standard/overrides.ts lib/wct/quiz/standard/generator.ts lib/wct/quiz/standard/audit.ts tests/unit/wct-quiz-standard-generator.test.ts tests/unit/wct-quiz-audit.test.ts
git commit -m "feat: compose and audit WCT v2 quizzes"
```

---

### Task 5: Add atomic standard-set sync, import preflight, and stale blocking

**Files:**
- Modify: `lib/wct/quiz/types.ts`
- Modify: `lib/wct-quiz-store/contract.ts`
- Modify: `lib/wct-quiz-store/memory-store.ts`
- Modify: `lib/wct-quiz-store/supabase-store.ts`
- Modify: `lib/wct-pop-quiz-store/memory-store.ts`
- Modify: `lib/wct/quiz/ensure.ts`
- Modify: `app/api/wct/import/route.ts`
- Create: `lib/wct/quiz/current-set.ts`
- Modify: `app/lessons/books/[bookId]/days/[dayId]/page.tsx`
- Modify: `app/lessons/books/[bookId]/days/[dayId]/quiz/page.tsx`
- Modify: `app/lessons/quiz-actions.ts`
- Test: `tests/integration/memory-wct-quiz-store.test.ts`
- Test: `tests/integration/wct-import-api.test.ts`
- Test: `tests/unit/wct-quiz-ensure.test.ts`
- Test: `tests/unit/wct-quiz-actions.test.ts`

**Interfaces:**
- Consumes: complete generated book batches from Task 4 and the existing separate approved source-import transaction.
- Produces:
  - `syncStandardSets(books): Promise<WctStandardQuizSyncResult>`
  - all-input prevalidation and all-or-nothing set/progress mutation
  - in-place set ID preservation
  - affected Day score and Pop snapshot invalidation
  - version-aware `isCurrentStandardWctQuizSet`
  - standard submission context `{ bookId, dayId }`
  - a release-safe inventory gate: existing all-v1 books defer v2 synchronization until checkpoint B; all-v2 books synchronize; mixed/partial books fail

- [ ] **Step 1: Write failing atomic memory-store tests**

Start with an empty admin store for the create path. After the first sync, save Day progress and an owner/book Pop attempt, then cover idempotence and replacement:

```ts
const firstSync = await admin.syncStandardSets([{ bookId, sets: v2Sets }]);
expect(firstSync).toMatchObject({ createdCount: 2, updatedCount: 0 });

const idsBefore = (await admin.listSetsByLessonKeys(keys)).map((set) => set.id);
await learner.submitAttempt(completedAttemptFor(idsBefore[0]));
await popStore.startAttempt({
  bookId,
  seed: "sync-reset-fixture",
  questions: popSnapshotQuestionsFor(v2Sets)
});
const sameSync = await admin.syncStandardSets([{ bookId, sets: v2Sets }]);
expect(sameSync.unchangedCount).toBe(2);
expect(await learner.getSummaryByLessonKey(keys[0])).toMatchObject({ latestScore: 5 });

const changedSync = await admin.syncStandardSets([{ bookId, sets: changedV2Sets }]);
expect((await admin.listSetsByLessonKeys(keys)).map((set) => set.id)).toEqual(idsBefore);
expect(changedSync.resetQuizProgressCount).toBe(1);
expect(await learner.getSummaryByLessonKey(keys[0])).toMatchObject({ latestScore: null });
expect(await popStore.getAttempt(bookId)).toBeNull();
```

Use a separate pre-seeded fixture for the rollback case. Pass one valid replacement and one malformed set in a single call; assert neither existing set nor either progress store changes. Assert a non-admin store throws and a Premium set is rejected by this method.

- [ ] **Step 2: Write failing ensure/import and stale-set tests**

In `wct-quiz-ensure.test.ts`, assert a brand-new book with zero sets loads every current Day, generates the whole book before syncing once, exact replay on an all-v2 book produces only unchanged counts, and a Day generation failure makes zero quiz/progress writes while the separately imported source stays readable. Seed a complete all-v1 inventory and prove an approved source import returns `deferred_v1_release` without generating/writing v2 or resetting progress; seed a mixed/partial inventory and prove it fails closed.

In the import API integration test, import a complete safe book, complete a quiz, replace one Day, and prove successful sync replaces only changed payloads and clears affected progress. Inject a failing sync and assert the response names its Day/reason and stored quiz/progress remain unchanged.

In current-set/action tests, cover:

```ts
expect(isCurrentStandardWctQuizSet({ book, day, allDays, quizSet: currentV2 }))
  .toBe(true);
expect(isCurrentStandardWctQuizSet({ book, day: changedDay, allDays, quizSet: currentV2 }))
  .toBe(false);
expect(isCurrentStandardWctQuizSet({ book, day, allDays, quizSet: currentV1 }))
  .toBe(true);
```

Assert standard submission with a stale v1 or v2 context is rejected before `submitAttempt`, while Premium submission without standard context keeps working.

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
npm test -- tests/integration/memory-wct-quiz-store.test.ts tests/integration/wct-import-api.test.ts tests/unit/wct-quiz-ensure.test.ts tests/unit/wct-quiz-actions.test.ts
```

Expected: FAIL because the store only has create-if-missing, import writes Day sets sequentially, memory Pop invalidation is unavailable, and routes/actions do not compare hashes.

- [ ] **Step 4: Add the batch sync contract and result types**

In shared types and `WctQuizStore`, define:

```ts
export type WctStandardQuizBookSync = {
  bookId: string;
  sets: WctQuizSetCreateInput[];
};

export type WctStandardQuizSyncResult = {
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  resetQuizProgressCount: number;
  resetPopProgressCount: number;
};

syncStandardSets(
  books: WctStandardQuizBookSync[]
): Promise<WctStandardQuizSyncResult>;
```

Keep `createSetIfMissing` for Premium v1 only in active app paths.

- [ ] **Step 5: Implement atomic memory synchronization**

Validate every book and set before cloning/mutating state. A set is unchanged when generator version and source hash match; require its canonical questions to match too, otherwise throw a generator/version integrity-collision error without mutation. Insert missing rows, update only rows whose version or source hash changed, delete progress keyed to changed set IDs, then call an exact owner/book invalidator exported by the memory Pop store when any set in that book changes. Commit the cloned maps to global state only after the complete batch succeeds.

- [ ] **Step 6: Implement the Supabase store call**

Admin-only `syncStandardSets` validates all v2 inputs, then calls:

```ts
const { data, error } = await client.rpc("sync_wct_standard_quiz_sets", {
  p_owner_id: this.user.id,
  p_books: parsedBooks
});
```

Parse the count result strictly. Task 8 creates the RPC before this code reaches production. Normal authenticated stores throw before the call. Preserve `createSetIfMissing` as the Premium v1 insert path and retain raw v1/v2 mapper behavior.

- [ ] **Step 7: Replace sequential ensure with gated full-book preflight**

After the existing approved source transaction returns, load the book, every full Day, and current set inventory for every lesson key. Classify it before generation:

- zero sets: generate and sync v2 (new books and memory-only E2E fixtures);
- complete all-v1 inventory: return `deferred_v1_release`, keep existing sets/progress untouched, and let stale-source loaders block only affected quizzes until checkpoint B;
- complete all-v2 inventory: generate every Day, then invoke `syncStandardSets([{ bookId: book.id, sets }])` exactly once;
- partial or mixed inventory: fail with a preparation error and make no quiz/progress mutation.

This inventory gate is mandatory in the checkpoint-A deployment so an approved WCT source import between A and B cannot publish unreviewed v2 questions or reset progress. Checkpoint B's atomic 44-set conversion turns both target books into the all-v2 branch. Generate every draft before the store call. Keep:

```ts
export async function ensurePremiumWctQuiz(...) {
  const source = buildPremiumWctQuizSource(lesson);
  return quizStore.createSetIfMissing(generatePremiumWctQuizSetDraft(source));
}
```

Wrap standard errors with the normalized level, Day number, and failing rule. Document in the route response that a source import can already be committed while quiz sync remains fully rolled back/retryable.

- [ ] **Step 8: Implement version-aware stale checks and trusted submission context**

In `current-set.ts`, dispatch expected hash calculation by stored version:

- v2: target-Day-only `buildStandardWctQuizSource` hash;
- v1 standard: the legacy book-wide source adapter/hash using all current Days;
- Premium: outside this helper.

Update the Day detail to show a quiz badge only for a current set. Update the quiz route to reject a stale set. Extend standard runner/action input with:

```ts
export type WctQuizSourceContext = { bookId: string; dayId: string };
```

Before scoring a standard submission, reload book, all Days, Day, and set; verify owner/source relation plus the version-aware hash. The database still calculates the score. Premium omits `sourceContext` and retains its current flow.

- [ ] **Step 9: Run focused tests and verify GREEN**

Run:

```bash
npm test -- tests/integration/memory-wct-quiz-store.test.ts tests/integration/wct-import-api.test.ts tests/unit/wct-quiz-ensure.test.ts tests/unit/wct-quiz-actions.test.ts
npm run typecheck
```

Expected: atomic multi-set sync, unchanged replay, preserved IDs, exact progress invalidation, source-import boundary, stale v1/v2 blocking, and Premium submission all pass.

- [ ] **Step 10: Commit batch sync and stale guards**

```bash
git add -- lib/wct/quiz/types.ts lib/wct-quiz-store/contract.ts lib/wct-quiz-store/memory-store.ts lib/wct-quiz-store/supabase-store.ts lib/wct-pop-quiz-store/memory-store.ts lib/wct/quiz/ensure.ts lib/wct/quiz/current-set.ts app/api/wct/import/route.ts 'app/lessons/books/[bookId]/days/[dayId]/page.tsx' 'app/lessons/books/[bookId]/days/[dayId]/quiz/page.tsx' app/lessons/quiz-actions.ts tests/integration/memory-wct-quiz-store.test.ts tests/integration/wct-import-api.test.ts tests/unit/wct-quiz-ensure.test.ts tests/unit/wct-quiz-actions.test.ts
git commit -m "feat: sync WCT v2 sets atomically"
```

---

### Task 6: Render three button-only formats and structured feedback

**Files:**
- Modify: `components/wct/WctQuizQuestionStep.tsx`
- Modify: `components/wct/WctQuizRunner.tsx`
- Modify: `components/wct/WctPopQuizRunner.tsx`
- Modify: `app/lessons/books/[bookId]/days/[dayId]/quiz/page.tsx`
- Create: `tests/components/wct-quiz-question-step.test.tsx`
- Modify: `tests/components/wct-quiz-runner.test.tsx`
- Modify: `tests/components/wct-pop-quiz-runner.test.tsx`

**Interfaces:**
- Consumes: explicit v2 `format`/`feedback`, legacy absent fields, optional confirmed `feedbackContext`, and optional standard `sourceContext`.
- Produces: v2-only format badges, O/X two-button layout, four-choice layouts, no input field, and confirmed-only source/structured feedback.

- [ ] **Step 1: Write failing common-question component tests**

Create one fixture per format and one raw Premium/v1 fixture. Assert:

```ts
expect(screen.getByText("문장 선택")).toBeVisible();
for (const choice of multipleChoiceQuestion.choices) {
  expect(screen.getByRole("button", { name: choice.text })).toBeVisible();
}

expect(screen.getByText("빈칸")).toBeVisible();
expect(screen.getByText(/____/)).toBeVisible();

expect(screen.getByText("O\/X")).toBeVisible();
expect(screen.getByRole("button", { name: "O" })).toBeVisible();
expect(screen.getByRole("button", { name: "X" })).toBeVisible();
expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
```

Before confirmation, assert Day/topic, correct sentence, pattern, and reason are absent. After confirmation, assert all are visible in this order. For raw v1/Premium, assert no format badge appears and legacy `explanation` still renders after confirmation.

- [ ] **Step 2: Write failing runner tests**

In the standard runner, pass `feedbackContext="Day 13 · if 가능"` and `sourceContext={{ bookId, dayId }}`. Assert source metadata appears only after confirmation and submission includes the exact source context. In Pop runner, retain confirmed-only context and prove two-choice O/X saves through the same choice-ID action. Assert retry and result flows remain unchanged.

- [ ] **Step 3: Run component tests and verify RED**

Run:

```bash
npm run test:components -- tests/components/wct-quiz-question-step.test.tsx tests/components/wct-quiz-runner.test.tsx tests/components/wct-pop-quiz-runner.test.tsx
```

Expected: FAIL because no explicit-format badge or structured feedback exists, the standard runner lacks source context, and the legacy distinction is absent.

- [ ] **Step 4: Implement explicit-format layout without changing legacy Premium UI**

Use `getWctQuizQuestionFormat(question)` for layout, but render a badge only when `question.format` is explicitly present:

```ts
const formatLabel = question.format ? {
  multiple_choice: "문장 선택",
  fill_blank: "빈칸",
  true_false: "O/X"
}[question.format] : null;
```

Render the provided choices; do not synthesize choices or inputs in React. Use a two-column or two-large-button layout for `true_false`, and the existing stacked four-button layout otherwise. Preserve `aria-pressed`, confirmed correct/wrong labels, disabled behavior, and choice IDs.

- [ ] **Step 5: Render structured feedback only after confirmation**

Inside the existing confirmed feedback block, render:

```tsx
{feedbackContext ? <p>{feedbackContext}</p> : null}
{question.feedback ? (
  <div>
    <p>정답 문장 · {question.feedback.correctSentence}</p>
    <p>원래 패턴 · {question.feedback.pattern}</p>
    <p>{question.feedback.reason}</p>
  </div>
) : (
  <p>{question.explanation}</p>
)}
```

Keep the existing correctness heading and accessible live region. Do not render feedback fields before `isAnswerConfirmed`.

- [ ] **Step 6: Pass standard Day/topic and trusted source context**

Extend `WctQuizRunner` props with optional `feedbackContext` and `sourceContext`. The standard v2 route passes `Day ${day.dayNumber} · ${day.shortLabel}` plus `{ bookId, dayId }`. Premium passes neither, keeping v1 output unchanged. Pop continues to pass its per-question Day/topic.

- [ ] **Step 7: Run component tests and verify GREEN**

Run:

```bash
npm run test:components -- tests/components/wct-quiz-question-step.test.tsx tests/components/wct-quiz-runner.test.tsx tests/components/wct-pop-quiz-runner.test.tsx
npm run typecheck
```

Expected: all three v2 formats, no typing, feedback timing, source context, retry/scoring, and unchanged raw Premium rendering pass.

- [ ] **Step 8: Commit the UI**

```bash
git add components/wct/WctQuizQuestionStep.tsx components/wct/WctQuizRunner.tsx components/wct/WctPopQuizRunner.tsx app/lessons/books/'[bookId]'/days/'[dayId]'/quiz/page.tsx tests/components/wct-quiz-question-step.test.tsx tests/components/wct-quiz-runner.test.tsx tests/components/wct-pop-quiz-runner.test.tsx
git commit -m "feat: render varied WCT quiz formats"
```

---

### Task 7: Make Pop Quiz dual-version and rotate every v2 Day on retake

**Files:**
- Modify: `lib/wct/pop-quiz/types.ts`
- Modify: `lib/wct/pop-quiz/selector.ts`
- Modify: `lib/wct/pop-quiz/service.ts`
- Modify: `lib/wct/pop-quiz/validation.ts`
- Modify: `app/lessons/books/[bookId]/pop-quiz/actions.ts`
- Modify: `app/lessons/books/[bookId]/pop-quiz/page.tsx`
- Modify: `lib/wct-pop-quiz-store/mappers.ts`
- Modify: `lib/wct-pop-quiz-store/memory-store.ts`
- Modify: `lib/wct-pop-quiz-store/supabase-store.ts`
- Test: `tests/unit/wct-pop-quiz-selector.test.ts`
- Test: `tests/unit/wct-pop-quiz-service.test.ts`
- Test: `tests/unit/wct-pop-quiz-validation.test.ts`
- Test: `tests/unit/wct-pop-quiz-actions.test.ts`
- Test: `tests/unit/wct-pop-quiz-mappers.test.ts`
- Test: `tests/integration/memory-wct-pop-quiz-store.test.ts`
- Create: `tests/components/wct-pop-quiz-page.test.tsx`

**Interfaces:**
- Consumes: complete v1 or v2 set inventories, current full Days/source hashes, previous attempt snapshot, and the common question schema.
- Produces:
  - `sourceVersion` plus `previousQuestions` in selection input
  - legacy v1 one-per-Day selection unchanged
  - v2 first-attempt balanced formats
  - deterministic per-Day retake cycle and candidate ranking
  - mixed/stale inventory preparation errors
  - stale/reset attempt restart messaging

- [ ] **Step 1: Write failing v2 selector tests**

Create 16- and 28-Day candidate pools whose each Day set has the exact 2/2/1 formats. For the first attempt assert:

```ts
expect(formatCounts(selected16).sort((left, right) => left - right)).toEqual([5, 5, 6]);
expect(formatCounts(selected28).sort((left, right) => left - right)).toEqual([9, 9, 10]);
expect(selected.map((item) => item.dayNumber)).toEqual(
  Array.from({ length: dayCount }, (_, index) => index + 1)
);
```

Pass the first snapshot back as `previousQuestions`, then assert for every Day:

```ts
expect(next.question.id).not.toBe(previous.question.id);
expect(next.question.format).toBe(nextWctQuizFormat(previous.question.format!));
```

Assert same seed/input is stable, a missing required format fails, a mixed v1/v2 inventory fails, and a v1 candidate pool retains the existing seeded one-per-Day behavior without materializing `format`.

- [ ] **Step 2: Write failing service/resume/action tests**

In service tests, prove it loads every full Day, verifies each set's version-aware current hash, rejects incomplete/mixed/stale sets, passes the complete previous snapshot on retake, and keeps an in-progress attempt unchanged on start. Verify `dayTopic` still comes from `shortLabel`.

In mapper/store tests, retain legacy absent-format attempts. Add a reset/stale action failure and expect the Korean restart message rather than the generic save message. Define a typed `WctPopQuizRestartRequiredError`; actions map it to that same message. In `wct-pop-quiz-page.test.tsx`, mock an active attempt whose snapshot no longer matches the current source set, await the server page component, and assert it renders `Pop Quiz가 변경됐어요. 새로 시작해 주세요.` plus a book-return/start link and no runner.

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
npm test -- tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/unit/wct-pop-quiz-actions.test.ts tests/unit/wct-pop-quiz-mappers.test.ts tests/integration/memory-wct-pop-quiz-store.test.ts
npm run test:components -- tests/components/wct-pop-quiz-page.test.tsx
```

Expected: FAIL because selector input has only an overall signature, no format schedule/version branch exists, and active attempts are not checked against current sets.

- [ ] **Step 4: Replace overall-signature input with version and previous snapshot**

Define:

```ts
export type WctPopQuizSelectionInput = {
  book: WctBook;
  candidates: WctPopQuizCandidate[];
  seed: string;
  sourceVersion: "wct-review-v1" | "wct-review-v2";
  previousQuestions: WctPopQuizQuestion[] | null;
};
```

Do not add a default `format` during parsing. Service detects source version only when all current set rows agree; any mixture or missing set throws `Pop Quiz needs one complete quiz version`.

- [ ] **Step 5: Implement first-attempt schedule and per-Day retake cycle**

For initial v2 attempts, hash the seed to an offset `0 | 1 | 2` and assign the repeating ordered formats. For retakes, map each Day's previous explicit format through:

```ts
export function nextWctQuizFormat(format: WctQuizQuestionFormat) {
  if (format === "multiple_choice") return "fill_blank";
  if (format === "fill_blank") return "true_false";
  return "multiple_choice";
}
```

Filter candidates for that exact target format, exclude the prior question ID, and rank remaining candidates by seed, set ID, and question ID. Throw when any Day lacks the required candidate. V1 retains the current non-concept hash-ranked selector and whole-signature retake rule.

- [ ] **Step 6: Verify current sets and active snapshots in the service**

Load the full `WctDay` rows for all book summaries. Map every quiz set to the matching Day and call the Task 5 current-set helper. Before returning/resuming an attempt, verify every snapshot question exactly matches its current source set and every referenced set is current. Throw `WctPopQuizRestartRequiredError` for a reset/missing attempt or stale reference. The page catches only that typed error and renders `Pop Quiz가 변경됐어요. 새로 시작해 주세요.` with a safe return/start link; unexpected errors still surface normally.

- [ ] **Step 7: Reuse the common question parser and preserve legacy rows**

Keep outer Pop snapshot fields strict, but import `wctQuizQuestionSchema`. `format` remains absent for v1 snapshots and explicit for v2. Keep 16/28/legacy-20 length support, current index/answer/score cross-field refinements, source Day metadata, bands, and owner isolation.

- [ ] **Step 8: Run focused tests and verify GREEN**

Run:

```bash
npm test -- tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/unit/wct-pop-quiz-actions.test.ts tests/unit/wct-pop-quiz-mappers.test.ts tests/integration/memory-wct-pop-quiz-store.test.ts
npm run test:components -- tests/components/wct-pop-quiz-page.test.tsx
npm run typecheck
```

Expected: v1 compatibility, v2 6/5/5 and 10/9/9 balance, every-Day retake rotation, stable resume, missing/mixed/stale failure, and restart messaging pass.

- [ ] **Step 9: Commit Pop v2 behavior**

```bash
git add -- lib/wct/pop-quiz/types.ts lib/wct/pop-quiz/selector.ts lib/wct/pop-quiz/service.ts lib/wct/pop-quiz/validation.ts lib/wct-pop-quiz-store/mappers.ts lib/wct-pop-quiz-store/memory-store.ts lib/wct-pop-quiz-store/supabase-store.ts 'app/lessons/books/[bookId]/pop-quiz/actions.ts' 'app/lessons/books/[bookId]/pop-quiz/page.tsx' tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/unit/wct-pop-quiz-actions.test.ts tests/unit/wct-pop-quiz-mappers.test.ts tests/integration/memory-wct-pop-quiz-store.test.ts tests/components/wct-pop-quiz-page.test.tsx
git commit -m "feat: rotate WCT Pop Quiz formats per Day"
```

---

### Task 8: Add checkpoint-A batch sync and dual-version database enforcement

**Files:**
- Create: `supabase/migrations/20260805120000_add_wct_quiz_v2_compatibility.sql`
- Create: `tests/security/wct-quiz-v2-compatibility-migration.test.ts`
- Modify: `scripts/verify-rls.sql`
- Modify: `scripts/verify-wct-quiz-rls.sql`
- Modify: `scripts/verify-rls-local.sh`
- Create: `scripts/verify-wct-quiz-concurrency.sh`

**Interfaces:**
- Consumes: service-role owner ID, an array of book/set batches, current `wct_quiz_sets`, Day progress, Pop snapshots, and v1/v2 Pop start requests.
- Produces:
  - `sync_wct_standard_quiz_sets(p_owner_id uuid, p_books jsonb) returns jsonb`
  - ID-preserving atomic upsert/reset behavior
  - service-role-only execute privilege
  - v1/v2-branching `start_wct_pop_quiz`
  - database enforcement of per-Day v2 format/question rotation
  - one owner/book transaction advisory-lock protocol shared by standard sync, Pop start, and standard submission

- [ ] **Step 1: Write the failing static migration tests**

Assert the new file exists and contains:

```ts
expect(sql).toContain("sync_wct_standard_quiz_sets(uuid, jsonb)");
expect(sql).toContain("grant execute on function public.sync_wct_standard_quiz_sets(uuid, jsonb) to service_role");
expect(sql).toContain("revoke all on function public.sync_wct_standard_quiz_sets(uuid, jsonb) from public, anon, authenticated");
expect(sql).toContain("wct-review-v2");
expect(sql).toContain("coalesce(source_question->>'format', 'multiple_choice')");
expect(sql).toContain("WCT Pop Quiz versions cannot be mixed");
expect(sql).toContain("WCT Pop Quiz retake must change every Day format and question");
expect(sql).toContain("pg_advisory_xact_lock");
```

Also assert no table loosens owner/RLS/direct-write policies and no applied migration file is modified.

- [ ] **Step 2: Extend executable RLS fixtures before writing SQL**

In both SQL smoke paths, add:

- a v1 raw four-choice inventory/attempt that still starts, confirms, and completes;
- a complete v2 book where every Day has 2/2/1 formats and O/X has two choices;
- Day progress and a Pop attempt before sync;
- same-version/source-hash sync with equal payload preserving progress;
- same-version/source-hash sync with unequal payload failing without mutation;
- changed-payload sync preserving set UUID and deleting Day/Pop progress;
- an invalid second set proving the first set update rolls back;
- authenticated/anon/non-owner sync execution denial;
- v2 start format balance and source equality;
- a forged mixed inventory rejection;
- an identical-format or identical-question Day on retake rejection;
- a valid per-Day cyclic retake.
- two-session serialization: while sync holds the owner/book lock, Pop start waits and then snapshots only the new set; an old-ID standard submission waits and then fails without recreating deleted progress.

- [ ] **Step 3: Run security tests and verify RED**

Run:

```bash
npm test -- tests/security/wct-quiz-v2-compatibility-migration.test.ts tests/security/wct-pop-quiz-rls-policy.test.ts
npm run verify:rls
```

Expected: static test fails because the migration is absent; executable smoke fails at the missing sync RPC/new v2 validation.

- [ ] **Step 4: Implement full-batch prevalidation in the service-role RPC**

Create the new forward migration. Define one documented advisory-key expression from owner UUID plus book UUID. The sync, Pop-start, and standard-submit functions must all call `pg_advisory_xact_lock` with that exact key; sync acquires multiple book keys in sorted UUID order before validation to avoid deadlock. Define the sync function as `security definer` with `set search_path = public, pg_temp`, fully qualify mutable tables, and lock its execute privileges in the same migration. In `sync_wct_standard_quiz_sets`:

1. require non-null owner and a 1..100 `p_books` JSON array;
2. verify every book belongs to `p_owner_id`;
3. verify each batch covers every current Day in that book exactly once;
4. verify each set has the expected lesson key/source ID, `wct_day`, v2 version, 64-char hash, five questions, explicit 2/2/1 formats with no adjacent duplicate, 3/2 translation/pattern kinds with no `concept`, complete structured feedback, and valid choice counts;
5. perform no mutations until every item passes.

Before upsert, reject any existing row whose generator version and source hash equal the input while semantic JSONB questions differ. Use an upsert whose `DO UPDATE ... WHERE` changes only rows whose version or source hash differs. Capture created/changed set IDs, preserve existing primary keys, delete progress only for those IDs, and delete owner/book Pop rows only for books with changes. Return strict counts matching `WctStandardQuizSyncResult`. Any exception rolls back all books.

- [ ] **Step 5: Replace Pop start validation with an explicit version branch**

Copy the current owner/book, one-Day-each, band, source-payload equality, in-progress resume, and storage logic into the new `create or replace function`. Acquire the owner/book advisory lock before reading current sets or existing attempts. Derive the distinct source set generator versions referenced by `p_questions`.

- For all v1, keep the existing overall-signature retake compatibility.
- For all v2, require explicit format, counts whose maximum-minus-minimum is at most one, and compare each new Day to the prior snapshot so both format and question ID differ.
- For any mixed/unknown version, raise before insert/update.

The source equality join must compare the raw stored question JSON. Use SQL `coalesce(...format, 'multiple_choice')` only for validation; never rewrite the JSON.

- [ ] **Step 6: Serialize standard submission and preserve scoring**

Replace `submit_wct_quiz_attempt` without changing its external signature or scoring rules. For a standard set, resolve its owner/book identity, acquire the same advisory lock, then re-read the set questions after the lock before validating IDs and writing progress. Thus a submission built from pre-sync IDs cannot recreate stale progress after reset. Premium keeps its existing path. Revoke sync RPC execution from `public`, `anon`, and `authenticated`; grant only `service_role`. Keep Pop start/confirm/complete authenticated as before. Existing Pop confirm/complete already lock the attempt row, so sync deletion either waits for them or makes a later call return not found. Keep dynamic choice enumeration; do not add a four-choice assumption.

- [ ] **Step 7: Run focused and executable security verification**

Before the two hosted ledger reads, state that the target is main/production and verify `.env.local` resolves to `ccawzrrkxuirrwvaecvw`. Run:

```bash
npm test -- tests/security/wct-quiz-v2-compatibility-migration.test.ts tests/security/wct-pop-quiz-rls-policy.test.ts
npm run verify:rls
npm run db:status
npm run db:validate
```

`scripts/verify-rls-local.sh` must invoke `scripts/verify-wct-quiz-concurrency.sh` against its temporary PostgreSQL container after fixtures load. The helper uses two concurrent `docker exec ... psql` sessions and a bounded lock hold to prove the Pop/submit outcomes above; it fails on timeout, stale snapshot, or recreated progress. Expected: static tests, local PostgreSQL smoke, and the real two-session serialization probe pass. Read-only hosted status reports project `ccawzrrkxuirrwvaecvw`, exactly `20260805120000_add_wct_quiz_v2_compatibility.sql` pending, the checkpoint-B migration absent, and zero checksum mismatches.

- [ ] **Step 8: Commit checkpoint-A SQL without applying it yet**

```bash
git add -- supabase/migrations/20260805120000_add_wct_quiz_v2_compatibility.sql tests/security/wct-quiz-v2-compatibility-migration.test.ts scripts/verify-rls.sql scripts/verify-wct-quiz-rls.sql scripts/verify-rls-local.sh scripts/verify-wct-quiz-concurrency.sh
git commit -m "feat: add WCT v2 compatibility RPCs"
```

Do not create `20260805130000_replace_wct_standard_quizzes_v2.sql` in this task.

---

### Task 9: Audit and curate the complete production inventory with guarded release tooling

**Files:**
- Create: `scripts/generate-wct-quiz-v2.ts`
- Modify: `package.json`
- Modify if the production audit proves a general rule defect: `lib/wct/quiz/standard/mutations.ts`
- Modify if the production audit proves a general rule defect: `lib/wct/quiz/standard/candidates.ts`
- Modify if the production audit proves a composition/audit defect: `lib/wct/quiz/standard/generator.ts`
- Modify if the production audit proves a composition/audit defect: `lib/wct/quiz/standard/audit.ts`
- Modify: `lib/wct/quiz/standard/overrides.ts`
- Modify: `app/test/seed-wct-book/route.ts`
- Modify: `app/test/reset/route.ts`
- Modify: `e2e/wct-day-review-quiz.spec.ts`
- Modify: `e2e/wct-pop-quiz.spec.ts`
- Modify: `tests/unit/main-only-environment.test.ts`
- Create: `tests/unit/wct-quiz-v2-release.test.ts`
- Modify if a production rule changes: `tests/unit/wct-quiz-mutations.test.ts`
- Modify if a production rule changes: `tests/unit/wct-quiz-candidates.test.ts`
- Modify if a production rule changes: `tests/unit/wct-quiz-standard-generator.test.ts`
- Modify if a production rule changes: `tests/unit/wct-quiz-audit.test.ts`

**Interfaces:**
- Consumes: read-only main/production WCT books and Days, the standard v2 generator/audit, explicit command-line guards, and stable hashes.
- Produces:
  - `audit`: read main, generate all 44/220 candidates, and write review artifacts without a hosted write
  - `approve`: bind a completely editorially reviewed 220-row artifact to its exact hashes and truthful reviewer label
  - `generate`: refuse to emit checkpoint-B SQL without a matching approval manifest
  - `fixture`: render a local-only production-shaped source/v1-set/progress seed from the same approved artifact for executable migration verification
  - `verify`: exact post-apply production readback and invariant report
  - metadata-free test fixtures plus Day/Pop end-to-end coverage

- [ ] **Step 1: Write failing command-guard and artifact tests**

Extract the script's argument parsing and pure artifact verification behind an import guard so unit tests do not contact Supabase. Cover:

```ts
expect(() => parseV2QuizCommand(["approve", "--artifact", artifactPath]))
  .toThrow("--confirm-reviewed-220 is required");
expect(() => verifyApprovalManifest(changedArtifact, approvedManifest))
  .toThrow("WCT v2 approval hash mismatch");
expect(() => parseV2QuizCommand(["generate", "--approval", approvalPath]))
  .toThrow("--output is required");
expect(() => parseV2QuizCommand(["fixture", "--artifact", artifactPath]))
  .toThrow("--approval is required");
```

Assert `audit` and `verify` require the production project guard, `approve` records exactly 220 reviewed rows, `generate` rejects a false/missing/stale approval, `fixture` rejects an unapproved/hash-mismatched artifact, and none of the commands can overwrite an already-applied migration. Update `main-only-environment.test.ts` so read-only audit/verify and hosted generate paths require `.env.local` project ref `ccawzrrkxuirrwvaecvw`; `approve` and `fixture` remain local-file-only.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npm test -- tests/unit/wct-quiz-v2-release.test.ts tests/unit/main-only-environment.test.ts
```

Expected: FAIL because the v2 release script and commands do not exist.

- [ ] **Step 3: Implement five fail-closed subcommands**

Implement one CLI with explicit subcommands:

```bash
npm run wct:quiz-v2:audit -- --json /tmp/wct-quiz-v2-question-artifact.json --markdown /tmp/wct-quiz-v2-question-audit.md
npm run wct:quiz-v2:approve -- --artifact docs/prd/active/wct-quiz-quality-variety/question-artifact.json --reviewer "Codex editorial review" --confirm-reviewed-220 --output docs/prd/active/wct-quiz-quality-variety/audit-approval.json
npm run wct:quiz-v2:generate -- --artifact docs/prd/active/wct-quiz-quality-variety/question-artifact.json --approval docs/prd/active/wct-quiz-quality-variety/audit-approval.json --output supabase/migrations/20260805130000_replace_wct_standard_quizzes_v2.sql
npm run wct:quiz-v2:fixture -- --artifact docs/prd/active/wct-quiz-quality-variety/question-artifact.json --approval docs/prd/active/wct-quiz-quality-variety/audit-approval.json --output /tmp/wct-quiz-v2-migration-fixture.sql
npm run wct:quiz-v2:verify -- --artifact docs/prd/active/wct-quiz-quality-variety/question-artifact.json
```

Before any hosted read, load `.env.local`, parse the Supabase URL, and print the verified ref. Reject every ref except `ccawzrrkxuirrwvaecvw`. `audit` reads Prenovice `740b33b4-4338-4d43-8287-6edaa7bd0635` and Novice `aa2233e4-6eca-4716-94d6-78e605eb1523` directly, verifies their title/level/owner, loads their complete current Days, and records canonical Premium-set identity/version/source/question rows plus their snapshot hash (never Premium progress). It refuses duplicate/missing/extra Days, pending-review content, wrong level/day count, or any failed audit row. It writes only the requested local artifacts.

`approve` requires the literal guard, exactly 44 Days/220 rows, zero failed rules, and records generator version, source inventory hash, question artifact hash, Premium-set snapshot hash, reviewer, reviewed row count, approval timestamp, and `approved: true`. The Premium-set hash covers only Premium set identity/version/source/question payload, never mutable learner progress. `generate` re-reads the current main source and Premium sets, recomputes every content hash, and refuses SQL output unless those live hashes match both artifact and approval. `fixture` revalidates the same approval but never reads or writes hosted data; it renders exact target IDs/source graph plus 44 valid v1 sets, target Day/Pop progress, and Premium set/progress sentinels for a temporary PostgreSQL test. `verify` is read-only and compares production v2 rows semantically to the approved artifact, then reports source/Premium-set hashes and reset counts.

- [ ] **Step 4: Replace the unsafe historical package entry point**

Add the five commands above to `package.json`. Remove only the package command that invokes the legacy generator in a way that can rewrite its already-applied migration. Keep the historical script and applied migration untouched for reproducibility and existing unit tests.

- [ ] **Step 5: Make test source fixtures natural and reset Pop memory state**

Replace fixture expressions such as `Prenovice Day N` or `Novice Day N` in `app/test/seed-wct-book/route.ts` with deterministic, metadata-free natural sentences and patterns that support all three formats. Keep the one-Day other-owner book only as an RLS/not-found source fixture and do not call standard quiz ensure for it, because it is intentionally not a complete eligible 16/28-Day book. Return the created target set question formats to the test caller. In `app/test/reset/route.ts`, clear the in-memory Pop attempt store in addition to the current WCT state so retake assertions never inherit another test's snapshot.

- [ ] **Step 6: Expand Day and Pop mobile E2E coverage**

In the Day quiz spec, walk all five questions and assert the visible format sequence, no text input, button-only selection, disabled confirmation before selection, structured feedback after confirmation, and `Day N · topic` appearing only after confirmation. Assert no prompt or choice contains course/Day metadata.

In the Pop spec, cover exact 16- and 28-question attempts, 6/5/5 and 10/9/9 format counts, ascending one-per-Day coverage, stored refresh/resume, and a completed retake where every Day changes both question ID and cyclic format. Add a Premium smoke assertion that its raw question has no explicit v2 format and its visible behavior remains the current four-choice v1 flow.

- [ ] **Step 7: Run the read-only main audit against the exact hosted project**

State in commentary that the read target is main/production project `ccawzrrkxuirrwvaecvw`, verify `.env.local`, then run the audit to `/tmp`:

```bash
npm run wct:quiz-v2:audit -- --json /tmp/wct-quiz-v2-question-artifact.json --markdown /tmp/wct-quiz-v2-question-audit.md
```

Inspect all 220 rows, not only the summary. For each question verify natural wording, one defensible answer, source-faithful correct sentence/pattern, a single declared mutation for each distractor, useful Korean/English feedback, no metadata leak, and meaningful variation. Record every rejected row by `(level, Day, slot, rule)` before changing generation.

- [ ] **Step 8: Curate only the Days that cannot pass automatically**

First fix a general candidate/mutation rule only when the same source-backed rule improves every affected Day. For a genuinely exceptional Day, add a complete five-question override with its exact `expectedSourceHash`; never add a one-question patch or an unguarded exception. Rerun focused generator/audit tests and the main audit after each batch. Continue until the generated inventory is exactly 44 sets/220 questions, all machine rules pass, and every row has passed editorial inspection. Do not create the official approval manifest or checkpoint-B migration in this task.

- [ ] **Step 9: Run focused release and E2E tests**

Run:

```bash
npm test -- tests/unit/wct-quiz-v2-release.test.ts tests/unit/main-only-environment.test.ts tests/unit/wct-quiz-mutations.test.ts tests/unit/wct-quiz-candidates.test.ts tests/unit/wct-quiz-standard-generator.test.ts tests/unit/wct-quiz-audit.test.ts
npm run test:e2e -- e2e/wct-day-review-quiz.spec.ts e2e/wct-pop-quiz.spec.ts --project=mobile-chromium
npm run typecheck
```

Expected: all guards, exact inventory invariants, natural fixtures, three Day formats, Pop 16/28 coverage/rotation, and Premium v1 smoke pass.

- [ ] **Step 10: Commit release tooling and curated generation rules**

```bash
git add scripts/generate-wct-quiz-v2.ts package.json lib/wct/quiz/standard/mutations.ts lib/wct/quiz/standard/candidates.ts lib/wct/quiz/standard/generator.ts lib/wct/quiz/standard/audit.ts lib/wct/quiz/standard/overrides.ts app/test/seed-wct-book/route.ts app/test/reset/route.ts e2e/wct-day-review-quiz.spec.ts e2e/wct-pop-quiz.spec.ts tests/unit/main-only-environment.test.ts tests/unit/wct-quiz-v2-release.test.ts tests/unit/wct-quiz-mutations.test.ts tests/unit/wct-quiz-candidates.test.ts tests/unit/wct-quiz-standard-generator.test.ts tests/unit/wct-quiz-audit.test.ts
git commit -m "test: audit complete WCT v2 inventory"
```

Keep `/tmp` review artifacts untracked. Confirm checkpoint B still does not exist.

---

### Task 10: Verify and release compatibility checkpoint A

**Files:**
- Verify: all runtime, test, migration, and checkpoint-A files from Tasks 1–9
- Verify live: standard Day quiz, Pop Quiz, Premium, import, and database ledger
- Deploy: local `main` to production through the repository's existing Vercel integration

**Interfaces:**
- Consumes: dual-read application code, the service-role-only checkpoint-A migration, a clean verified branch, and explicit production-write confirmation.
- Produces: checkpoint-A schema applied to main/production, the compatible app deployed from `main`, v1 data still intact, and a proved safe boundary before checkpoint B exists.

- [ ] **Step 1: Run the complete pre-release command gate**

Classify the affected surface as **mixed UI, routes, server actions, API, persistence, and schema; therefore runtime-facing**. Use that classification for the full command/live-route gate. Use the repository Node runtime if the shell PATH does not expose it. Run focused suites first, then:

```bash
npm run lint
npm run typecheck
npm test
npm run verify:rls
npm run build
npm run test:e2e -- --project=mobile-chromium
```

If a command fails, diagnose and fix only feature-caused failures, rerun the focused reproduction, then rerun the failed gate. Do not continue to production with any unexplained failure.

- [ ] **Step 2: Exercise the actual affected routes on a healthy local app**

Start or restart a memory-only test server so local route verification cannot touch production Supabase and the `/test/*` routes are enabled:

```bash
E2E_MEMORY_STORE=1 E2E_FAKE_USER_ID=00000000-0000-4000-8000-000000000001 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-key npm run dev -- --hostname 0.0.0.0 --port 3000
```

POST `/test/reset` and `/test/seed-wct-book`, capture the returned Prenovice/Novice book and Day IDs, then verify these exact route shapes on both `http://127.0.0.1:3000` and the reachable LAN/WSL IP: `/lessons/books/{bookId}`, `/lessons/books/{bookId}/days/{dayId}/quiz`, and `/lessons/books/{bookId}/pop-quiz`. Exercise the seeded standard Day quiz, 16/28 Pop Quiz, Premium quiz, and memory-only WCT import path. Confirm post-confirmation feedback timing, no typing, v1 compatibility, resume behavior, and safe sync errors. Never use the normal `.env.local` production-backed server for seeded local flows. Scan server output for `InternalServerError`, HTTP 500, missing modules/chunks, schema errors, and failed server actions.

- [ ] **Step 3: Prove checkpoint-B is absent and inspect the main ledger**

Run:

```bash
git status --short
test ! -e supabase/migrations/20260805130000_replace_wct_standard_quizzes_v2.sql
npm run db:status
npm run db:validate
```

Announce that hosted checks target main/production project `ccawzrrkxuirrwvaecvw`. Require the status to show only `20260805120000_add_wct_quiz_v2_compatibility.sql` pending, all earlier files applied, and no checksum mismatch.

- [ ] **Step 4: Pause for explicit checkpoint-A production-write confirmation**

Immediately before migration, show the exact effect: install a service-role-only batch sync RPC and dual-version Pop validation; do not replace quiz data or reset progress. Ask for explicit approval to run:

```bash
npm run db:migrate -- --confirm-production
```

Do not treat the earlier design approval or implementation choice as write confirmation.

- [ ] **Step 5: Apply and verify checkpoint A on main/production**

After confirmation, run the migration once, then:

```bash
npm run db:status
npm run db:validate
```

Use service-role/admin reads to verify the RPC exists with only service-role execute permission and the new Pop function is installed. Use an authenticated-user read-only select to confirm existing RLS access without starting or completing a quiz. Count and hash the current quiz inventory: all 44 targeted standard sets must still be v1, the recorded target progress/Pop rows must remain, and Premium/source hashes must equal their pre-migration snapshots.

- [ ] **Step 6: Push the compatible app to production**

State source branch/worktree and confirm the deployment target is `main`. Require a clean, expected diff and local `main`, then:

```bash
git push origin main
```

Wait for the matching Vercel production deployment to reach ready state. Verify the deployed commit and `https://english-phi-drab.vercel.app`, then perform read-only authenticated route/rendering checks for standard Day, Pop, and Premium v1. Confirm dual-read code handles untouched v1 rows and deployed logs show no fatal errors. If checkpoint-A verification also needs an action that starts, confirms, or completes a hosted attempt, identify the exact test user/expected rows and ask for a separate explicit production-write confirmation immediately before it; prefer a rollback-only authenticated SQL/RPC smoke when it proves the contract without retained rows.

- [ ] **Step 7: Record the checkpoint boundary**

Capture the applied migration, git commit, Vercel deployment/commit, production counts/hashes, and route smoke results in the task log. Only after every checkpoint-A assertion passes may Task 11 create the data migration and checked-in approval artifacts.

---

### Task 11: Freeze the reviewed 220-question artifact and create checkpoint B

**Files:**
- Create: `docs/prd/active/wct-quiz-quality-variety/question-audit.md`
- Create: `docs/prd/active/wct-quiz-quality-variety/question-artifact.json`
- Create: `docs/prd/active/wct-quiz-quality-variety/audit-approval.json`
- Create: `supabase/migrations/20260805130000_replace_wct_standard_quizzes_v2.sql`
- Modify: `scripts/verify-rls-local.sh`
- Create: `scripts/verify-wct-quiz-v2-data-migration.sh`
- Modify: `package.json`
- Test: `tests/unit/wct-quiz-v2-release.test.ts`
- Test: `tests/security/wct-quiz-v2-data-migration.test.ts`

**Interfaces:**
- Consumes: healthy deployed checkpoint A, fresh production source reads, the curated generator, all 220 editorial decisions, and the approval guard.
- Produces: immutable reviewed artifacts and one forward data migration that atomically replaces only the 44 standard sets and resets only their obsolete progress.

- [ ] **Step 1: Reconfirm checkpoint A and regenerate official review artifacts**

Verify project ref `ccawzrrkxuirrwvaecvw`, checkpoint-A deployment health, no unexpected source/Premium changes, and ledger state before creating files. Run:

```bash
npm run wct:quiz-v2:audit -- --json docs/prd/active/wct-quiz-quality-variety/question-artifact.json --markdown docs/prd/active/wct-quiz-quality-variety/question-audit.md
```

The artifacts must report exactly Prenovice 16, Novice 28, 44 sets, 220 questions, format/kind rules, O/X 8/8 and 14/14, zero audit failures, the current source inventory hash, question artifact hash, and unchanged Premium-set snapshot hash. Do not include mutable Premium progress in the approval hash.

- [ ] **Step 2: Perform the final row-by-row editorial review**

Read every row in `question-audit.md` against its target-Day source. Check prompt naturalness, option plausibility without ambiguity, correct-answer uniqueness, blank reconstruction, O/X truth explanation, original pattern/topic, Korean text integrity, and absence of metadata in learner-facing question content. If any row fails, return to its general rule or source-hash override, regenerate both artifacts, and restart the 220-row review from the changed artifact hash.

- [ ] **Step 3: Create the hash-bound approval manifest**

Only after the complete final review, run:

```bash
npm run wct:quiz-v2:approve -- --artifact docs/prd/active/wct-quiz-quality-variety/question-artifact.json --reviewer "Codex editorial review" --confirm-reviewed-220 --output docs/prd/active/wct-quiz-quality-variety/audit-approval.json
```

Immediately reopen the manifest and compare its generator version, source inventory hash, question artifact hash, Premium-set snapshot hash, `reviewedRows: 220`, and `approved: true` to the reviewed artifact.

- [ ] **Step 4: Write failing checkpoint-B migration tests**

Assert the migration is fail-closed and contains:

- exact target book IDs and expected 16/28 Day counts;
- production fail-closed behavior when either or both target books are absent;
- one narrowly named session setting, installed only by `scripts/verify-rls-local.sh`, that permits an empty-fixture no-op during blank local migration replay and is absent from the hosted runner;
- a partial/extra/duplicate/wrong-owner production inventory rejection;
- one call to the already-deployed batch sync RPC containing both books;
- transaction-level source-table locks acquired before inventory hashing so a concurrent approved import either commits before the assertions or waits until after conversion;
- pre/post assertions for 44 v2 sets, 220 questions, format/kind/choice rules, generator/source hashes, and zero affected progress/Pop rows;
- assertions that WCT source and Premium rows are not mutated;
- no direct update to applied migrations or broad delete.
- an executable temporary-PostgreSQL path that applies migrations through checkpoint A, loads the approved `fixture` SQL, executes checkpoint B inside a transaction, and checks all success effects plus a separate corrupted-inventory rollback case.

Run:

```bash
npm test -- tests/security/wct-quiz-v2-data-migration.test.ts tests/unit/wct-quiz-v2-release.test.ts
```

Expected: RED because checkpoint-B SQL has not been generated.

- [ ] **Step 5: Generate the approved checkpoint-B migration**

Run:

```bash
npm run wct:quiz-v2:generate -- --artifact docs/prd/active/wct-quiz-quality-variety/question-artifact.json --approval docs/prd/active/wct-quiz-quality-variety/audit-approval.json --output supabase/migrations/20260805130000_replace_wct_standard_quizzes_v2.sql
```

The generated transaction must fail when either or both target books are absent in every normal session. To keep blank local migration replay executable, make `scripts/verify-rls-local.sh` set a session-only marker such as `app.wct_v2_allow_empty_fixture=on` before applying migrations; only the exact combination of that marker and zero matching target books may return without mutation. The production migration runner never sets the marker, and the static/executable tests must prove zero-target production behavior raises. With real targets, run `lock table public.wct_books, public.wct_days, public.wct_patterns, public.wct_examples in share mode` before inventory hashing so reads continue but concurrent source DML waits until commit. Then require the single expected owner, both exact book IDs, complete 16/28 current-Day inventories, 44 matching v1 target sets, and matching source/approval hashes. The sync RPC's sorted owner/book advisory locks serialize Pop start and standard submission while the conversion/reset runs. Pass both books to that RPC inside the ledger transaction, then assert 44 v2 sets/220 approved questions, preserved set UUIDs, zero targeted Day progress, zero targeted Pop attempts, unchanged source rows, and unchanged Premium rows. Any failed assertion rolls back everything.

Create `scripts/verify-wct-quiz-v2-data-migration.sh` as the production-branch executable test. It starts an isolated temporary PostgreSQL container, installs the auth stubs/roles, applies migrations only through checkpoint A, calls `wct:quiz-v2:fixture` into a temporary SQL file, and loads it. In database one, snapshot set UUIDs/source/Premium rows, apply checkpoint B without the empty-fixture marker, and assert exact 44/220 conversion, UUID preservation, target progress deletion, exact source/Premium scalar/text-field preservation, semantic JSON hashes, and Korean equality. In a fresh database two, load the same fixture, remove or corrupt one required target row, run checkpoint B expecting nonzero exit, then prove every pre-state set/progress/source/Premium hash is unchanged. Use bounded waits and always remove the container/temp files. Update `package.json` so `verify:rls` runs the existing policy replay and then this executable migration-effect/rollback test once checkpoint B exists.

- [ ] **Step 6: Verify checkpoint B locally without applying it**

Run:

```bash
npm test -- tests/security/wct-quiz-v2-data-migration.test.ts tests/unit/wct-quiz-v2-release.test.ts
npm run verify:rls
npm run lint
npm run typecheck
npm test
npm run build
npm run db:status
npm run db:validate
```

Expected: all code/security/build gates pass; the ledger shows checkpoint A applied and exactly checkpoint B pending with no checksum mismatch. Confirm the checked artifacts' semantic hashes still match generated SQL.

- [ ] **Step 7: Commit checkpoint B locally, but do not push or apply**

```bash
git add -- docs/prd/active/wct-quiz-quality-variety/question-audit.md docs/prd/active/wct-quiz-quality-variety/question-artifact.json docs/prd/active/wct-quiz-quality-variety/audit-approval.json supabase/migrations/20260805130000_replace_wct_standard_quizzes_v2.sql scripts/verify-rls-local.sh scripts/verify-wct-quiz-v2-data-migration.sh package.json tests/security/wct-quiz-v2-data-migration.test.ts tests/unit/wct-quiz-v2-release.test.ts
git commit -m "data: replace standard WCT quizzes with reviewed v2 sets"
```

Do not push this commit while checkpoint B remains unapplied; production must never receive a startup/import path that assumes v2 before the data migration succeeds.

---

### Task 12: Apply checkpoint B, verify production, and complete the PRD

**Files:**
- Move: `docs/prd/active/wct-quiz-quality-variety/` → `docs/prd/complete/wct-quiz-quality-variety/`
- Modify: `docs/prd/future-work.md`
- Modify: `docs/prd/README.md`
- Verify live: production standard Day quiz, 16/28 Pop Quiz, Premium v1, imports, persistence, and reset state
- Deploy: checkpoint-B commit and final lifecycle commit from `main`

**Interfaces:**
- Consumes: committed approved checkpoint-B artifacts, healthy checkpoint A, fresh explicit production-write confirmation, and exact pre-migration snapshots.
- Produces: reviewed v2 data live on main/production, compatible app/deployment verified, target progress reset, Premium/source unchanged, completed PRD evidence, and a clean synchronized `main`.

- [ ] **Step 1: Take fresh pre-write snapshots and validate the ledger**

Announce main/production project `ccawzrrkxuirrwvaecvw`, verify `.env.local`, checkpoint-A deployment health, and the exact checked-in approval hashes. Read and record targeted standard set IDs/versions, Day progress count, Pop attempt IDs/count, WCT source hash, separate Premium-set and Premium-progress hashes, and Korean source fields. The approval manifest binds only the Premium-set hash; the migration and readback compare mutable Premium-progress rows immediately before and after the transaction. Run:

```bash
npm run db:status
npm run db:validate
```

Require exactly `20260805130000_replace_wct_standard_quizzes_v2.sql` pending.

- [ ] **Step 2: Pause for explicit checkpoint-B production-write confirmation**

Immediately before execution, state that this transaction replaces all 44 standard Prenovice/Novice sets with the approved 220 v2 questions, preserves set UUIDs, deletes existing scores for those Days, deletes targeted Prenovice/Novice Pop attempts, and leaves Premium/source data untouched. Ask for explicit approval to run:

```bash
npm run db:migrate -- --confirm-production
```

Do not infer this permission from checkpoint-A approval.

- [ ] **Step 3: Apply checkpoint B and perform exact production readback**

After confirmation, apply once. Then run:

```bash
npm run db:status
npm run db:validate
npm run wct:quiz-v2:verify -- --artifact docs/prd/active/wct-quiz-quality-variety/question-artifact.json
```

Verify 44 v2 sets, 220 semantic question matches, exact 2/2/1 and 3/2 rules per Day, O/X balances, preserved target set UUIDs, every recorded pre-migration target Day/Pop row absent, exact source inventory hash, exact Premium-set hash, unchanged immediately-before Premium-progress rows, and exact Korean field equality. The migration's in-transaction postcondition proves zero targeted progress at conversion time; if a legitimate new v2 attempt appears after commit, require its timestamp to be later than the migration and validate it separately rather than misclassifying it as stale v1 data. Treat `???`, replacement characters, hash drift, or any row mismatch as a failed release and stop before push.

- [ ] **Step 4: Push checkpoint B and wait for the matching production deployment**

Confirm local source is `main` and target is `origin/main`, then:

```bash
git push origin main
```

Wait until the matching Vercel deployment is ready. Verify the deployed commit and `https://english-phi-drab.vercel.app`; do not rely on a generic home-page 200 alone.

- [ ] **Step 5: Exercise all affected production behavior**

First identify the authenticated test user and the exact Day-score/Pop rows the flow can create. Immediately before the first state-changing click, ask for explicit confirmation for these learner writes; checkpoint-B migration approval is not sufficient. After confirmation, verify:

- a standard Day run traverses all five questions and all three formats with no typing, confirms only after a choice, and reveals `Day N · topic`, correct sentence, pattern, and exact reason only after confirmation;
- all learner-facing prompts/choices are metadata-free and source-faithful;
- Prenovice Pop has 16 and Novice Pop has 28 ascending one-per-Day questions with balanced formats;
- refresh resumes the same attempt and a retake changes every Day's format and question ID;
- Premium remains v1 and unchanged;
- the production WCT import route/auth boundary is healthy without submitting or changing lesson source; no-change sync and changed-source guarding remain covered by the local integration and executable RLS tests.

If production smoke creates a Day score or Pop attempt, record its exact test-user row IDs before the run, delete only those newly created rows through a narrowly scoped service-role cleanup, and verify the targeted reset state returns to zero. This cleanup is a separate hosted write and requires an explicit confirmation immediately before execution; if cleanup approval is not granted, leave the identified test rows intact and report them rather than deleting broadly. Scan production/runtime logs for 500s, server-action errors, schema mismatches, and stale chunks.

- [ ] **Step 6: Complete the PRD lifecycle with evidence**

After production behavior is verified, move the active folder to complete and update `future-work.md`/`README.md`. Record:

- all changed runtime, migration, test, release-tooling, and documentation files;
- affected surface classification: `mixed UI/routes/server actions/API/persistence/schema => runtime-facing`;
- the exact lint/typecheck/test/RLS/build/E2E commands and results;
- checkpoint-A/B migration ledger results and production project ref;
- local and production route URLs/flows exercised;
- 44/220 counts, hashes, Korean readback, progress reset, source/Premium preservation;
- deployed commits and any remaining risk.

Use `apply_patch` for the tracker/README text and `git mv` for the PRD folder so the tracked Active deletions are explicit and recoverable.

- [ ] **Step 7: Commit and deploy the completion record**

```bash
git add -A -- docs/prd/active/wct-quiz-quality-variety docs/prd/complete/wct-quiz-quality-variety docs/prd/future-work.md docs/prd/README.md
git commit -m "docs: complete WCT quiz quality overhaul"
git push origin main
```

Wait for the final documentation commit's production deployment if Vercel builds every `main` push. Recheck the affected production route, deployed commit, runtime logs, `npm run db:status`, `npm run db:validate`, and `git status --short`. Finish only with all migrations applied, app/database compatible, no unexpected worktree changes, and the production behavior still healthy.
