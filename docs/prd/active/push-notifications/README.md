# Push Notifications

## Status

- Tracker item: T-004 in `docs/prd/future-work.md`.
- Lifecycle folder: `active`.
- Artifact state: MVP implementation branch for opt-in web push review reminders.

## Why

복습 앱은 사용자가 돌아오는 타이밍이 중요하므로, due 상태를 앱 밖에서 알려줄 방법이 필요합니다.

## First Slice Direction

웹 푸쉬 가능 범위, 권한 요청 UX, push subscription 저장/해지, due 알림 스케줄링 방식을 최소 MVP로 구현합니다.

## Initial Verification Shape

- permission UI 테스트
- push subscription 저장/삭제 테스트
- scheduled send 또는 manual send smoke check
- affected route live check
