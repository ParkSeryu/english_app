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
- 앱 코드, DB/schema, auth, push 권한, 외부 서비스 중 어떤 표면을 건드리는지 표시합니다.
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
2. **Engagement Push**: 앱 푸쉬 알림으로 복습 타이밍을 알려주기
3. **Onboarding Load**: 신규회원이 한 번에 너무 많은 표현을 외우지 않게 완충하기

권장 진행 순서:

1. 신규회원 배려의 최소 Slice를 먼저 정합니다. 학습 진입 장벽을 줄이는 효과가 가장 즉시적입니다.
2. 그 다음 망각곡선 알고리즘을 조정합니다. 신규회원 정책과 큐 정책이 서로 영향을 주기 때문입니다.
3. 마지막으로 푸쉬를 붙입니다. 푸쉬는 권한, 브라우저 지원, 스케줄링, 배포 환경 확인이 필요해 가장 외부 의존성이 큽니다.

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

_현재 진행 중인 작업은 없습니다._

## Backlog

### T-004: 앱 푸쉬 알림 추가

- Status: Backlog
- Priority: Medium
- Workstream: Engagement Push
- Surface: browser push/PWA, permissions, scheduling, server action/API, persistence, deployment
- Pull readiness:
  - [ ] User value is clear: 사용자가 복습할 시간에 앱 밖에서도 알림을 받습니다.
  - [ ] Acceptance criteria are testable.
  - [ ] Required data/schema changes are identified.
  - [ ] Required live route/action checks are identified.
- Artifacts:
  - Brief: `docs/prd/backlog/push-notifications/README.md`
  - PRD: TBD before moving to `Active`
  - Test spec: TBD before moving to `Active`
  - Implementation plan: TBD after browser/PWA constraints are confirmed
- Why: 복습 앱은 사용자가 돌아오는 타이밍이 중요하며, due 상태를 앱 밖에서 알려줄 필요가 있습니다.
- Scope:
  - 웹 푸쉬 가능 범위와 브라우저/PWA 제약을 확인합니다.
  - 알림 권한 요청 UX를 정의합니다.
  - 사용자별 push subscription 저장과 해지 처리를 정의합니다.
  - due cards가 있을 때 알림을 보내는 스케줄링 방식을 정합니다.
- Non-goals:
  - 네이티브 iOS/Android 앱
  - 마케팅 캠페인/세그먼트 자동화
  - 이메일/SMS 알림
- Acceptance criteria:
  - [ ] 사용자가 명시적으로 동의한 경우에만 push subscription이 저장됩니다.
  - [ ] due review가 있는 사용자에게 테스트 알림을 보낼 수 있습니다.
  - [ ] 알림 권한 거부/해지 상태가 앱을 깨뜨리지 않습니다.
  - [ ] production/dev Supabase 환경 적용 범위가 분리되어 기록됩니다.
- Verification:
  - [ ] push subscription 저장/삭제 테스트
  - [ ] permission UI 테스트
  - [ ] scheduled send 또는 manual send smoke check
  - [ ] `npm run lint`
  - [ ] `npm run typecheck`
  - [ ] affected route live check
- Notes / links:
  - 외부 제약이 많으므로 구현 전에 별도 PRD/test-spec가 필요합니다.
  - DB 변경이 필요하면 `supabase/migrations/*.sql`과 migration ledger로 관리합니다.

## Blocked

_막힌 작업과 필요한 결정을 여기에 둡니다._

## Complete

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
  - Historical Supabase CLI migration drift (`20260504014420`, `20260504014422`) was reconciled with no-op compatibility migrations and baselined in dev; no schema/data migration was required.
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
  - `docs/prd/backlog/push-notifications/README.md`
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
  - `docs/prd/backlog/push-notifications/README.md`
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
  - `docs/prd/backlog/push-notifications/README.md`
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
