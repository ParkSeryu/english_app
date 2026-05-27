# Test Spec: 복습 웹 푸쉬 알림

## 범위

- Push subscription 저장/비활성화
- 알림 권한/지원 상태 UI
- service worker push/click 처리
- 테스트 알림 발송 use case
- cron due reminder 발송 필터링
- schema/RLS migration 검증

## 단위/컴포넌트 테스트

- `PushNotificationSettings`
  - VAPID public key가 없으면 설정 필요 안내를 표시합니다.
  - Push API 미지원이면 지원 불가 안내를 표시합니다.
  - 권한 거부 상태면 브라우저 설정 안내를 표시합니다.
  - 구독 성공 시 server action에 subscription JSON을 전달합니다.
  - 알림 끄기 시 브라우저 unsubscribe와 server action을 호출합니다.
- push use cases
  - subscription payload를 저장 가능한 형태로 검증합니다.
  - due progress가 없는 subscription에는 자동 알림을 보내지 않습니다.
  - `last_notified_at`이 오늘이면 자동 알림을 건너뜁니다.
  - 404/410 Web Push 응답은 subscription을 비활성화합니다.
- cron route
  - `CRON_SECRET`이 없거나 틀리면 401을 반환합니다.
  - 올바른 secret이면 send use case를 호출합니다.

## 통합/보안 테스트

- migration은 `push_subscriptions` 테이블, unique index, RLS policy, grants를 생성합니다.
- `npm run verify:rls`로 기존 RLS smoke가 깨지지 않아야 합니다.
- `npm run db:status:dev`에서 pending/mismatch 상태를 확인합니다.

## Live route smoke

- dev server를 `0.0.0.0`에 바인딩합니다.
- `/` 홈 route가 200을 반환하고 알림 카드가 렌더링되는지 확인합니다.
- `/memorize` route가 기존 SRS 흐름을 유지하는지 확인합니다.

## 수동 기기 확인

- Android/Chrome 또는 desktop Chrome에서 알림 켜기 → 테스트 보내기 → 알림 클릭 시 `/memorize` 열림을 확인합니다.
- iPhone은 홈 화면에 추가한 웹앱에서만 확인합니다.
