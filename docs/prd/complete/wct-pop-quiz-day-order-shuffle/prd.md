# WCT Pop Quiz Day Order Shuffle

- Status: Complete
- Tracker: `docs/prd/future-work.md#2026-08-06--t-012-wct-pop-quiz-day-order-shuffle`
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

- [x] New v2 16/28-Day attempts contain every Day once in a non-canonical seeded order.
- [x] A v2 retake changes Day order plus every Day's question ID and format.
- [x] Resume preserves the stored order; v1 and Premium behavior stay unchanged.
- [x] Local live routes, mobile E2E, RLS, build, and production deployment checks pass.

- Surface classification: mixed selection logic/server action/persistence validation/UI flow => runtime-facing.

## Completion record

- Exact changed-file inventory: the 14 paths in the
  [completed README](README.md#changed-files), covering selector/service,
  selector/service tests, executable RLS regression, mobile E2E, approved
  design/plan, and T-012 lifecycle docs.
- Local gates: lint and typecheck passed; focused Vitest passed 83/83; after a
  diagnosed CPU-contention timeout in the unchanged canonical audit, exact
  full Vitest passed 712 with 2 skipped; build, local RLS, 2/2 mobile E2E,
  diff checks, localhost/LAN routes, and prohibited-error scans passed.
- Deployment: exact commit
  `89434d410ac5364e34dcde10f258e2b46cad8aa2` has GitHub/Vercel `success`
  (`Deployment has completed`). Production root returned 200 and both exact
  Pop routes returned 307 with correct login Locations.
- Database: no migration or schema change; no hosted data read/write,
  authentication, or quiz-progress mutation was performed.
- Remaining risk: none known for WCT. A pre-existing CPU-heavy audit remains
  sensitive to local contention, but the unchanged exact suite passed on retry.
