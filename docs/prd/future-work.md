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
4. 동시에 진행 중인 작업은 가능하면 `Active` 1개만 둡니다.
5. 작업이 끝나면 `Complete`로 옮기고 변경 파일, 검증 명령, 남은 리스크를 기록합니다.
6. 범위가 커지면 이 문서에서 바로 구현하지 말고 별도 문서로 분리합니다.

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

_현재 진행 중인 작업이 있으면 여기에 1개만 둡니다._

## Backlog

### T-002: 신규회원 학습량 완충

- Status: Backlog
- Priority: High
- Workstream: Onboarding Load
- Surface: UI, queue scheduling, per-user progress
- Pull readiness:
  - [ ] User value is clear: 신규회원이 첫 방문에서 과도한 카드 수에 압도되지 않고 작은 첫 세션을 완료할 수 있습니다.
  - [ ] Acceptance criteria are testable.
  - [ ] Required data/schema changes are identified.
  - [ ] Required live route/action checks are identified.
- Artifacts:
  - Brief: `docs/prd/backlog/new-member-learning-load/README.md`
  - PRD: TBD before moving to `Active`
  - Test spec: TBD before moving to `Active`
  - Implementation plan: TBD after PRD/test-spec
- Why: 신규 유입 사용자는 기존 누적 표현을 한 번에 마주치면 학습을 시작하기 어렵습니다.
- Scope:
  - 첫 학습 세션에서 노출할 카드 수 제한 또는 단계적 해금 정책을 정합니다.
  - 기존 사용자와 신규 사용자의 큐 경험 차이를 정의합니다.
  - `/memorize`에서 신규회원이 작은 단위로 시작하는지 확인합니다.
- Non-goals:
  - 전체 온보딩 튜토리얼 구축
  - 랭킹, streak, 결제, 관리자 UI
  - 푸쉬 알림 구현
- Acceptance criteria:
  - [ ] 신규/진행 이력이 적은 사용자는 첫 세션에서 제한된 수의 카드만 받습니다.
  - [ ] 기존 사용자의 due queue가 의도치 않게 줄어들지 않습니다.
  - [ ] 제한 정책이 코드와 문서에 같은 의미로 기록됩니다.
- Verification:
  - [ ] 큐 생성 로직 테스트
  - [ ] `npm run lint`
  - [ ] `npm run typecheck`
  - [ ] `/memorize` live route smoke check
- Notes / links:
  - 망각곡선 알고리즘 변경 전에 먼저 정책을 정하면 SRS 큐 기준이 단순해집니다.

### T-003: 에빙하우스 망각곡선 기반 복습 알고리즘 적용

- Status: Backlog
- Priority: High
- Workstream: Retention Algorithm
- Surface: scheduling logic, persistence, tests, possibly schema
- Pull readiness:
  - [ ] User value is clear: 사용자가 잊어버리기 쉬운 시점에 더 자연스럽게 복습합니다.
  - [ ] Acceptance criteria are testable.
  - [ ] Required data/schema changes are identified.
  - [ ] Required live route/action checks are identified.
- Artifacts:
  - PRD: `docs/prd/backlog/spaced-repetition-interval-policy/prd.md`
  - Test spec: extend `docs/prd/complete/daily-expression-memorization/test-spec.md` or create a focused test spec before active work
  - Implementation plan: TBD before moving to `Active`
- Why: 현재 단순 간격 정책보다 기억 유지 목적에 맞는 복습 타이밍을 제공하기 위해서입니다.
- Scope:
  - 현재 Anki-lite 성공 간격 정책을 검토하고 새 interval 정책을 정의합니다.
  - `외웠음` / `모름` 결과가 다음 복습일과 우선순위에 어떻게 반영되는지 정합니다.
  - 기존 사용자 progress 데이터와 호환되는 전환 방식을 정합니다.
- Non-goals:
  - 완전한 SM-2 구현
  - 머신러닝 개인화
  - 푸쉬 알림 발송
- Acceptance criteria:
  - [ ] 새 복습 간격 정책이 문서화됩니다.
  - [ ] `외웠음`은 다음 복습일을 망각곡선 정책에 맞게 뒤로 미룹니다.
  - [ ] `모름`은 즉시/근시일 복습 대상으로 남고 우선순위가 올라갑니다.
  - [ ] 기존 progress 데이터가 깨지지 않습니다.
- Verification:
  - [ ] scheduler/priority 단위 테스트
  - [ ] memoization queue 테스트
  - [ ] `npm run lint`
  - [ ] `npm run typecheck`
  - [ ] `/memorize` live route smoke check
- Notes / links:
  - 관련 기존 문서: `docs/prd/backlog/spaced-repetition-interval-policy/prd.md`
  - 신규회원 완충 정책과 큐 우선순위가 충돌하지 않게 같이 검토해야 합니다.

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
  - T-003 SRS 문서가 `pull-ready backlog` 상태이고 tracker가 최종 상태 기준임을 명시했습니다.
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
  - `docs/prd/backlog/spaced-repetition-interval-policy/prd.md`
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
  - `docs/prd/backlog/spaced-repetition-interval-policy/prd.md`
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
  - `docs/prd/backlog/spaced-repetition-interval-policy/prd.md`
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
  - `docs/prd/backlog/spaced-repetition-interval-policy/prd.md`
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
