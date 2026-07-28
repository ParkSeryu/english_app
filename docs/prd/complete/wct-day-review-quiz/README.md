# WCT Day Review Quiz

- Status: Complete
- Completed: 2026-07-28
- Tracker: `docs/prd/future-work.md#2026-07-28--t-010-wct-day-복습-객관식-퀴즈`
- PRD: `prd.md`
- Test spec: `test-spec.md`
- Canonical implementation plan: `docs/superpowers/plans/2026-07-28-wct-day-review-quiz.md`
- Approved design: `docs/superpowers/specs/2026-07-28-wct-day-review-quiz-design.md`

## Delivered

- 일반 WCT Day는 번역 3 + 패턴 2, Premium은 개념 3 + 패턴/예문 2의 고정 5문항을 제공합니다.
- Day 상세 배지에서 별도 전체화면 퀴즈로 이동하며 선택 즉시 정오답과 해설을 표시합니다.
- 서버가 계산한 최신 점수만 소유자별로 저장하고, 재응시는 같은 세트를 사용합니다.
- 일반 승인 import와 Premium 첫 요청은 누락 세트를 생성하며 기존 세트를 덮어쓰지 않습니다.
- dev의 기존 일반 44 Days와 Premium 1 Day, 총 45세트를 백필했습니다.

## Changed files

- Schema/data: `supabase/migrations/20260728120000_create_wct_review_quizzes.sql`, `supabase/migrations/20260728121000_backfill_wct_review_quizzes.sql`, `scripts/generate-wct-quiz-backfill.ts`, `scripts/db-migrations.mjs`
- Domain/store: `lib/wct/quiz/*`, `lib/wct-quiz-store*`
- Import/routes/UI: `app/api/wct/import/route.ts`, `app/lessons/**`, `components/wct/WctQuizBadge.tsx`, `components/wct/WctQuizRunner.tsx`
- Security/tests: `scripts/verify-wct-quiz-rls.sql`, `tests/**/*wct-quiz*`, `e2e/wct-day-review-quiz.spec.ts`
- Lifecycle docs: `docs/prd/complete/wct-day-review-quiz/*`, `docs/prd/future-work.md`

## Environment and data evidence

- Dev Supabase: `uixpyibcpleuwsgemdno`
- Applied migrations: 35, pending 0, checksum mismatches 0
- Stored sets: standard 44, Premium 1
- Generated/stored payload exact matches: 45
- Korean exact matches: 45; `???`/U+FFFD corruption 없음
- Main/production project `ccawzrrkxuirrwvaecvw`는 변경하지 않았습니다.

## Verification

- `npm run lint` — passed, warnings 0
- `npm run typecheck` — passed
- `npm test -- --maxWorkers=1` — 60 files and 306 tests passed, 1 conditional skip
- `npm run verify:rls` — base and WCT quiz RLS/RPC checks passed
- `npm run db:status:dev` — pending 0, checksum mismatches 0
- `npm run wct:quiz-backfill:verify` — standard 44, Premium 1, payload 45, Korean 45 matched
- `npm run build` — passed with both quiz routes in the Next route manifest
- `npx playwright test e2e/wct-day-review-quiz.spec.ts e2e/wct-course-library.spec.ts --project=mobile-chromium` — 8 passed
- Post-build task server `0.0.0.0:3101` — local and `http://172.22.48.149:3101/lessons` returned 200
- Live Standard quiz `http://127.0.0.1:3101/lessons/books/03cb335a-5ae8-4651-afba-45020567dad3/days/e6ebf5b1-0b7a-4da4-8420-4ba7004d88d1/quiz` — 200
- Live Premium quiz `http://127.0.0.1:3101/lessons/premium/days/day-1/quiz` — 200
- Post-build Playwright against the running task server — Standard retake, Premium completion, other-owner 404 passed; fatal log scan clean

## Remaining risks

- Main/production schema and data require separate status, migration, and readback verification with explicit authorization.
- Immutable `wct-review-v1` question changes require a new generator version/migration.
- Port 3000 was occupied by an unrelated `.env.main.local` server, so it was preserved and live verification used 3101.
