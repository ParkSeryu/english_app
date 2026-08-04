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
- Feature documentation/plan: `docs/prd/README.md`,
  `docs/prd/complete/wct-pop-quiz/{README,prd,test-spec}.md`,
  `docs/prd/future-work.md`, and
  `docs/superpowers/plans/2026-08-04-wct-pop-quiz-day-coverage.md`

The feature range `954badd..ba38c99` changes these 32 paths.

## Completion evidence

- Commands that passed:

  ```bash
  npm run lint
  npm run typecheck
  npm test -- tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-actions.test.ts tests/unit/wct-pop-quiz-mappers.test.ts tests/integration/memory-wct-pop-quiz-store.test.ts tests/components/wct-pop-quiz-runner.test.tsx tests/components/wct-pop-quiz-cta.test.tsx tests/components/wct-quiz-runner.test.tsx tests/security/wct-pop-quiz-rls-policy.test.ts
  npm test
  npm run build
  env PATH=/home/ubuntu/.nvm/versions/node/v22.22.1/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin TMPDIR=/tmp TEMP=/tmp TMP=/tmp npm run test:e2e -- e2e/wct-pop-quiz.spec.ts --project=mobile-chromium
  ```

  The focused Vitest run passed 10 files/56 tests; full Vitest passed 70
  files/362 tests with 1 skipped. The post-build mobile Chromium run passed
  2/2, covering both 16-Day Prenovice and 28-Day Novice flows, source timing,
  refresh/resume, result links, changed retakes, Premium exclusion, and owner
  isolation.
- Migration `20260804120000_update_wct_pop_quiz_day_coverage.sql` is applied to
  main/production project `ccawzrrkxuirrwvaecvw`: 37 ledger records,
  pending 0, checksum mismatch 0; `npm run db:validate` validated all 37.
- `npm run verify:rls` passed, including the dynamic WCT Pop Quiz smoke and the
  malformed completed-replay check. A direct hosted rollback-only authenticated
  16/28 Day RPC flow also passed; it verified direct insert denial and left no
  production residue.
- The memory-only live server was started with:

  ```bash
  env PATH=/home/ubuntu/.nvm/versions/node/v22.22.1/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin TMPDIR=/tmp TEMP=/tmp TMP=/tmp E2E_MEMORY_STORE=1 E2E_FAKE_USER_ID=00000000-0000-4000-8000-000000000001 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-key npm run dev -- --hostname 0.0.0.0 --port 3000
  ```

  The following seeded routes returned HTTP 200:

  - `http://127.0.0.1:3000/lessons`
  - `http://127.0.0.1:3000/lessons/books/740b33b4-4338-4d43-8287-6edaa7bd0635`
  - `http://127.0.0.1:3000/lessons/books/740b33b4-4338-4d43-8287-6edaa7bd0635/pop-quiz`
  - `http://127.0.0.1:3000/lessons/books/aa2233e4-6eca-4716-94d6-78e605eb1523`
  - `http://127.0.0.1:3000/lessons/books/aa2233e4-6eca-4716-94d6-78e605eb1523/pop-quiz`
  - `http://172.22.48.149:3000/lessons/books/740b33b4-4338-4d43-8287-6edaa7bd0635/pop-quiz`

  Its log contained no 500, internal-server, missing module/chunk, schema, or
  failed-action errors.

## Remaining risks

- The executable database smoke does not create an explicit legacy
  20-question-row fixture. Compatibility is covered by validation/mappers and
  the migration's question-length-relative constraints, but that exact database
  fixture remains a targeted future regression check.
- Verification output retained two unrelated environment warnings: Next's
  existing Edge-runtime/static-generation warning and Playwright's
  `NO_COLOR`/`FORCE_COLOR` warning. Neither corresponded to a failure.
