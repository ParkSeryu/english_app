# WCT Pop Quiz Day Coverage Design

## Goal

Change the book-level WCT Pop Quiz from a fixed 20-question sample to one
question from every Day in the selected book. Reveal the source Day and its
topic only after the learner confirms an answer.

## Scope

- WCT Prenovice creates 16-question attempts from its 16 Days.
- WCT Novice creates 28-question attempts from its 28 Days.
- Every new attempt contains exactly one existing approved quiz question from
  every Day in the book.
- Premium and the existing five-question Day quizzes remain unchanged.
- Existing stored 20-question attempts remain readable and completable.

## Selection

For each Day, select one `translation` or `pattern` question from the existing
immutable Day quiz set. Continue to exclude `concept` questions from the book
Pop Quiz.

Selection is deterministic for the attempt seed and chooses independently
within each Day. Questions are presented in ascending Day order. A retake uses
a new seed and must differ from the previous attempt by at least one selected
source question.

Attempt creation fails without saving a partial attempt when any Day is
missing a valid source quiz set or an eligible question.

## Answer Feedback

Do not reveal the Day or topic before answer confirmation. After the learner
presses `정답 확인`, show the source in the existing feedback panel above the
explanation:

`Day 13 · if 가능`

The Day number comes from `dayNumber`; the topic comes from the WCT Day's
`shortLabel`. New persisted Pop Quiz questions carry the topic alongside the
existing Day metadata. Legacy questions without the new topic field fall back
to their stored Day label so an existing attempt still renders.

The shared question component accepts optional confirmed-answer metadata.
Standard Day and Premium quizzes do not pass that metadata, so their feedback
layout and behavior do not change.

## Dynamic Totals

Replace user-visible and validation-level assumptions of 20 with the stored
attempt's question count. This includes:

- book CTA labels and supporting copy;
- progress indicators;
- completion and result totals;
- summary mapping and persisted result parsing;
- memory and Supabase stores;
- database constraints and Pop Quiz RPC validation.

New attempt creation verifies that the number of questions equals the current
book Day count and that each book Day appears exactly once. Completion uses the
stored question count. Existing 20-question rows remain valid even when they do
not contain every Day, but all newly created attempts use the one-per-Day rule.

## Database Migration

Add a new timestamped migration; do not edit the applied Pop Quiz migration.
The migration replaces fixed-20 table constraints and updates the start and
completion RPCs to use the selected book's Day count and the stored question
count. It preserves current rows and maintains existing ownership, source
question, idempotency, and retake protections.

The sole hosted target is main/production Supabase project
`ccawzrrkxuirrwvaecvw`. Applying the migration requires explicit confirmation
immediately before the production write.

## Error Handling and Compatibility

- A Day with no eligible source question produces the existing preparation
  error and creates no attempt.
- Refresh and resume preserve the stored selection and dynamic total.
- Existing in-progress or completed 20-question attempts remain usable.
- Missing, Premium, and foreign books keep their current inaccessible behavior.
- No WCT lesson content, Day quiz set, or prior attempt is deleted or rewritten.

## Testing and Verification

- Selector tests prove exactly one question per Day for 16-Day and 28-Day
  books, stable seeded selection, different retakes, and failure for a missing
  Day source.
- Component tests prove that Day/topic metadata is absent before confirmation,
  visible afterward, and totals are dynamic in runner and CTA states.
- Store and mapper tests prove dynamic totals and legacy 20-question attempt
  compatibility.
- Migration and security tests prove the new per-Day validation, dynamic
  completion total, ownership isolation, and direct-write denial.
- Run lint, typecheck, targeted tests, the relevant broader suites, build, and
  the live Prenovice and Novice Pop Quiz routes on an externally bound healthy
  dev server.

## Acceptance Criteria

- A new Prenovice Pop Quiz has 16 questions and a new Novice Pop Quiz has 28.
- Every Day appears exactly once in a new attempt.
- The source Day and topic remain hidden until `정답 확인` and then appear in
  the feedback panel as `Day N · topic`.
- Progress, CTA, completion, and result totals match the attempt length.
- Retakes change at least one source question while refresh/resume preserves the
  current attempt.
- Existing 20-question attempts, Day quizzes, Premium, ownership boundaries,
  and lesson content continue to work.
