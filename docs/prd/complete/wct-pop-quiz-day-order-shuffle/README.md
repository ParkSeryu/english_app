# WCT Pop Quiz Day Order Shuffle

- Status: Complete
- Tracker: `docs/prd/future-work.md#2026-08-06--t-012-wct-pop-quiz-day-order-shuffle`
- Approved design: `docs/superpowers/specs/2026-08-06-wct-pop-quiz-day-order-shuffle-design.md`
- Canonical plan: `docs/superpowers/plans/2026-08-06-wct-pop-quiz-day-order-shuffle.md`
- PRD: `prd.md`
- Test spec: `test-spec.md`
- Implementation plan: `implementation-plan.md`

## Delivered

- New `wct-review-v2` Prenovice and Novice Pop attempts deterministically
  shuffle all 16 or 28 source Days without duplicates or omissions.
- A v2 retake changes the Day order and rotates every Day's question ID and
  format, including the gapped production Novice Day schedule.
- A compatible stored v2 attempt resumes in its exact persisted order. Legacy
  v1 positional validation, restart behavior, and Premium remain unchanged.
- Existing store/RPC ownership, source, scoring, and persisted-array behavior
  accept the shuffled snapshot without a schema or data migration.

## Delivery contract

- [x] New v2 16/28-Day attempts contain every Day once in a non-canonical seeded order.
- [x] A v2 retake changes Day order plus every Day's question ID and format.
- [x] Resume preserves the stored order; v1 and Premium behavior stay unchanged.
- [x] Local live routes, mobile E2E, RLS, build, and production deployment checks pass.

- Surface classification: mixed selection logic/server action/persistence validation/UI flow => runtime-facing.
- Non-goals: schema/data migration, Premium, standard Day quiz, lesson content, feedback copy/timing, scoring, and v1 behavior changes.

## Changed files

The implementation range
`d3f7ac7f995f65a07909f8edf4fe9bb70b6ca115..89434d410ac5364e34dcde10f258e2b46cad8aa2`
changes 14 logical paths. After lifecycle relocation, their exact final paths
are:

- `docs/prd/README.md`
- `docs/prd/complete/wct-pop-quiz-day-order-shuffle/README.md`
- `docs/prd/complete/wct-pop-quiz-day-order-shuffle/implementation-plan.md`
- `docs/prd/complete/wct-pop-quiz-day-order-shuffle/prd.md`
- `docs/prd/complete/wct-pop-quiz-day-order-shuffle/test-spec.md`
- `docs/prd/future-work.md`
- `docs/superpowers/plans/2026-08-06-wct-pop-quiz-day-order-shuffle.md`
- `docs/superpowers/specs/2026-08-06-wct-pop-quiz-day-order-shuffle-design.md`
- `e2e/wct-pop-quiz.spec.ts`
- `lib/wct/pop-quiz/selector.ts`
- `lib/wct/pop-quiz/service.ts`
- `scripts/verify-rls.sql`
- `tests/unit/wct-pop-quiz-selector.test.ts`
- `tests/unit/wct-pop-quiz-service.test.ts`

The four PRD paths were originally added under `active/` and are shown above
at their final lifecycle location. This closure also updates their contents and
moves T-012 from `Active` to `Complete`; it does not change runtime code.

## Completion evidence

Commands/checks passed at unchanged implementation HEAD `89434d4`:

```bash
npm run lint
npm run typecheck
npm test -- tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-actions.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/integration/memory-wct-pop-quiz-store.test.ts tests/components/wct-pop-quiz-runner.test.tsx
npm test
npm run build
npm run verify:rls
npm run test:e2e -- e2e/wct-pop-quiz.spec.ts --project=mobile-chromium
git diff --check
```

- Lint and typecheck passed with zero warnings/errors. The focused suite passed
  6/6 files and 83/83 tests with no skips.
- The first default-worker full-suite attempt hit the pre-existing canonical
  WCT audit's 5-second timeout at 5.626s under local CPU contention. The audit
  file then passed 3/3 independent focused runs, the single case passed in
  1.07s, and a one-worker diagnostic full suite passed. The unchanged exact
  mandatory `npm test` retry passed 86 files with 1 skipped and 712 tests with
  2 skipped in 45.82s.
- The unrestricted production build passed, compiled in 23.6s, and generated
  18/18 static pages. Local Docker-backed RLS/RPC, concurrency, v2 migration,
  rollback, and shuffled Pop verification passed.
- Mobile Chromium passed 2/2 journeys in 1.7m: complete/retake Prenovice and
  Novice flows plus Premium and other-owner isolation. No test was skipped.
- A fresh production-configured `0.0.0.0:3001` server returned root HTTP 200
  over `127.0.0.1` and `172.22.48.149`. Both localhost Pop routes and the LAN
  Prenovice route returned HTTP 307 with the correct `/login?next=...`
  Location. Counts for 500, `InternalServerError`, missing module/chunk,
  schema, failed-action, and webpack errors were all zero.
- Non-failing local warnings were limited to Next's linked-worktree lockfile
  root inference, webpack's 230kiB cache serialization warning, edge-runtime
  static-generation notice, and Playwright's `NO_COLOR`/`FORCE_COLOR` notice.

## Deployment and database

- Runtime implementation commit:
  `89434d410ac5364e34dcde10f258e2b46cad8aa2`.
- GitHub combined status: `success`; Vercel context: `success`,
  `Deployment has completed`.
- Deployment status URL:
  `https://vercel.com/parkseryus-projects/english/58LpfJPb4xaAH9GFyb1EBEvRpQ7z`.
- Production root `https://english-phi-drab.vercel.app/` returned HTTP 200.
  Exact Prenovice and Novice Pop routes returned HTTP 307 with their correct
  `/login?next=...` Locations.
- Database: no migration, schema change, hosted data read/write, authentication,
  or quiz-progress mutation was required or performed for this release.

## Remaining risks

No WCT-specific remaining risk is known. The initial audit timeout demonstrated
that a pre-existing CPU-heavy test is sensitive to local host contention, but
the root cause was isolated and the unchanged exact mandatory suite passed on
retry. The production verification was intentionally unauthenticated and
read-only; no progress residue exists from this release.
