# WCT Pop Quiz Day Order Shuffle Design

## Status

Approved in conversation on 2026-08-06.

## Goal

Present current `wct-review-v2` WCT Pop Quiz Days in a different order for each
newly created attempt so learners cannot anticipate the next source Day.
Preserve the exact stored order when a compatible in-progress attempt is
refreshed or resumed.

## Scope

- Shuffle the Day order for newly created `wct-review-v2` Prenovice and Novice
  Pop Quiz attempts.
- Shuffle again for every compatible v2 completed-attempt retake.
- Keep exactly one question from every available Day: 16 for Prenovice and 28
  for Novice, including the current non-contiguous Novice Day numbers.
- Preserve the existing per-Day v2 guarantees: every retake changes both the
  question ID and format for every Day.
- Preserve existing standard Day quizzes, Premium, lesson content, scoring,
  feedback timing, and result behavior.
- Keep the legacy v1 selector, retry seed behavior, snapshot validation, and
  restart-required rules unchanged.

## Chosen Approach

Use a deterministic seed-based Day permutation in the Pop Quiz selector.

The attempt already receives a new UUID seed before question selection and
stores both the seed and selected question array. Rank each Day by a SHA-256
digest derived from the attempt seed and Day ID, then use that ranked order as
the persisted question order. This keeps selection reproducible for tests and
diagnostics while still producing a fresh order for every new attempt.

The rejected alternatives are:

- runtime-only `Math.random()` shuffling, because the order cannot be
  reproduced from attempt data;
- UI-only reordering, because the server advances and scores answers by the
  persisted question-array index.

## Selection Rules

1. Validate and load the complete book inventory using canonical ascending Day
   order, as today.
2. Derive a deterministic permutation from `seed + dayId` before selecting the
   displayed questions.
3. If a first attempt's derived sequence exactly matches canonical ascending
   Day order, rotate it by one position so a supposedly shuffled attempt never
   presents the full old sequence by chance.
4. On a first v2 attempt, assign the balanced
   `multiple_choice -> fill_blank -> true_false` schedule across the shuffled
   positions using the existing seed offset.
5. On a retake, look up the previous question by Day ID, advance that Day to
   its next format, and exclude its previous question ID. Do not compare by
   array position because the Day order changes.
6. If the newly derived retake Day-ID sequence happens to equal the previous
   sequence, rotate the new sequence by one position. A retake therefore has a
   guaranteed different Day order, not merely a probabilistic one.
7. Keep each Day's `early`, `middle`, or `late` band based on its canonical Day
   position, independent of its shuffled display position.

The same seed and inventory must always produce the same first-attempt order.
The same retake seed and previous snapshot must always produce the same retake
order and questions.

## Attempt and Resume Data Flow

- **New start:** create seed -> validate inventory -> shuffle Days -> select one
  question per Day -> persist the entire ordered array -> render question 1.
- **Retake:** create a new seed -> validate the completed snapshot by Day ID ->
  shuffle Days -> enforce a different order -> rotate each Day's format and
  question -> replace the stored attempt -> render question 1.
- **Refresh/resume:** read and validate the existing stored array -> render it
  unchanged from `currentIndex`. Do not reshuffle.

No client-only shuffle is added. The stored question array remains the single
source of truth for display, answer confirmation, refresh, completion, and
scoring.

## Validation and Persistence

The application snapshot validator currently requires the stored array to
match ascending Day order by index. For v2 snapshots, replace that positional
requirement with order-independent exact-coverage validation:

- question count equals current Day count;
- Day IDs and Day numbers are unique;
- every current book Day appears exactly once;
- each stored Day number, label, topic, quiz-set relationship, and question
  payload matches the current source inventory.

Keep the existing positional validation for v1 snapshots so this change does
not silently expand legacy behavior.

The Supabase `start_wct_pop_quiz` RPC already validates exact Day coverage,
unique questions, canonical bands, source relationships, balanced formats,
and retake changes without requiring array order. No schema or production data
migration is needed.

Malformed, duplicate, missing, foreign, or stale snapshots continue to fail
closed with the existing restart-required behavior. Attempt creation remains
atomic, so no partial shuffled attempt can be saved.

## Compatibility

- Existing v2 in-progress attempts that contain the complete current Day set
  and match the current source inventory retain their stored order and resume
  normally.
- Existing v2 completed attempts that meet those same validity conditions
  remain inputs for a shuffled retake.
- Legacy v1 stored attempts are not rewritten or newly shuffled. They retain
  the current compatibility checks and continue to require restart when they
  do not satisfy them, including old incomplete-Day snapshots.
- Prenovice and Novice totals remain 16 and 28; only presentation order changes.
- Day/topic stays hidden until answer confirmation and remains attached to the
  correct question after shuffling.

## Testing and Verification

- Selector tests:
  - same seed produces the same Day permutation;
  - selected Day order is not forced ascending;
  - a canonical-order hash result activates the deterministic one-step
    rotation fallback;
  - 16/28-Day attempts contain every Day exactly once;
  - production Novice's non-contiguous Day numbers remain complete;
  - a retake has a different Day order and changes format/question for every
    Day when compared by Day ID;
  - identical derived retake order activates the deterministic one-step
    rotation fallback.
- Service tests:
  - shuffled snapshots pass exact-coverage validation;
  - duplicate, missing, foreign, and stale Days fail closed;
  - starting an existing in-progress attempt returns it unchanged.
- Legacy tests prove v1 selection, retry seeds, positional validation, and
  restart-required behavior remain unchanged.
- Store/RPC tests prove shuffled arrays remain accepted and are scored in their
  persisted order while current ownership and source protections stay intact.
- Mobile E2E proves both 16- and 28-question flows are non-ascending, refresh
  preserves the current order, and retake creates a different full order.
- Run lint, typecheck, focused tests, the full WCT suites, build, RLS checks,
  and local live-route verification on `0.0.0.0` over localhost and the
  reachable machine IP before production deployment.

## Acceptance Criteria

- Day 1 is not structurally fixed as the first Pop Quiz question.
- Every newly created v2 start and compatible v2 retake stores one complete,
  duplicate-free shuffled Day sequence.
- A retake's Day order differs from the immediately previous attempt.
- Refreshing or resuming an in-progress attempt never changes its order.
- Every v2 retake still changes the question ID and format for every Day.
- Legacy v1 selection and restart behavior remains unchanged.
- No database migration, Premium behavior, lesson data, standard Day quiz, or
  feedback timing changes.
