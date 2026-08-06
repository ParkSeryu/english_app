# WCT Quiz Quality and Variety

- Status: Complete
- Tracker: `docs/prd/future-work.md#2026-08-06--t-011-wct-quiz-quality-and-variety`
- PRD: `prd.md`
- Test spec: `test-spec.md`
- Canonical implementation plan:
  `docs/superpowers/plans/2026-08-05-wct-quiz-quality-variety.md`
- Approved design:
  `docs/superpowers/specs/2026-08-05-wct-quiz-quality-variety-design.md`

## Delivered

- Replaced the 44 standard Prenovice/Novice Day sets with 220 audited
  `wct-review-v2` questions: 88 sentence-choice, 88 fill-blank, and 44 O/X.
- Kept every question button-only and removed typing. Each Day has the required
  2/2/1 format mix, with Day/topic and source-faithful feedback revealed only
  after answer confirmation.
- Pop Quiz now selects one question from every available Day (16 Prenovice or
  28 Novice), and every retake changes both question ID and cyclic format for
  every Day.
- Applied the approved eight UTF-8 source-field corrections atomically with the
  v2 replacement. Premium remains unchanged on `wct-review-v1`.
- Fixed same-route Pop retakes so a completed result remounts immediately with
  the newly created attempt instead of retaining stale client state.

## Changed files

- App routes/actions: `app/api/wct/import/route.ts`,
  `app/lessons/books/[bookId]/days/[dayId]/**`,
  `app/lessons/books/[bookId]/pop-quiz/**`, `app/lessons/quiz-actions.ts`, and
  the WCT test seed/reset routes.
- UI: `components/wct/WctQuizQuestionStep.tsx`,
  `components/wct/WctQuizRunner.tsx`, and
  `components/wct/WctPopQuizRunner.tsx`.
- Quiz domain/stores: `lib/wct/quiz/**`, `lib/wct/pop-quiz/**`,
  `lib/wct-quiz-store/**`, and `lib/wct-pop-quiz-store/**`.
- Generation/release/security: `scripts/generate-wct-quiz-v2.ts`, the WCT
  backfill/RLS/concurrency/data-migration scripts, and `package.json`.
- Schema/data: `supabase/migrations/20260805120000_add_wct_quiz_v2_compatibility.sql`
  and `supabase/migrations/20260805130000_replace_wct_standard_quizzes_v2.sql`.
- Verification: `e2e/wct-{day-review-quiz,pop-quiz}.spec.ts` and the WCT unit,
  component, integration, security, migration, editorial, and release tests
  under `tests/`.
- Artifacts/docs: this completed folder, the approved design and plan under
  `docs/superpowers/`, `docs/prd/README.md`, and `docs/prd/future-work.md`.

The implementation range `423088e..2d5b447` changes 91 paths. This lifecycle
closure only moves the feature artifacts to `complete/` and records evidence.

## Completion evidence

- Surface classification: mixed UI, routes, server actions, API, persistence,
  and schema; therefore runtime-facing.
- Commands/checks passed:

  ```bash
  npm run lint
  npm run typecheck
  npm test
  npm run build
  npm run verify:rls
  npm run test:e2e -- e2e/wct-day-review-quiz.spec.ts e2e/wct-pop-quiz.spec.ts --project=mobile-chromium
  npm run wct:quiz-v2:verify -- --artifact docs/prd/complete/wct-quiz-quality-variety/question-artifact.json
  npm run db:status
  npm run db:validate
  ```

  Full Vitest passed 708 tests with 2 skipped; the full mobile WCT suite passed
  10/10. The focused same-route retake regression passed 1/1 after a red test,
  and the final action/runner review passed 18/18. Lint, typecheck, build, and
  RLS verification passed.
- A fresh `0.0.0.0:3001` dev server returned HTTP 200 for `/` over
  `127.0.0.1` and `172.22.48.149`; affected authenticated WCT routes returned
  the expected login redirect while server logs remained free of 500, missing
  chunk/module, schema, and failed-action errors.
- Exact affected local routes checked:
  - `http://127.0.0.1:3001/lessons/books/4a71e072-96de-4722-8874-c35b3ca97ec1/days/42191db6-1468-4448-a363-2b9ff743c656/quiz`
  - `http://127.0.0.1:3001/lessons/books/4a71e072-96de-4722-8874-c35b3ca97ec1/pop-quiz`
  - `http://127.0.0.1:3001/lessons/books/c4ab0760-3c31-4533-9631-0e2ead3bfe90/pop-quiz`
  - `http://172.22.48.149:3001/lessons/books/4a71e072-96de-4722-8874-c35b3ca97ec1/pop-quiz`
- Main/production Supabase project `ccawzrrkxuirrwvaecvw` has both migrations
  applied: 39 ledger records, pending 0, checksum mismatch 0.
- Production readback confirmed 44 sets/220 questions, format counts 88/88/44,
  no typing, exact source/audit payloads, and unchanged Premium v1 data.
- Authenticated production smoke completed a standard Day quiz plus first and
  retake Pop flows for all 16 Prenovice and 28 Novice Days. Day/topic stayed
  hidden before confirmation and appeared with the correct sentence, pattern,
  and reason afterward. The same-route retake showed question 1 immediately.
- Exact authenticated production routes exercised:
  - `https://english-phi-drab.vercel.app/lessons/books/4a71e072-96de-4722-8874-c35b3ca97ec1/days/42191db6-1468-4448-a363-2b9ff743c656/quiz`
  - `https://english-phi-drab.vercel.app/lessons/books/4a71e072-96de-4722-8874-c35b3ca97ec1/pop-quiz`
  - `https://english-phi-drab.vercel.app/lessons/books/c4ab0760-3c31-4533-9631-0e2ead3bfe90/pop-quiz`
- The three smoke-test progress rows were deleted after explicit approval.
  Post-cleanup counts are Day 0, Pop 0, Premium 0; standard inventory, source,
  correction, and Premium hashes are unchanged.
- Production deployment for the same-route fix is Ready at
  `https://vercel.com/parkseryus-projects/english/9PhEoJfQaDvUMACRZnatG36ZHkh7`,
  and `https://english-phi-drab.vercel.app` returns HTTP 200.

## Remaining risks

No WCT-specific remaining risk is known. Three unrelated older all-app E2E
expectations (back navigation, the Next development toolbar portal, and topic
labels) remain outside this feature's scope; the complete WCT suite is green.
