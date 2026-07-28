# WCT Day Review Quiz Design

Date: 2026-07-28  
Status: Approved in conversation; awaiting review of this written specification

## Summary

Add a fixed five-question multiple-choice review quiz to every visible WCT Day. A learner opens a Day, selects the `복습 문제 5개` badge-style button, answers the questions on a dedicated page, receives immediate feedback after each choice, and returns to the Day after viewing the final score.

The first backfill covers all 45 Days currently visible in the dev app:

- `WCT Prenovice`: 16 database-backed Days
- `WCT Novice`: 28 database-backed Days
- `WCT Premium`: 1 code-backed Day

Future WCT Days also receive one quiz automatically. Quiz content is generated from approved WCT lesson data without an in-app AI API call and then kept stable. The storage contract includes a generator version so a later AI-backed generator can replace the current implementation without changing the learner-facing flow.

## Repository Baseline

The database-backed WCT library is organized as:

`/lessons → /lessons/books/[bookId] → /lessons/books/[bookId]/days/[dayId]`

The standard Day detail page loads an owner-scoped `WctDay` through `WctStore` and renders `WctDayContent`. Each stored Day contains concepts, patterns, examples, important notes, and practice prompts.

`WCT Premium` is separate and code-backed:

`/lessons/premium → /lessons/premium/days/[dayId]`

Premium lessons expose sections, content blocks, and pattern strings. Premium Day 1 does not contain Korean translations for its English example sentences, so it cannot use the same translation-recognition question mix as the 44 database-backed Days without inventing new lesson content.

The app currently has no OpenAI or other model API integration. WCT data is imported through an approval-gated API and persisted by `WctStore`. WCT content is private to its owner, while quiz progress must be private to the signed-in learner.

The local checkout was on `main` when design work began. This feature branch is based on `dev`, and any future integration target is `dev`, not `main`.

## Goals

- Show one fixed five-question review quiz for every visible WCT Day.
- Use four choices for every question and exactly one correct choice.
- Show whether the selected choice is correct immediately.
- Show a short, source-based explanation before allowing the learner to continue.
- Save the learner's latest score and completion time.
- Show `복습 문제 5개` before completion and `복습 완료 · N/5` after completion.
- Allow the learner to retake the same fixed set; the latest completed score replaces the prior score.
- Backfill all 45 existing Days in the dev environment.
- Create one quiz automatically for future standard and Premium Days.
- Keep quiz generation deterministic, source-based, idempotent, and replaceable by a future generator.

## Non-Goals

- Free-text answers, speaking evaluation, audio, or pronunciation scoring
- Random new questions on every attempt
- A learner-facing or admin-facing quiz editor
- Attempt history beyond the latest completed score
- Spaced repetition, streaks, reminders, or cross-Day review queues
- Runtime model API calls, model keys, model cost controls, or prompt management
- Rewriting or adding WCT lesson content solely to make quiz generation easier
- Automatic regeneration when an existing Day is replaced or merged
- Production/main database changes without a separate status check and explicit production confirmation

## Approved Learner Experience

### Day detail

Place a badge-style link directly below the Day header and before the existing lesson content.

- No saved completion: `복습 문제 5개`
- Saved completion: `복습 완료 · N/5`

The button is shown only when a valid quiz set exists for the Day. Existing lesson sections and their order remain unchanged.

### Quiz page

Use dedicated routes:

- Standard: `/lessons/books/[bookId]/days/[dayId]/quiz`
- Premium: `/lessons/premium/days/[dayId]/quiz`

The page displays:

- the book or Premium label and Day label;
- progress such as `1 / 5`;
- one question;
- four large choice buttons;
- immediate correct/incorrect feedback after a choice;
- the correct choice and a short explanation;
- a `다음 문제` button after questions 1 through 4;
- a results screen after question 5.

Selecting a choice locks the current question. The learner cannot change the answer after seeing feedback. Refreshing or leaving before question 5 discards the in-progress attempt; only a completed five-question attempt is saved.

The results screen shows:

- `N / 5`;
- `다시 풀기`, which restarts the same fixed set;
- `Day로 돌아가기`, which returns to the originating Day detail route.

Retaking overwrites the latest saved score only after all five questions are completed.

## Question Generation

### Shared guarantees

The generator accepts a normalized `WctQuizSource` and returns a `WctQuizSetDraft`.

Every generated set must satisfy:

- exactly five questions;
- exactly four distinct choices per question;
- exactly one correct choice;
- a non-empty prompt and explanation;
- no duplicate normalized question prompts within a set;
- source text preserved for correct answers;
- distractors taken from other approved WCT examples, patterns, or rules rather than malformed generated English;
- deterministic ordering based on `lessonKey` and `generatorVersion`.

The initial generator version is `wct-review-v1`. A stable seeded shuffle derived from the lesson key keeps question and choice order fixed across requests and environments.

### Standard WCT Days

For the 44 database-backed Days, create:

1. Three Korean-meaning-to-English-sentence questions.
2. Two pattern-recognition questions.

Translation-recognition questions use an example's stored `meaningKo` as the prompt and its stored `englishText` as the correct answer. Distractors are distinct English examples selected in this order:

1. other examples in the same Day;
2. examples in the same book, ordered by distance from the source Day;
3. the remaining examples in the same book.

When a Day has fewer than three distinct translated examples, the generator may reuse a source example in another question with different distractors, but it must not duplicate the normalized prompt.

Pattern-recognition questions ask which sentence matches a stored `patternText`. The correct choice is an example linked to that pattern. Distractors come from other patterns in the same Day and then neighboring Days in the same book. The explanation combines the stored pattern text with `meaningKo` or `usageNote` when available and the correct example's Korean meaning when available.

If a stored Day cannot provide enough distinct source-backed choices after using the book-level fallback pool, generation fails validation and no partial set is written.

### WCT Premium Days

Premium lessons use a dedicated adapter because their English example blocks do not contain Korean translations.

Premium questions are generated only from:

- approved Korean paragraph and rule text;
- approved pattern strings;
- approved English examples and list items.

The five-question set mixes:

- three concept or rule recognition questions;
- two pattern or example recognition questions.

The generator does not invent Korean translations or add new Premium lesson content. Distractors are other approved statements, rules, patterns, or examples whose source context makes them incorrect for the current prompt. The same five-question, four-choice, immediate-feedback contract applies.

## Data Model

### `wct_quiz_sets`

One row stores one immutable learner-facing quiz set.

- `id uuid primary key`
- `owner_id uuid not null references auth.users(id)`
- `lesson_key text not null`
- `source_kind text not null check (source_kind in ('wct_day', 'wct_premium'))`
- `source_id text not null`
- `generator_version text not null`
- `source_hash text not null`
- `questions jsonb not null`
- `created_at timestamptz not null default now()`
- unique constraint on `(owner_id, lesson_key)`

`questions` stores the validated five-question array atomically. Each question contains a stable ID, kind, prompt, four choices with stable IDs and text, the correct choice ID, and an explanation.

The first version does not regenerate a set automatically when `source_hash` later differs. The hash records provenance and enables a future explicit regeneration workflow.

### `wct_quiz_progress`

One row stores the latest completed result for one learner and quiz set.

- `quiz_set_id uuid not null references wct_quiz_sets(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `latest_score integer not null check (latest_score between 0 and 5)`
- `completed_at timestamptz not null`
- `updated_at timestamptz not null default now()`
- primary key on `(quiz_set_id, user_id)`

The server calculates the score from stored correct choice IDs. The client never sends a trusted score.

### Access control

- A learner may read a quiz set only when `owner_id = auth.uid()`.
- A learner may read and upsert only their own progress row.
- A progress write is valid only for a quiz set visible to the same learner.
- Guessed standard or Premium quiz IDs return no data.
- Service-role quiz-set writes are limited to approved WCT import, migration backfill, and the idempotent first-load Premium ensure path.

## Store and Component Boundaries

Extend the existing WCT domain without mixing quiz behavior into expression cards.

- Quiz types and validation live under `lib/wct/quiz/`.
- The deterministic generator has no database or React dependency.
- A `WctQuizStore` contract owns set lookup, idempotent creation, summary lookup, and progress upsert.
- Memory and Supabase implementations preserve the existing test-mode pattern.
- The standard and Premium source adapters convert their existing lesson types into `WctQuizSource`.
- A shared server component renders the Day-detail badge from a quiz summary.
- A shared client component runs the five-question interaction for both route families.
- Server route code verifies that the quiz source matches the requested book and Day before rendering.

Do not add quiz fields to `WctDay`, `WctPremiumLesson`, or unrelated expression types.

## Automatic Creation and Backfill

### Existing Days

Create the schema through a new timestamped SQL migration. Generate the 45 dev quiz drafts with the same checked-in generator used by the app, validate them, and materialize the backfill as a committed data migration rather than ad-hoc SQL.

The backfill must:

- select database-backed Days by owner, normalized book identity, and Day number instead of assuming environment-specific UUIDs;
- insert one set per Day with conflict-safe idempotency;
- insert one Premium Day 1 set for the same configured WCT owner;
- fail before applying if any set does not contain five valid questions;
- leave existing WCT content unchanged.

After the dev write, query all saved question payloads and compare their non-ASCII text to the generated payload. Do not report completion if Korean text differs or contains replacement characters.

### Future standard Days

After an approved WCT import succeeds, load each affected Day and its book-level distractor pool, generate `wct-review-v1`, and create the set only if absent.

This step is idempotent. If quiz creation fails after the atomic Day import:

- the import response reports the quiz-generation failure;
- the Day remains readable;
- the Day detail omits the quiz badge;
- replaying the same approved import retries only the missing quiz creation and does not duplicate the Day or quiz.

### Future Premium Days

On the first authenticated Premium Day detail request, adapt the code-backed lesson, generate the deterministic set, and create it if absent before loading the badge. Subsequent requests reuse the stored set.

If creation fails, the lesson still renders and the quiz badge is omitted. The failure is logged without exposing question answers or database credentials.

## Answer Submission

The browser keeps selected choices locally during one attempt. After question 5, it submits:

- quiz set ID;
- the five question ID and selected choice ID pairs.

The server:

1. authenticates the current user;
2. reloads the owner-visible quiz set;
3. verifies there is exactly one answer for every stored question;
4. rejects unknown or duplicate question and choice IDs;
5. computes the score from the stored correct choice IDs;
6. upserts the latest progress row;
7. returns the trusted score and completion time.

Invalid submissions return a generic validation message and do not change progress. A network failure keeps the results screen visible with a retry-save action; it does not claim the score was saved.

## Error and Empty States

- Missing book, Day, source mismatch, or inaccessible quiz: `notFound()`.
- Day exists but quiz does not: render the Day normally without a quiz badge.
- Malformed stored quiz payload: do not render the quiz; log a server-side validation error.
- Attempt save failure: show `결과를 저장하지 못했어요. 다시 시도해 주세요.` with a retry action.
- Fewer than four distinct source-backed choices: generation fails and writes nothing.
- Existing quiz set: return it unchanged; do not regenerate or overwrite it.

## PRD Lifecycle

Implementation begins only after this written specification is reviewed and an implementation plan is approved.

At implementation start:

- create `docs/prd/active/wct-day-review-quiz/`;
- add the PRD, test specification, and implementation plan;
- move the matching item in `docs/prd/future-work.md` to `Active`.

After implementation and verification:

- move the feature folder to `docs/prd/complete/wct-day-review-quiz/`;
- record changed files, verification commands, and remaining risks in `docs/prd/future-work.md`.

## Testing and Verification

### Generator and validation

- Produces exactly five questions and four distinct choices per question.
- Produces exactly one correct choice per question.
- Is deterministic for the same lesson key and generator version.
- Does not mutate source lessons.
- Uses the correct standard and Premium question mixes.
- Uses book-level fallback distractors for sparse Days.
- Rejects an insufficient distractor pool.
- Rejects duplicate prompts, choices, or invalid correct choice IDs.

### Stores and access

- Creates a set once and returns the existing set on replay.
- Keeps quiz sets isolated by owner.
- Calculates score server-side.
- Upserts only the latest completed score.
- Rejects foreign quiz IDs and malformed answer payloads.
- Verifies RLS for quiz sets and progress with service-role and authenticated-user checks.

### Components and routes

- Shows `복습 문제 5개` before completion.
- Shows `복습 완료 · N/5` after completion.
- Locks a question after one selection.
- Shows immediate feedback and explanation.
- Advances through five questions and renders results.
- Retakes the same set and returns to the correct Day route.
- Supports both standard and Premium route families.
- Hides the badge when no valid set exists.

### Required repository gate

Run:

- `npm run lint`
- `npm run typecheck`
- targeted generator, store, component, route, and migration tests
- `npm run verify:rls`
- `npm run db:status:dev`
- `npm run db:migrate:dev`
- `npm run build`

Run the dev server with:

`npm run dev -- --hostname 0.0.0.0`

Verify at least one standard Day and Premium Day end to end with Playwright:

1. open the Day detail;
2. click the quiz badge;
3. answer all five questions;
4. observe immediate feedback after each selection;
5. save the final score;
6. return to the Day;
7. confirm the badge displays the saved score;
8. retake and confirm the latest score replaces the previous score.

Check both `127.0.0.1:3000` and the reachable external WSL/LAN address when available, and inspect the running server output for route, chunk, database, and server-action failures.

## Environment and Rollout

The first implementation and data backfill target only:

`dev / .env.local / Supabase project uixpyibcpleuwsgemdno`

Before any hosted write, re-verify the project ref. Apply schema and data only through timestamped migration files and `scripts/db-migrations.mjs`.

Do not assume dev migration or backfill results exist in production. Before promotion, run `npm run db:status:main`, inspect the main data separately, and require the repository's explicit production confirmation path before applying. Production remains out of scope until the user separately authorizes it.

## Acceptance Criteria

- All 45 currently visible dev WCT Days have one valid fixed quiz set.
- Every set contains five questions with four choices and one correct answer.
- Every eligible Day detail shows the correct quiz badge.
- Standard and Premium quizzes open on dedicated routes.
- Choice selection shows immediate feedback and a source-based explanation.
- Completing five questions saves a server-calculated latest score.
- Returning to the Day displays `복습 완료 · N/5`.
- Retaking replaces the latest score.
- Future approved standard Days receive a quiz idempotently.
- Future Premium Days receive a quiz on first authenticated detail access.
- Quiz content and progress remain owner-scoped.
- Existing WCT lesson content, expression cards, navigation, and Premium layout remain unchanged.
- Dev schema, data integrity, RLS, tests, build, and live routes are verified before completion is reported.
