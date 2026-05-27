# Implementation Plan: 복습 웹 푸쉬 알림

## 1. 문서/트래커

- T-004를 `Active`로 이동합니다.
- PRD/test-spec/implementation-plan을 active feature folder에 추가합니다.

## 2. Schema

- `push_subscriptions` migration 추가
- RLS/grants 추가
- dev migration 적용 및 status 확인

## 3. Server

- VAPID env helper 추가
- push subscription save/disable/list helpers 추가
- web-push send helper 추가
- current-user server actions 추가
- cron route 추가

## 4. Client

- service worker에 `push`/`notificationclick` 이벤트 추가
- 홈 화면 `PushNotificationSettings` 카드 추가
- iOS 홈 화면 안내 및 지원 불가/권한 거부 상태 처리

## 5. Verification

- targeted tests
- lint/typecheck/full tests
- migration status/RLS verification
- build
- live route smoke
- push branch/PR or dev handoff after verification
