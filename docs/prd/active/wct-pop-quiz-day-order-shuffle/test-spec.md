# WCT Pop Quiz Day Order Shuffle

- Status: Active
- Tracker: `docs/prd/future-work.md#t-012-wct-pop-quiz-day-order-shuffle`
- Approved design: `docs/superpowers/specs/2026-08-06-wct-pop-quiz-day-order-shuffle-design.md`
- Canonical plan: `docs/superpowers/plans/2026-08-06-wct-pop-quiz-day-order-shuffle.md`

## Verification Contract

| Surface | Verification |
| --- | --- |
| v2 selection | The same seed and inventory produce the same Day permutation; a new 16/28-Day attempt includes every Day exactly once and is not canonical ascending order. |
| Fallback ordering | A seeded canonical first-attempt sequence rotates once; a retake whose seeded sequence matches the previous Day-ID order also rotates once. |
| v2 retake | Compare by Day ID to prove the Day order differs and every Day changes question ID and next format. |
| Resume and validation | A compatible stored v2 array resumes unchanged; duplicate, missing, foreign, and stale Day snapshots fail closed under exact-coverage validation. |
| Compatibility | v1 selection, retry seeds, positional validation, and restart-required behavior remain unchanged; Premium remains unchanged. |
| Store/RPC | Shuffled arrays remain accepted and scored in their persisted order with existing ownership and source protections. |
| Mobile and live routes | Mobile 16/28-Day flows show non-ascending first attempts, stable refresh/resume order, and changed retake order; routes work over localhost and reachable machine IP. |
| Release checks | Lint, typecheck, focused and full WCT tests, build, RLS, and production deployment checks pass. |

Acceptance:
- [ ] New v2 16/28-Day attempts contain every Day once in a non-canonical seeded order.
- [ ] A v2 retake changes Day order plus every Day's question ID and format.
- [ ] Resume preserves the stored order; v1 and Premium behavior stay unchanged.
- [ ] Local live routes, mobile E2E, RLS, build, and production deployment checks pass.

- Surface classification: mixed selection logic/server action/persistence validation/UI flow => runtime-facing.
- Non-goals: schema/data migration, Premium, standard Day quiz, lesson content, feedback copy/timing, scoring, and v1 behavior changes.
