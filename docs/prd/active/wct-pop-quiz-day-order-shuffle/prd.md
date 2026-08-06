# WCT Pop Quiz Day Order Shuffle

- Status: Active
- Tracker: `docs/prd/future-work.md#t-012-wct-pop-quiz-day-order-shuffle`
- Approved design: `docs/superpowers/specs/2026-08-06-wct-pop-quiz-day-order-shuffle-design.md`
- Canonical plan: `docs/superpowers/plans/2026-08-06-wct-pop-quiz-day-order-shuffle.md`

## User Problem

Current v2 WCT Pop Quiz attempts present Days in canonical order, letting a
learner anticipate the next source Day. New attempts and retakes need a fresh,
deterministic persisted Day order without changing the stored order of a
resumed attempt.

## Scope

- Apply a seeded Day permutation to new `wct-review-v2` Prenovice and Novice
  Pop Quiz attempts and compatible v2 retakes.
- Keep exactly one question from every available Day: 16 for Prenovice and 28
  for Novice, including non-contiguous Novice Day numbers.
- Preserve each v2 retake's per-Day question-ID and format rotation by Day ID.
- Validate v2 snapshots by exact Day coverage without requiring array order;
  preserve v1 positional validation and restart-required behavior.
- Keep a stored compatible attempt array unchanged on refresh and resume.

## Non-goals

- schema/data migration, Premium, standard Day quiz, lesson content, feedback copy/timing, scoring, and v1 behavior changes.

## Acceptance

- [ ] New v2 16/28-Day attempts contain every Day once in a non-canonical seeded order.
- [ ] A v2 retake changes Day order plus every Day's question ID and format.
- [ ] Resume preserves the stored order; v1 and Premium behavior stay unchanged.
- [ ] Local live routes, mobile E2E, RLS, build, and production deployment checks pass.

- Surface classification: mixed selection logic/server action/persistence validation/UI flow => runtime-facing.
