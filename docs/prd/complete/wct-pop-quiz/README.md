# WCT Pop Quiz

- Status: Complete
- Tracker: `docs/prd/future-work.md#2026-08-03--wct-pop-quiz`
- PRD: `prd.md`
- Test spec: `test-spec.md`
- Canonical implementation plan: `docs/superpowers/plans/2026-08-04-wct-pop-quiz-day-coverage.md`
- Approved design: `docs/superpowers/specs/2026-08-04-wct-pop-quiz-day-coverage-design.md`

## Goal

Provide a resumable WCT book-level Pop Quiz for Prenovice and Novice with one
approved translation or pattern question from every current Day.

## Delivered

- New Prenovice and Novice attempts contain one non-concept question per Day:
  16 and 28 questions respectively, in ascending Day order.
- The source stays hidden while answering and appears only after confirmation as
  `Day N · topic`; legacy snapshots fall back to their stored Day label.
- CTA, runner, summaries, completion, and retakes use the stored question count
  rather than a fixed 20-question denominator.
- Existing immutable 20-question attempts remain readable and completable.
- Owner-scoped Supabase RPC persistence validates current-Day coverage; direct
  writes and cross-owner reads remain blocked.

## Changed files

- App/UI: `app/lessons/books/[bookId]/page.tsx`,
  `app/lessons/books/[bookId]/pop-quiz/actions.ts`,
  `components/wct/WctPopQuizCta.tsx`, `components/wct/WctPopQuizRunner.tsx`,
  `components/wct/WctQuizQuestionStep.tsx`
- Domain/store: `lib/wct/pop-quiz/{selector,service,types,validation}.ts`,
  `lib/wct-pop-quiz-store/{mappers,memory-store,supabase-store}.ts`
- Schema/security: `supabase/migrations/20260804120000_update_wct_pop_quiz_day_coverage.sql`,
  `scripts/verify-rls.sql`
- Verification: `app/test/seed-wct-book/route.ts`, `e2e/wct-pop-quiz.spec.ts`,
  `tests/components/{wct-pop-quiz-cta,wct-pop-quiz-runner,wct-quiz-runner}.test.tsx`,
  `tests/integration/memory-wct-pop-quiz-store.test.ts`,
  `tests/unit/{main-only-environment,wct-pop-quiz-actions,wct-pop-quiz-mappers,wct-pop-quiz-selector,wct-pop-quiz-service,wct-pop-quiz-validation}.test.ts`

## Completion evidence

- `npm run lint` and `npm run typecheck` passed.
- Focused Pop Quiz Vitest coverage passed: 10 files, 56 tests. Full Vitest
  passed: 70 files, 362 tests; 1 skipped.
- `npm run build` passed. The focused mobile Chromium journey was rerun after
  the build/restart: 2/2 passed, covering both 16-Day Prenovice and 28-Day
  Novice flows, source timing, refresh/resume, result links, changed retakes,
  Premium exclusion, and owner isolation.
- Migration `20260804120000_update_wct_pop_quiz_day_coverage.sql` is applied to
  main/production project `ccawzrrkxuirrwvaecvw`: 37 ledger records,
  pending 0, checksum mismatch 0; `npm run db:validate` validated all 37.
- `npm run verify:rls` passed, including the dynamic WCT Pop Quiz smoke and the
  malformed completed-replay check. A direct hosted rollback-only authenticated
  16/28 Day RPC flow also passed; it verified direct insert denial and left no
  production residue.
- After the build the externally bound development server returned HTTP 200 for
  local Prenovice/Novice book and Pop Quiz routes and for the reachable LAN
  Prenovice Pop Quiz route. Its log contained no 500, internal-server, missing
  module/chunk, schema, or failed-action errors.

## Remaining risks

- The executable database smoke does not create an explicit legacy
  20-question-row fixture. Compatibility is covered by validation/mappers and
  the migration's question-length-relative constraints, but that exact database
  fixture remains a targeted future regression check.
- Verification output retained two unrelated environment warnings: Next's
  existing Edge-runtime/static-generation warning and Playwright's
  `NO_COLOR`/`FORCE_COLOR` warning. Neither corresponded to a failure.
