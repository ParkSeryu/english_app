# Test Spec: 신규회원 가입 이후 토픽 노출 정책

## 검증 범위

- Auth context가 Supabase user `created_at`을 `UserIdentity.createdAt`으로 전달합니다.
- Memory/Supabase expression store가 같은 토픽 노출 정책을 사용합니다.
- `/memorize` live route가 깨지지 않고 큐/empty state를 렌더링합니다.

## Acceptance Checks

| ID | Check | Method |
| --- | --- | --- |
| AC-001 | 가입 이전 shared 토픽은 신규 사용자에게 숨겨집니다. | memory store integration test |
| AC-002 | 가입 이후 shared 토픽은 신규 사용자에게 보입니다. | memory store integration test |
| AC-003 | 숨겨진 토픽의 표현은 memorize queue와 expression detail lookup에서 제외됩니다. | memory store integration test |
| AC-004 | 홈 통계 total/due count는 노출 가능한 토픽만 반영합니다. | memory store integration test |
| AC-005 | 가입 시각이 없는 user context는 기존 readable 토픽 동작을 유지합니다. | existing integration/e2e coverage |
| AC-006 | `/memorize` route가 실행 중인 앱에서 200/redirect-safe 상태로 응답합니다. | live route smoke check |

## Required Commands

- `npm run lint`
- `npm run typecheck`
- `npm test -- tests/integration/memory-expression-store.test.ts`
- `/memorize` live route smoke check with dev server bound to `0.0.0.0`

## Schema/RLS

- 새 schema/RLS 변경 없음.
- hosted DB 변경 없음.
