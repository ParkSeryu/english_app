# WCT Pop Quiz

- Status: Complete
- Tracker: `docs/prd/future-work.md#2026-08-03--wct-pop-quiz`
- PRD: `prd.md`
- Test spec: `test-spec.md`
- Canonical implementation plan: `docs/superpowers/plans/2026-08-03-wct-pop-quiz.md`
- Approved design: `docs/superpowers/specs/2026-08-03-wct-pop-quiz-design.md`

## Goal

Provide a resumable, book-level 20-question review quiz for WCT Prenovice and
Novice using existing approved Day quiz questions.

## Delivered

- Book-level, resumable 20-question Pop Quiz for Prenovice and Novice only.
- Existing Day questions sampled at translation/pattern 12/8 and early/middle/late 7/7/6, with at most two questions per Day.
- Confirm-before-feedback runner, result score, deduplicated incorrect-Day links, and a different consecutive retake selection.
- Owner-scoped Supabase persistence through authenticated RPCs; browser direct writes and cross-owner reads are blocked.

## Changed files

- `app/lessons/books/[bookId]/**`
- `components/wct/WctPopQuiz*.tsx`, shared `WctQuizQuestionStep.tsx`
- `lib/wct/pop-quiz/**`, `lib/wct-pop-quiz-store*`, and `lib/wct-quiz-store/**`
- `supabase/migrations/20260803120000_create_wct_pop_quiz.sql`
- `scripts/verify-rls*`, related tests, and `e2e/wct-pop-quiz.spec.ts`

## Completion evidence

- `npm run lint` and `npm run typecheck` passed.
- `npm test -- --maxWorkers=1`: 69 files passed, 1 skipped; 364 tests passed, 1 skipped.
- Combined WCT Playwright gate: 10/10 passed; fresh `0.0.0.0:3101` Pop Quiz journey: 2/2 passed.
- `npm run build` passed.
- Main/production `ccawzrrkxuirrwvaecvw`: 36 migrations applied, pending 0, checksum mismatch 0; all 36 records validated.
- Hosted rollback-only RLS check: own select allowed, cross-owner select empty, authenticated direct insert/update denied, anon select denied, and all three authenticated RPC grants present.
- Production inventory: Prenovice 16 Days/16 quiz sets; Novice 28 Days/28 quiz sets.
- Book and Pop Quiz routes returned HTTP 200 on both `127.0.0.1:3101` and `172.22.48.149:3101`; server logs contained no 500, internal server, missing module/chunk, schema, or failed-action error.

## Remaining risks

- `npm run verify:rls` requires local Docker, which was unavailable. Hosted rollback-only policy checks and repository security tests supplied equivalent production evidence.
- Live UI verification used the guarded E2E memory store; hosted schema/RLS and inventory were verified directly, but no real user's progress was retained.
