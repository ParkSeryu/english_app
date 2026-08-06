# WCT Pop Quiz Day Order Shuffle

- Status: Complete
- Tracker: `docs/prd/future-work.md#2026-08-06--t-012-wct-pop-quiz-day-order-shuffle`
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
- [x] New v2 16/28-Day attempts contain every Day once in a non-canonical seeded order.
- [x] A v2 retake changes Day order plus every Day's question ID and format.
- [x] Resume preserves the stored order; v1 and Premium behavior stay unchanged.
- [x] Local live routes, mobile E2E, RLS, build, and production deployment checks pass.

- Surface classification: mixed selection logic/server action/persistence validation/UI flow => runtime-facing.
- Non-goals: schema/data migration, Premium, standard Day quiz, lesson content, feedback copy/timing, scoring, and v1 behavior changes.

## Final verification evidence

- Exact changed-file inventory: see the 14 paths in
  [README.md](README.md#changed-files). Runtime verification directly covers
  `lib/wct/pop-quiz/{selector,service}.ts`, their unit tests,
  `scripts/verify-rls.sql`, and `e2e/wct-pop-quiz.spec.ts`.
- Focused Vitest: 6/6 files, 83/83 tests, 0 skipped. Exact full Vitest retry:
  86 files passed, 1 skipped; 712 tests passed, 2 skipped; 45.82s.
- The first full attempt timed out the unchanged canonical WCT audit at
  5.626s against a 5-second limit. Three independent audit-file runs, a
  1.07-second single-case run, and a one-worker full-suite control isolated
  host CPU contention; the required unchanged default-worker retry passed.
- Production build passed with 18/18 static pages. Local executable RLS/RPC,
  concurrency, v2 rollback, and shuffled-array verification passed. Mobile
  Chromium passed 2/2 in 1.7m with no skips.
- Production-configured localhost/LAN checks returned root 200 and required
  Pop 307 login redirects; prohibited runtime-error counts were zero.
- Commit `89434d410ac5364e34dcde10f258e2b46cad8aa2` has successful GitHub/Vercel
  status. Production root returned 200 and both exact Pop routes returned 307
  with correct `/login?next=...` Locations.
- Database: no migration/schema change and no hosted write, authentication, or
  quiz-progress creation. Remaining WCT-specific risks: none known.
