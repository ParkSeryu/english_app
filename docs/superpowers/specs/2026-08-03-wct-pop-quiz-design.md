# WCT Pop Quiz Design

## Goal

Add a book-level `Pop Quiz` to the WCT Prenovice and Novice books so a
learner can review material from across the book in one 20-question session.
Each new attempt samples a different set of existing Day quiz questions while
preserving an explicit content ratio and a source link back to the relevant
Day.

## Scope

- Include WCT Prenovice and WCT Novice books.
- Exclude WCT Premium entirely.
- Reuse approved questions from the existing Day-level quiz sets.
- Create exactly 20 questions for every new Pop Quiz attempt.
- Persist one current/latest attempt per owner and book.
- Show the latest score and the Days that need review.

## Non-goals

- New AI-generated or manually authored questions
- Premium Pop Quiz
- Timers, pass/fail thresholds, rankings, certificates, or notifications
- Full attempt history or analytics for every Day
- Changing the existing Day quiz behavior

## User experience

The Prenovice and Novice book detail pages show a full-width Pop Quiz CTA above
the Day list. Its states are:

- No attempt: `Pop Quiz · 20문제`
- In progress: `이어 풀기 · N/20`
- Completed: `다시 풀기 · 최근 N/20`

Starting a new attempt creates a new question selection and redirects to
`/lessons/books/[bookId]/pop-quiz`. Returning to an in-progress attempt resumes
the same question order and confirmed answers; it does not create another
selection merely because the route was reopened.

The runner shows `N / 20`. For each question the learner selects an option,
may change the selection, and then presses `정답 확인`. Confirmation locks the
choice, shows correct/wrong feedback and the existing explanation, persists the
answer, and enables `다음 문제`. The final question enables `결과 보기`.

The result view shows:

- Total score as `N / 20`
- A deduplicated list of Days containing incorrect answers
- A review link to each incorrect Day
- `다시 풀기`, which replaces the completed attempt with a newly sampled one
- A link back to the book

## Question selection

The server builds a candidate pool from the current owner's immutable Day quiz
sets for the selected book. It never calls an AI service at runtime.

Days are ordered by Day number and divided into three contiguous, near-equal
bands: early, middle, and late. A new attempt must satisfy all of these rules:

- 20 questions total
- 12 `translation` questions and 8 `pattern` questions
- 7 questions from the early band, 7 from the middle band, and 6 from the late
  band
- No more than 2 questions from the same Day
- No duplicate source question

Selection uses a fresh server-generated random seed for each new attempt. The
seed and the selected ordered question references are saved before the quiz is
shown, making refresh and resume deterministic. The selection function accepts
an injected random source so its constraints can be tested without flaky tests.
Before replacing a completed attempt, the server compares the new question
signature with the previous one and resamples if all 20 source questions are
identical. This guarantees that `다시 풀기` does not return the exact same set.

If the available question pool cannot satisfy every constraint, attempt
creation fails explicitly and the book page shows `Pop Quiz 문제를 준비하지
못했습니다`. The implementation must not silently relax ratios or duplicate
questions. The current Prenovice and Novice inventories have enough Day quiz
questions to satisfy the rules.

## Persistence and server boundaries

Add a dedicated owner-scoped Pop Quiz progress record keyed by owner and book.
It stores only the current/latest attempt:

- Attempt identifier and random seed
- Ordered source question references, including source quiz set, question, and
  Day identifiers
- Confirmed answers and current position
- Status (`in_progress` or `completed`)
- Latest score, incorrect Day identifiers, and completion timestamp

Starting a new attempt atomically replaces the previous record for that book.
Confirming an answer writes through a server action before the UI advances. If
the save fails, the confirmed feedback remains visible and a retry action is
shown; the runner does not silently advance. Final scoring runs on the server
against the stored source quiz questions rather than trusting a client score.

The database migration follows the repository migration ledger. Row-level
security and server-side ownership checks isolate each user's books, attempts,
answers, and results. Browser-direct writes remain disallowed.

The sole hosted target is main/production Supabase project
`ccawzrrkxuirrwvaecvw`. Creating the migration file is part of implementation,
but applying the hosted migration requires a separate explicit production
confirmation immediately before the write.

## Components and routes

- A book-level Pop Quiz CTA reads the current/latest progress summary.
- A server-only selector gathers eligible Day questions and enforces sampling
  constraints.
- A Pop Quiz store owns start, resume, confirm, complete, and latest-summary
  operations.
- A Pop Quiz route renders the current attempt and rejects missing or foreign
  books.
- A shared quiz runner foundation preserves the existing select, confirm,
  feedback, next, and result behavior while allowing a 20-question persisted
  attempt. The Day quiz continues to use its existing five-question contract.

These units expose book/attempt-oriented interfaces so selection, persistence,
and rendering can be tested independently.

## Error handling

- Missing, Premium, or foreign books return 404 and never expose quiz data.
- An insufficient source pool returns a user-facing preparation error without
  creating a partial attempt.
- Repeated start requests are transaction-safe and produce one current attempt.
- Repeated answer confirmation is idempotent and cannot record two answers for
  one question.
- A save failure offers retry without losing the selected answer or advancing.
- A stale question reference blocks completion and reports a recoverable restart
  message rather than accepting an unverifiable score.

## Testing and verification

- Unit tests cover band partitioning, 7/7/6 distribution, 12/8 type ratio,
  maximum two questions per Day, uniqueness, insufficient pools, and different
  selections for different seeds and consecutive retakes.
- Store tests cover start, resume, answer idempotency, completion, replacement
  on retake, latest summary, and owner isolation.
- Component tests cover CTA states, selection before confirmation, persisted
  progress, retry on save failure, result score, and incorrect-Day links.
- E2E covers Prenovice and Novice start, refresh/resume, 20-question completion,
  result navigation, and a differently sampled retake.
- Migration validation and authenticated RLS smoke tests run against the sole
  main environment after explicit confirmation.
- Runtime verification includes lint, typecheck, targeted and full tests,
  production build, and live checks of both book and Pop Quiz routes on a server
  bound to `0.0.0.0`.

## Acceptance criteria

- Prenovice and Novice book pages show the correct Pop Quiz CTA state; Premium
  does not.
- Every new attempt contains exactly 20 unique questions satisfying all source,
  type, band, and per-Day constraints.
- A retake receives a newly sampled selection while refresh/resume preserves the
  active selection and confirmed progress.
- Every confirmed answer persists before advancing, and final score is computed
  on the server.
- The result lists total score and deduplicated review links for incorrect Days.
- Other users cannot read or mutate a learner's Pop Quiz state.
