# WCT Pop Quiz Day Order Shuffle

- Status: Complete
- Tracker: `docs/prd/future-work.md#2026-08-06--t-012-wct-pop-quiz-day-order-shuffle`
- Approved design: `docs/superpowers/specs/2026-08-06-wct-pop-quiz-day-order-shuffle-design.md`
- Canonical plan: `docs/superpowers/plans/2026-08-06-wct-pop-quiz-day-order-shuffle.md`

The canonical step-by-step implementation plan is:

`docs/superpowers/plans/2026-08-06-wct-pop-quiz-day-order-shuffle.md`

Acceptance:
- [x] New v2 16/28-Day attempts contain every Day once in a non-canonical seeded order.
- [x] A v2 retake changes Day order plus every Day's question ID and format.
- [x] Resume preserves the stored order; v1 and Premium behavior stay unchanged.
- [x] Local live routes, mobile E2E, RLS, build, and production deployment checks pass.

- Surface classification: mixed selection logic/server action/persistence validation/UI flow => runtime-facing.
- Non-goals: schema/data migration, Premium, standard Day quiz, lesson content, feedback copy/timing, scoring, and v1 behavior changes.
