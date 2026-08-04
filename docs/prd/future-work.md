# Future Work Tracker

## Purpose

앞으로 해야 할 제품/개발 작업을 한 곳에서 관리하는 문서입니다.

- 이 문서는 **작업 후보와 우선순위의 기준점**입니다.
- 실제 구현이 시작되면, 큰 작업은 별도 PRD / test-spec / implementation-plan 문서로 분리합니다.
- 완료 보고는 구현 PR/커밋이 아니라 이 문서의 `Complete` 섹션에도 남겨서 맥락을 잃지 않게 합니다.
- 문서 전체 지도는 `docs/prd/README.md`에서 확인합니다.

## Operating Rule

1. 새 아이디어는 먼저 `Backlog`에 추가합니다.
2. 다음에 할 작업은 `Backlog` 안에서 pull-ready 상태로 만들고, 성공 기준과 검증 방법을 적습니다.
3. `Active`로 옮기기 전에는 `Pull Readiness`를 채워서 바로 시작 가능한지 확인합니다.
4. 구현이 시작됐거나 구현 PR이 열려 있으면 해당 항목은 반드시 `Active`에 있어야 하며, PRD feature 폴더도 `docs/prd/active/` 아래에 있어야 합니다.
5. 동시에 진행 중인 작업은 가능하면 `Active` 1개만 둡니다.
6. 작업이 끝나면 `Complete`로 옮기고 변경 파일, 검증 명령, 남은 리스크를 기록합니다.
7. 범위가 커지면 이 문서에서 바로 구현하지 말고 별도 문서로 분리합니다.

## Pull System

작업은 `Backlog -> Active -> Complete` 순서로 당겨서 진행합니다.

### Backlog에 쌓을 때

- 아이디어 수준이어도 추가합니다.
- 단, 왜 필요한지(`Why`)와 하지 않을 것(`Non-goals`)을 최소로 적어 둡니다.
- 서로 얽힌 기능은 큰 Epic 아래에 작은 Slice로 나눕니다.

### Backlog에서 당겨올 준비를 할 때

다음 조건을 만족해야 합니다.

- 사용자가 체감할 개선이 한 문장으로 설명됩니다.
- 성공 기준이 체크박스로 검증 가능합니다.
- 앱 코드, DB/schema, auth, 외부 서비스 중 어떤 표면을 건드리는지 표시합니다.
- 필요한 PRD / test-spec / migration 여부가 표시됩니다.
- 작업 크기가 너무 크면 1~3일 안에 끝낼 수 있는 첫 Slice로 줄입니다.

### Active로 시작할 때

- `Active`에는 한 번에 1개만 둡니다.
- 관련 문서/PRD/test-spec 링크를 연결합니다.
- 구현 브랜치나 PR이 생긴 순간부터 `backlog/`가 아니라 `active/`에 둡니다.
- 구현 후 검증 명령과 live route 확인 결과를 `Complete`에 남깁니다.

## Artifact Rule

- `future-work.md`: 무엇을 할지, 어떤 순서로 당겨올지 관리하는 원장
- `<lifecycle>/<feature>/prd.md`: 왜/무엇을 만들지 정의하는 요구사항 문서
- `<lifecycle>/<feature>/test-spec.md`: 완료 기준을 어떻게 검증할지 정의하는 문서
- `<lifecycle>/<feature>/implementation-plan.md`: 이미 승인된 PRD/test-spec를 어떻게 구현할지 쪼갠 실행 문서
- `README.md`: 문서들의 현재 역할과 생명주기 지도

큰 작업을 `Active`로 옮기기 전에는 PRD/test-spec가 있는지 확인하고, 없으면 먼저 문서화합니다.

## Workstreams

현재 큰 방향은 세 갈래입니다.

1. **Retention Algorithm**: 망각곡선/SRS 알고리즘 개선
2. **Onboarding Load**: 신규회원이 한 번에 너무 많은 표현을 외우지 않게 완충하기
3. **Engagement Notifications**: 새 공통 토픽과 중요한 학습 진입점을 앱 밖에서도 알려주기

권장 진행 순서:

1. 신규회원 배려의 최소 Slice를 먼저 정합니다. 학습 진입 장벽을 줄이는 효과가 가장 즉시적입니다.
2. 그 다음 망각곡선 알고리즘을 조정합니다. 신규회원 정책과 큐 정책이 서로 영향을 주기 때문입니다.
3. 그 다음 알림을 붙입니다. 알림은 권한, 브라우저 지원, 배포 환경 확인이 필요해 외부 제약을 먼저 문서로 줄여 둡니다.

## Status Definitions

- `Backlog`: 언젠가 할 수 있지만 아직 확정하지 않은 작업
- `Active`: 현재 진행 중인 작업
- `Blocked`: 외부 결정, 계정, 데이터, 배포 권한 등이 없어 멈춘 작업
- `Complete`: 완료 및 검증까지 끝난 작업

## Task Template

```md
### T-000: 작업 제목

- Status:
- Priority: High | Medium | Low
- Workstream:
- Surface:
- Pull readiness:
  - [ ] User value is clear.
  - [ ] Acceptance criteria are testable.
  - [ ] Required data/schema changes are identified.
  - [ ] Required live route/action checks are identified.
- Artifacts:
  - PRD:
  - Test spec:
  - Implementation plan:
- Why:
- Scope:
- Non-goals:
- Acceptance criteria:
  - [ ]
- Verification:
  - [ ]
- Notes / links:
```

## Active

## Backlog

## Blocked

_막힌 작업과 필요한 결정을 여기에 둡니다._

## Complete

### 2026-08-03 — WCT Pop Quiz

- Status: Complete
- Surface: Prenovice/Novice book detail, Pop Quiz route, immutable attempt snapshots
- Scope: Replaced fixed 20-question quotas with one eligible translation or pattern question per Day, dynamic attempt totals, and confirmed-only `Day N · topic` feedback while retaining legacy snapshot compatibility.
- Artifacts:
  - PRD: `docs/prd/complete/wct-pop-quiz/prd.md`
  - Test spec: `docs/prd/complete/wct-pop-quiz/test-spec.md`
  - Implementation plan: `docs/superpowers/plans/2026-08-04-wct-pop-quiz-day-coverage.md`
- Verification commands passed:

  ```bash
  npm run lint
  npm run typecheck
  npm test -- tests/unit/wct-pop-quiz-selector.test.ts tests/unit/wct-pop-quiz-validation.test.ts tests/unit/wct-pop-quiz-service.test.ts tests/unit/wct-pop-quiz-actions.test.ts tests/unit/wct-pop-quiz-mappers.test.ts tests/integration/memory-wct-pop-quiz-store.test.ts tests/components/wct-pop-quiz-runner.test.tsx tests/components/wct-pop-quiz-cta.test.tsx tests/components/wct-quiz-runner.test.tsx tests/security/wct-pop-quiz-rls-policy.test.ts
  npm test
  npm run build
  env PATH=/home/ubuntu/.nvm/versions/node/v22.22.1/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin TMPDIR=/tmp TEMP=/tmp TMP=/tmp npm run test:e2e -- e2e/wct-pop-quiz.spec.ts --project=mobile-chromium
  ```

  Focused Vitest: 10 files/56 tests; full Vitest: 70 files/362 tests, 1 skipped; post-build E2E: 2/2. Main/production `ccawzrrkxuirrwvaecvw` has migration `20260804120000_update_wct_pop_quiz_day_coverage.sql` applied (37 records, pending 0, mismatch 0); validation, RLS, and the hosted rollback-only authenticated 16/28 flow passed.
- Live routes: `http://127.0.0.1:3000/lessons/books/740b33b4-4338-4d43-8287-6edaa7bd0635/pop-quiz`, `http://127.0.0.1:3000/lessons/books/aa2233e4-6eca-4716-94d6-78e605eb1523/pop-quiz`, and reachable LAN `http://172.22.48.149:3000/lessons/books/740b33b4-4338-4d43-8287-6edaa7bd0635/pop-quiz` returned HTTP 200 using the memory-only seed server.
- Remaining risk: executable DB smoke has no explicit literal legacy 20-question fixture; legacy contract remains covered by application validation/mappers and migration constraints.

### 2026-07-31 — Main-only infrastructure retirement

- Status: Complete
- Surface: Git branches/worktrees, Vercel deployments/config, Supabase project, local environment, operational tooling/docs
- Result:
  - [x] Database, WCT, and private-expression tooling targets main from `.env.local`.
  - [x] Local `.env.local` points to main Supabase and `.env.main.local` is removed.
  - [x] GitHub, local branches, and worktrees contain only `main`.
  - [x] Vercel dev Preview deployments (24) and Preview environment variables (3) are deleted.
  - [x] Vercel Production for `b98b01d` is READY and the public alias returns HTTP 200.
  - [x] Supabase dev project `uixpyibcpleuwsgemdno` is deleted; main `ccawzrrkxuirrwvaecvw` is `ACTIVE_HEALTHY`.
- Changed files:
  - `package.json`
  - `scripts/db-migrations.mjs`
  - `scripts/generate-wct-quiz-backfill.ts`
  - `scripts/sync-main-to-dev.mjs` (deleted)
  - `.codex/skills/english-private-expression-card/SKILL.md`
  - `.codex/skills/english-private-expression-card/scripts/add-private-expressions.mjs`
  - `tests/unit/main-only-environment.test.ts`
  - `AGENTS.md`
  - `README.md`
  - `docs/supabase-setup.md`
  - `docs/prd/future-work.md`
- Verification:
  - [x] `npm run lint` — passed
  - [x] `npm run typecheck` — passed
  - [x] `npm test` — 312 passed, 1 skipped
  - [x] `npm run build` — passed
  - [x] `npm run db:status` — main, 35 migrations, pending 0, mismatch 0
  - [x] `npm run db:validate` — 35 migration records validated
  - [x] Local live `/` and `/login` — HTTP 200 on `127.0.0.1:3000` and `172.22.48.149:3000`
  - [x] Vercel Production `https://english-phi-drab.vercel.app` — HTTP 200
  - [x] Vercel dev Preview count 0, Preview env count 0, dev alias HTTP 404
  - [x] `git branch -a`, GitHub branches, and `git worktree list` — only `main`
  - [x] `supabase projects list` — only `ccawzrrkxuirrwvaecvw`
- Remaining risks:
  - Supabase's GitHub check is still labeled `Supabase Preview` and can report migration replay failures even though no preview database branch exists.
  - Historical completed documents retain dev references intentionally.
- Design: `docs/superpowers/specs/2026-07-31-main-only-infrastructure-design.md`
- Plan: `docs/superpowers/plans/2026-07-31-main-only-infrastructure.md`

### 2026-07-28 — T-010: WCT Day 복습 객관식 퀴즈

- Status: Complete
- Priority: High
- Workstream: Course Reference
- Surface: WCT Day 상세, 전체화면 퀴즈, 개인 세트/진행도, RLS, 승인 import
- Artifacts:
  - PRD: `docs/prd/complete/wct-day-review-quiz/prd.md`
  - Test spec: `docs/prd/complete/wct-day-review-quiz/test-spec.md`
  - Implementation plan: `docs/prd/complete/wct-day-review-quiz/implementation-plan.md`
  - Approved design: `docs/superpowers/specs/2026-07-28-wct-day-review-quiz-design.md`
- Why: WCT 수업 내용을 Day별 객관식 문제로 바로 복습하고 최신 결과를 확인할 수 있어야 합니다.
- Scope:
  - 일반 Day 번역 3 + 패턴 2, Premium 개념 3 + 패턴/예문 2의 고정 5문항을 제공합니다.
  - Day 상세 배지, 전체화면 풀이, 즉시 피드백/해설, 최신 점수를 제공합니다.
  - 승인 import/Premium 첫 요청의 누락 세트 생성과 기존 일반 44 + Premium 1 백필을 완료했습니다.
- Non-goals: 런타임 AI API, 퀴즈 편집, 자유 입력/오디오, 시도 이력, main/production 적용
- Acceptance criteria:
  - [x] 기존 45개 Day가 검증된 5문항 세트를 가집니다.
  - [x] 일반/Premium 배지와 5문항 즉시 피드백 흐름이 동작합니다.
  - [x] 서버 계산 최신 점수가 Day 복귀 후 표시되고 재응시는 최신 점수를 교체합니다.
  - [x] owner 격리와 브라우저 직접 쓰기 차단이 검증됩니다.
- Changed files:
  - `app/api/wct/import/route.ts`, `app/lessons/**`, `components/wct/WctQuiz*.tsx`
  - `lib/wct/quiz/*`, `lib/wct-quiz-store*`
  - `scripts/*wct-quiz*`, `scripts/db-migrations.mjs`, `supabase/migrations/2026072812*.sql`
  - `tests/**/*wct-quiz*`, `e2e/wct-day-review-quiz.spec.ts`
  - `docs/prd/complete/wct-day-review-quiz/*`
- Verification:
  - [x] lint/typecheck passed; Vitest 306 passed, 1 skipped
  - [x] RLS/RPC passed; dev migration pending 0, mismatch 0
  - [x] backfill verify: standard 44, Premium 1, payload 45, Korean 45
  - [x] production build passed; combined WCT Playwright 8 passed
  - [x] post-build `0.0.0.0:3101` local/external routes 200, Playwright 3 passed, fatal log scan clean
- Remaining risks:
  - Main/production `ccawzrrkxuirrwvaecvw` is untouched and requires separate authorization.
  - Immutable `wct-review-v1` changes require a new generator version/migration.
  - Port 3000's unrelated `.env.main.local` server was preserved; live verification used 3101.

### 2026-07-26 — T-007: WCT 개인 수업 라이브러리

- Status: Complete
- Priority: High
- Workstream: Course Reference
- Surface: 하단 GNB, 수업 책장/Day 화면, 개인 저장소와 RLS, 승인형 import API
- Why: 학원 WCT 교재에서 배운 회화 패턴을 Day별로 다시 읽을 전용 공간이 필요합니다.
- Scope:
  - 하단 `수업`에서 개인 WCT 책과 Day를 읽을 수 있습니다.
  - Topic, 암기 모드, 사용자 편집 없이 교재 내용과 중요한 메모만 표시합니다.
  - 명시적으로 승인한 구조화 데이터만 원자적으로 import합니다.
  - 기존 레거시 수업 테이블은 제거하고 `ingestion_runs` 및 표현/암기 기능은 보존합니다.
- Non-goals: 앱 내 OCR 업로드, 공동 교재, 학습 진도, 운영 DB 자동 데이터 import
- Acceptance criteria:
  - [x] 하단 `수업`에서 WCT 책과 Day를 읽을 수 있습니다.
  - [x] WCT 데이터는 소유자만 읽고 브라우저에서 수정할 수 없습니다.
  - [x] 명시적으로 승인한 구조화 데이터만 원자적으로 저장됩니다.
  - [x] `ingestion_runs`와 표현/암기 기능은 보존됩니다.
- Changed files:
  - `app/api/wct/import/*`
  - `app/lessons/**`
  - `components/BottomNav.tsx`
  - `components/wct/*`
  - `lib/wct-store*`
  - `lib/wct/*`
  - `supabase/migrations/2026072612*.sql`
  - `e2e/wct-course-library.spec.ts`
  - `tests/components/wct-library.test.tsx`
  - `tests/integration/*wct*`
  - `tests/unit/wct-*`
  - `docs/prd/complete/wct-course-library/*`
- Verification:
  - [x] `npm run lint` — passed
  - [x] `npm run typecheck` — passed
  - [x] `npm test` — 217 passed, 1 skipped
  - [x] `npm run build` — passed
  - [x] targeted WCT Playwright flow — passed
  - [x] live `/lessons`, book, and Day routes — HTTP 200 and browser navigation verified on dev
- Remaining risks:
  - 운영 DB 스키마와 WCT 교재 데이터는 코드 승격과 별도이며, 운영 적용 전 별도 확인이 필요합니다.
  - 기존 `mobile-review` E2E의 Next 개발 오버레이 클릭 차단은 변경 전 `origin/main`에서도 재현됩니다.

### 2026-06-01 — T-009: 공통 토픽 PWA 푸시 알림 MVP

- Status: Complete
- Priority: High
- Workstream: Engagement Notifications
- Surface: PWA service worker, push subscription UI, admin topic API, async delivery job, persistence, schema/RLS
- Why: 새 공통 학습 토픽이 추가되어도 사용자가 알아차리기 어렵기 때문에, PWA를 설치하고 알림을 허용한 사용자에게 토픽 단위 새 카드 알림을 보냅니다.
- Scope:
  - `/settings/notifications`에서 로그인 사용자가 브라우저 Web Push 구독을 등록/해지할 수 있게 했습니다.
  - 공통 토픽 조건을 `expression_days.created_by = "llm"`, `all_authenticated` 폴더 ACL, `expressions.owner_id = expression_days.owner_id`로 제한했습니다.
  - 관리 토큰으로 `POST /api/notifications/topics/[id]/send`를 호출하면 토픽 단위 send event와 구독자별 delivery row를 생성합니다.
  - `POST /api/notifications/drain`과 send route의 drain 단계가 Web Push 전송을 비동기로 처리하고, 실패/구독 만료를 delivery 상태에 기록합니다.
  - `public/sw.js`가 push 수신과 notification click 이동을 처리합니다.
- Non-goals:
  - 네이티브 iOS/Android 앱 푸시
  - 카드 저장 시 자동 알림
  - 마케팅/캠페인 푸시
  - 사용자별 발송 시간 설정
  - 제한 폴더나 개인 카드 알림
- Acceptance criteria:
  - [x] PWA 사용자가 로그인 후 알림을 구독/해지할 수 있습니다.
  - [x] 관리자가 eligible shared topic에 대해 명시적으로 알림 전송을 실행할 수 있습니다.
  - [x] 하나의 topic send event는 active subscription당 최대 1회만 전달됩니다.
  - [x] private user topic, learner-added private card, `language-exchange` 같은 restricted folder는 알림 대상에서 제외됩니다.
  - [x] 발송 실패가 토픽/카드 저장 성공을 롤백하지 않습니다.
  - [x] 알림 클릭은 해당 토픽 또는 학습 화면으로 이동합니다.
- Changed files:
  - `.env.example`
  - `app/api/notifications/drain/route.ts`
  - `app/api/notifications/topics/[id]/send/route.ts`
  - `app/api/push/subscriptions/route.ts`
  - `app/settings/notifications/page.tsx`
  - `components/AccountMenu.tsx`
  - `components/PushNotificationSettings.tsx`
  - `docs/prd/README.md`
  - `docs/prd/backlog/push-notifications/README.md` (removed superseded brief)
  - `docs/prd/future-work.md`
  - `docs/prd/complete/public-topic-pwa-push-notifications/*`
  - `docs/supabase-setup.md`
  - `lib/env.ts`
  - `lib/push/*`
  - `package.json`
  - `package-lock.json`
  - `public/sw.js`
  - `scripts/db-migrations.mjs`
  - `scripts/verify-rls-local.sh`
  - `supabase/migrations/20260601053000_public_topic_push_notifications.sql`
  - `tests/components/push-notification-settings.test.tsx`
  - `tests/security/daily-expression-rls-policy.test.ts`
  - `tests/unit/public-topic-notifications.test.ts`
  - `tests/unit/push-subscriptions.test.ts`
- Verification:
  - [x] `node node_modules/typescript/bin/tsc --noEmit` — passed
  - [x] `node node_modules/eslint/bin/eslint.js . --max-warnings=0` — passed
  - [x] `node node_modules/vitest/vitest.mjs run tests/unit/public-topic-notifications.test.ts tests/unit/push-subscriptions.test.ts tests/components/push-notification-settings.test.tsx tests/security/daily-expression-rls-policy.test.ts --reporter=verbose` — 26 passed
  - [x] `bash scripts/verify-rls-local.sh` — passed
  - [x] `node scripts/db-migrations.mjs status --env dev` — dev project `uixpyibcpleuwsgemdno` checked before migration
  - [x] `node scripts/db-migrations.mjs migrate --env dev` — migration `20260601053000_public_topic_push_notifications.sql` applied, pending 0
  - [x] Hosted dev DB smoke — 3 push tables, 4 push subscription policies, 3 RLS-enabled push tables
  - [x] Hosted dev DB authenticated RLS smoke — owner can read own subscription, another auth uid cannot
  - [x] `node node_modules/next/dist/bin/next build` — passed
  - [x] `next dev --hostname 0.0.0.0` — Ready
  - [x] `HEAD http://127.0.0.1:3000/settings/notifications` — 200
  - [x] `HEAD http://172.22.48.149:3000/settings/notifications` — 200
  - [x] `POST http://127.0.0.1:3000/api/push/subscriptions` with authenticated E2E fake user and invalid body — 400 validation response
  - [x] `POST http://127.0.0.1:3000/api/notifications/drain` without token — 401
  - [x] `POST http://127.0.0.1:3000/api/notifications/topics/00000000-0000-4000-8000-000000000000/send` with admin token — 400 topic-not-found response
  - [x] Playwright mobile smoke for `/settings/notifications` with authenticated E2E fake user — rendered notification settings, 0 console errors
- Remaining risks:
  - Real device push was not exercised because VAPID keys and real browser push subscription setup are environment/device dependent.
  - iOS Web Push still requires installing the PWA to the Home Screen on supported iOS/iPadOS versions.
  - Migration was applied to the dev Supabase project only; main/production must be checked and migrated separately before release.
- Notes / links:
  - PRD: `docs/prd/complete/public-topic-pwa-push-notifications/prd.md`
  - Test spec: `docs/prd/complete/public-topic-pwa-push-notifications/test-spec.md`
  - Setup guide: `docs/supabase-setup.md#pwa-web-push-setup`

### 2026-05-27 — T-006: 카카오 소셜 로그인 추가

- Status: Complete
- Priority: High
- Workstream: Auth Onboarding
- Surface: auth, login UI, server action, Supabase OAuth provider configuration
- Why: 한국어 사용자에게 익숙한 카카오 계정 진입점을 제공해 이메일/비밀번호 입력 부담을 줄이기 위해서입니다.
- Scope:
  - `/login` 화면에 `카카오로 계속하기` 버튼을 추가했습니다.
  - Supabase Auth `kakao` OAuth provider로 로그인 흐름을 시작합니다.
  - OAuth 완료 후 기존 `/auth/callback`에서 세션을 교환합니다.
  - `/login?next=...`의 safe 내부 경로를 OAuth callback으로 전달합니다.
  - provider 미설정/오류 응답은 로그인 화면 메시지로 표시합니다.
- Non-goals:
  - Google/Naver/Apple 등 추가 provider
  - Kakao Developers 또는 Supabase Dashboard credential 자동 설정
  - 계정 병합/프로필 동기화/추가 Kakao API 호출
  - DB schema/RLS 변경
- Acceptance criteria:
  - [x] 로그인 화면에 카카오 로그인 버튼이 표시됩니다.
  - [x] Kakao 버튼은 Supabase `signInWithOAuth({ provider: "kakao" })` 흐름을 시작합니다.
  - [x] OAuth `redirectTo`는 기존 `/auth/callback`과 safe `next` 정책을 사용합니다.
  - [x] provider 미설정 오류가 앱을 깨뜨리지 않고 사용자 메시지로 표시됩니다.
  - [x] 기존 이메일 로그인/회원가입/비밀번호 재설정 UI가 유지됩니다.
  - [x] 실제 Kakao 로그인 성공에 필요한 dev/main Supabase 및 Kakao 설정 값이 문서화됩니다.
- Changed files:
  - `app/actions.ts`
  - `app/login/page.tsx`
  - `components/AuthPanel.tsx`
  - `lib/site-url.ts`
  - `tests/components/auth-panel.test.tsx`
  - `tests/unit/auth-actions.test.ts`
  - `tests/unit/site-url.test.ts`
  - `docs/supabase-setup.md`
  - `docs/prd/README.md`
  - `docs/prd/future-work.md`
  - `docs/prd/complete/kakao-social-login/*`
- Verification:
  - [x] `npm test -- tests/components/auth-panel.test.tsx tests/unit/auth-actions.test.ts tests/unit/site-url.test.ts tests/security/auth-callback.test.ts` — 35 passed
  - [x] `npm run lint` — passed
  - [x] `npm run typecheck` — passed
  - [x] `npm test` — 167 passed, 1 skipped
  - [x] `HEAD http://127.0.0.1:3000/login` — 200
  - [x] `GET http://127.0.0.1:3000/login` — rendered `카카오로 계속하기`
  - [x] `GET http://127.0.0.1:3000/login?next=%2Fmemorize%3Fdefer%3Dcard-1` — rendered hidden `next=/memorize?defer=card-1`
  - [x] `HEAD http://172.22.48.149:3000/login` — 200
- Remaining risks:
  - Real Kakao OAuth success was not exercised because Kakao Developers and Supabase Kakao provider credentials are external setup and were not available in this coding environment.
  - Dev and main Supabase projects must be configured separately before production use.
- Notes / links:
  - PRD: `docs/prd/complete/kakao-social-login/prd.md`
  - Setup guide: `docs/supabase-setup.md#kakao-social-login-setup`

### 2026-05-27 — T-003: 에빙하우스 망각곡선 기반 복습 알고리즘 적용

- Status: Complete
- PR: https://github.com/ParkSeryu/english_app/pull/5
- Merge commit: `f213ffb`
- Dev sync commit: `2b0346b`
- Priority: High
- Workstream: Retention Algorithm
- Surface: scheduling logic, persistence, tests, memorize UI
- Why: 현재 단순 간격 정책보다 기억 유지 목적에 맞는 복습 타이밍을 제공하면서, `다시`로 장기 간격이 줄어드는 부담을 제거하고, `어려움`과 `쉬움`을 구분하기 위해서입니다.
- Scope:
  - 버튼은 `다시 / 어려움 / 쉬움` 세 개로 구성했습니다.
  - `다시`는 저장된 interval을 줄이지 않고 `due_at = null`로 오늘 다시 보게 합니다.
  - `어려움`은 interval을 한 단계 낮추고, `쉬움`은 1 → 3 → 7 → 14 → 30 → 60 → 90 → 180 → 365일 ladder로 늘립니다.
  - `/memorize` 버튼에 `오늘 다시` / `N일 뒤`를 명시했습니다.
  - 기존 progress 데이터와 호환되게 schema 변경 없이 처리했습니다.
- Non-goals:
  - 완전한 SM-2/FSRS 구현
  - 머신러닝 개인화
  - 푸쉬 알림 발송
  - Anki식 `다시 / 어려움 / 좋음 / 쉬움` 4버튼 UI
- Acceptance criteria:
  - [x] 새 복습 간격 정책이 문서화됩니다.
  - [x] `쉬움`은 다음 복습일을 1/3/7/14/30/60/90/180/365일 ladder에 맞게 뒤로 미룹니다.
  - [x] `어려움`은 interval을 한 단계 낮춰 너무 빨리 늘리지 않습니다.
  - [x] `다시`는 interval을 줄이지 않고 오늘 다시 볼 대상으로 남깁니다.
  - [x] 기존 progress 데이터가 깨지지 않습니다.
  - [x] 버튼에 다음 시점이 명시됩니다.
- Changed files:
  - `app/actions.ts`
  - `components/MemorizeCard.tsx`
  - `components/MemorizeQueue.tsx`
  - `lib/scheduling.ts`
  - `lib/review-result.ts`
  - `lib/types.ts`
  - `lib/use-cases/expressions.ts`
  - `lib/expression-store/*`
  - `tests/components/memorize-card.test.tsx`
  - `tests/components/memorize-queue.test.tsx`
  - `tests/components/review-card.test.tsx`
  - `tests/integration/memory-expression-store.test.ts`
  - `tests/unit/scheduling.test.ts`
  - `docs/prd/complete/spaced-repetition-interval-policy/prd.md`
  - `docs/prd/future-work.md`
  - `docs/prd/README.md`
- Verification:
  - [x] `git diff --check` — passed
  - [x] `npm test -- tests/unit/scheduling.test.ts tests/integration/memory-expression-store.test.ts tests/components/memorize-card.test.tsx` — 28 passed
  - [x] `npm run lint` — passed
  - [x] `npm run typecheck` — passed
  - [x] `npm test` — 160 passed, 1 skipped
  - [x] `npm run clean:runtime && npm run build` — passed
  - [x] `HEAD http://127.0.0.1:3010/memorize` — 200
  - [x] `HEAD http://172.22.48.149:3010/memorize` — 200
  - [x] Playwright live route smoke confirmed `다시/오늘 다시`, `어려움/1일 뒤`, `쉬움/3일 뒤`
  - [x] Vercel deployment checks passed on `main` and `dev`
- Remaining risks:
  - Hosted Supabase write smoke was not rerun for this code-only scheduling change; no schema/data migration is required.
  - Dev Supabase Preview currently reports pre-existing remote migration version drift (`20260504014420`, `20260504014422`) even though `npm run db:status:dev` reports pending 0 / mismatch 0.
- Notes / links:
  - PRD: `docs/prd/complete/spaced-repetition-interval-policy/prd.md`
  - 관련 기존 문서: `docs/prd/complete/daily-expression-memorization/prd.md`

### 2026-05-27 — T-002: 신규회원 학습량 완충

- Status: Complete
- Priority: High
- Workstream: Onboarding Load
- Surface: auth context, UI-visible topic lists, queue scheduling, per-user progress reads
- Why: 신규 유입 사용자가 가입 이전에 누적된 shared 토픽 전체를 한 번에 마주치지 않고, 가입 이후 추가된 토픽부터 학습을 시작하게 하기 위해서입니다.
- Scope:
  - Supabase auth `created_at`을 `UserIdentity.createdAt`으로 전달합니다.
  - 비소유 shared 토픽은 `expression_days.created_at >= user.createdAt`일 때만 노출합니다.
  - `/memorize`, `/expressions`, 홈 최근 토픽/통계가 같은 노출 기준을 사용합니다.
- Non-goals:
  - DB schema migration
  - 카드 수 기반 단계적 해금/레벨 시스템
  - 전체 온보딩 튜토리얼
  - 푸쉬 알림
- Acceptance criteria:
  - [x] 신규 사용자는 가입 이전 shared 토픽의 카드를 `/memorize`에서 받지 않습니다.
  - [x] 가입 이후 shared 토픽은 목록과 큐에 정상 표시됩니다.
  - [x] 기존/테스트처럼 가입 시각이 없는 user context는 기존 readable topic 동작을 유지합니다.
  - [x] 제한 정책이 코드와 문서에 같은 의미로 기록됩니다.
- Changed files:
  - `middleware.ts`
  - `lib/auth.ts`
  - `lib/auth-context.ts`
  - `lib/types.ts`
  - `lib/expression-store/mappers.ts`
  - `lib/expression-store/memory-store.ts`
  - `lib/expression-store/policies.ts`
  - `lib/expression-store/supabase-store.ts`
  - `tests/integration/memory-expression-store.test.ts`
  - `docs/prd/future-work.md`
  - `docs/prd/complete/new-member-learning-load/*`
- Verification:
  - [x] `npm test -- tests/integration/memory-expression-store.test.ts` — 11 passed
  - [x] `npm run typecheck` — passed
  - [x] `npm run lint` — passed
  - [x] `npm test` — 161 passed, 1 skipped
  - [x] `npm run build` — passed
  - [x] `POST http://127.0.0.1:3012/test/reset` — 200
  - [x] `POST http://127.0.0.1:3012/test/seed-approved-expression-day` — 200
  - [x] `HEAD http://127.0.0.1:3012/memorize` — 200
  - [x] `GET http://127.0.0.1:3012/memorize` — rendered seeded memorization card
  - [x] `HEAD http://172.22.48.149:3012/memorize` — 200
- Remaining risks:
  - Existing users with a real Supabase `created_at` after older shared topics will no longer see those older shared topics unless they own them. This matches the requested signup-date policy but is intentionally not a progressive unlock system.


### 2026-05-26 — T-001: 향후 작업 목록을 이 문서로 관리하기

- Status: Complete
- Priority: Medium
- Why: 앞으로 해야 할 작업의 맥락, 우선순위, 완료 기준을 잃지 않기 위해 문서 기반 관리가 필요했습니다.
- Scope:
  - `docs/prd/future-work.md`를 작업 추적 기준점으로 추가했습니다.
  - 기존 PRD 문서들과 연결할 수 있도록 pull system, workstream, artifact rule을 정의했습니다.
- Non-goals: 별도 이슈 트래커, 자동화, 앱 UI 변경
- Changed files:
  - `docs/prd/future-work.md`
- Verification:
  - `git diff --check`
  - 문서 내용 직접 확인

### 2026-05-26 — T-005: PRD 문서 생명주기와 연결 구조 정리

- Status: Complete
- Priority: Medium
- Why: 기존 PRD/test-spec/implementation-plan 문서가 원장 기반 pull system과 연결되어야 다음 작업을 안전하게 당겨올 수 있습니다.
- Scope:
  - PRD 문서 인덱스를 추가했습니다.
  - 기존 문서에 tracker, lifecycle, parent/child artifact 관계를 명시했습니다.
  - superseded 문서와 complete 문서를 구분했습니다.
  - T-003 SRS 문서의 tracker 우선 원칙을 명시했습니다.
- Non-goals: 앱 코드 변경, PRD 내용 재작성, 새 기능 구현
- Changed files:
  - `docs/prd/README.md`
  - `docs/prd/future-work.md`
  - `docs/prd/complete/daily-expression-memorization/prd.md`
  - `docs/prd/complete/daily-expression-memorization/implementation-plan.md`
  - `docs/prd/complete/daily-expression-memorization/test-spec.md`
  - `docs/prd/complete/english-review-app-llm-ingestion-superseded/prd.md`
  - `docs/prd/complete/english-review-app-llm-ingestion-superseded/implementation-plan.md`
  - `docs/prd/complete/english-review-app-llm-ingestion-superseded/test-spec.md`
  - `docs/prd/active/spaced-repetition-interval-policy/prd.md`
- Verification:
  - `git diff --check`
  - `python3` PRD-doc whitespace/final-newline check
  - 문서 헤더/인덱스 직접 확인

### 2026-05-26 — T-006: PRD 문서를 feature/lifecycle 폴더 구조로 정리

- Status: Complete
- Priority: Medium
- Why: PRD/test-spec/implementation-plan이 루트에 섞여 있으면 어떤 문서가 한 기능 묶음인지 파악하기 어렵습니다.
- Scope:
  - active, backlog, complete 기준의 폴더 구조로 PRD 문서를 이동했습니다.
  - 각 feature 폴더 안에서 `prd.md`, `test-spec.md`, `implementation-plan.md`처럼 안정적인 파일명을 사용하도록 정리했습니다.
  - 문서 내부 참조와 PRD 인덱스를 새 경로에 맞게 갱신했습니다.
- Non-goals: 앱 코드 변경, 문서 내용 자체의 제품 결정 변경
- Changed files:
  - `docs/prd/README.md`
  - `docs/prd/active/README.md`
  - `docs/prd/future-work.md`
  - `docs/prd/complete/daily-expression-memorization/prd.md`
  - `docs/prd/complete/daily-expression-memorization/implementation-plan.md`
  - `docs/prd/complete/daily-expression-memorization/test-spec.md`
  - `docs/prd/complete/english-review-app-llm-ingestion-superseded/prd.md`
  - `docs/prd/complete/english-review-app-llm-ingestion-superseded/implementation-plan.md`
  - `docs/prd/complete/english-review-app-llm-ingestion-superseded/test-spec.md`
  - `docs/prd/active/spaced-repetition-interval-policy/prd.md`
  - `docs/prd/backlog/new-member-learning-load/README.md`
- Verification:
  - `git diff --check`
  - `python3` PRD-doc whitespace/final-newline check
  - old PRD path reference search
  - PRD markdown local path existence check

### 2026-05-26 — T-007: PRD 문서를 active/backlog/complete 구조로 단순화

- Status: Complete
- Priority: Medium
- Why: `baseline/ready-to-pull/archive`보다 `active/backlog/complete`가 작업 상태를 직관적으로 보여줍니다.
- Scope:
  - PRD 문서를 `active/`, `backlog/`, `complete/` 폴더 기준으로 재배치했습니다.
  - `active/README.md`를 추가해 빈 active 폴더의 운영 규칙을 기록했습니다.
  - 아직 PRD가 없는 backlog 항목에도 feature brief README를 추가했습니다.
  - PRD 인덱스와 문서 내부 링크를 새 경로에 맞게 갱신했습니다.
- Non-goals: 앱 코드 변경, 새 기능 구현, 제품 요구사항 변경
- Changed files:
  - `docs/prd/README.md`
  - `docs/prd/future-work.md`
  - `docs/prd/active/README.md`
  - `docs/prd/backlog/new-member-learning-load/README.md`
  - `docs/prd/active/spaced-repetition-interval-policy/prd.md`
  - `docs/prd/complete/daily-expression-memorization/prd.md`
  - `docs/prd/complete/daily-expression-memorization/implementation-plan.md`
  - `docs/prd/complete/daily-expression-memorization/test-spec.md`
  - `docs/prd/complete/english-review-app-llm-ingestion-superseded/prd.md`
  - `docs/prd/complete/english-review-app-llm-ingestion-superseded/implementation-plan.md`
  - `docs/prd/complete/english-review-app-llm-ingestion-superseded/test-spec.md`
- Verification:
  - `git diff --check`
  - `python3` PRD-doc whitespace/final-newline check
  - old lifecycle folder reference search
  - PRD markdown local path existence check

### 2026-05-26 — T-008: 문서 루트 이름을 docs/prd로 변경

- Status: Complete
- Priority: Medium
- Why: 이전 문서 루트보다 `docs/prd`가 현재 문서 묶음의 역할을 더 직접적으로 보여줍니다.
- Scope:
  - 이전 문서 루트를 `docs/prd/`로 이동했습니다.
  - repo 문서 안의 이전 경로 참조를 `docs/prd/...`로 갱신했습니다.
  - 인덱스 제목과 운영 문구를 PRD 기준으로 정리했습니다.
- Non-goals: 앱 코드 변경, SRS 구현, 제품 요구사항 변경
- Changed files:
  - `docs/prd/README.md`
  - `docs/prd/future-work.md`
  - `docs/prd/active/README.md`
  - `docs/prd/backlog/new-member-learning-load/README.md`
  - `docs/prd/active/spaced-repetition-interval-policy/prd.md`
  - `docs/prd/complete/daily-expression-memorization/prd.md`
  - `docs/prd/complete/daily-expression-memorization/implementation-plan.md`
  - `docs/prd/complete/daily-expression-memorization/test-spec.md`
  - `docs/prd/complete/english-review-app-llm-ingestion-superseded/prd.md`
  - `docs/prd/complete/english-review-app-llm-ingestion-superseded/implementation-plan.md`
  - `docs/prd/complete/english-review-app-llm-ingestion-superseded/test-spec.md`
- Verification:
  - `git diff --check`
  - `python3` PRD-doc whitespace/final-newline/path-reference check
  - old docs root reference search outside `.omx`
