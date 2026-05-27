# PRD: 복습 웹 푸쉬 알림

## 상태

- 트래커 항목: `docs/prd/future-work.md`의 T-004.
- 생명주기 폴더: `active`; 구현 브랜치에서 MVP를 진행합니다.
- 기준 문서: `docs/prd/complete/spaced-repetition-interval-policy/prd.md`.
- 테스트 스펙: `docs/prd/active/push-notifications/test-spec.md`.
- 구현 계획: `docs/prd/active/push-notifications/implementation-plan.md`.

## 문제

SRS는 정해진 날짜에 다시 떠올릴 때 효과가 있지만, 사용자가 앱을 열지 않으면 due 카드를 놓칩니다. 사용자가 명시적으로 동의한 경우에만 브라우저 푸쉬 알림으로 “오늘 복습할 표현이 있음”을 알려야 합니다.

## 목표

- 로그인 사용자가 직접 `복습 알림 켜기`를 눌러 권한을 허용하고 push subscription을 저장합니다.
- 사용자가 알림을 끄면 저장된 subscription을 비활성화합니다.
- 테스트 알림을 보내 실제 기기/브라우저에서 푸쉬 경로를 확인할 수 있습니다.
- 하루 한 번 cron이 due 복습이 있는 구독자에게 `/memorize`로 돌아오도록 알림을 보냅니다.
- iOS/iPadOS 사용자는 홈 화면에 추가한 웹앱에서 알림을 켜야 한다는 안내를 봅니다.
- schema 변경은 `supabase/migrations/*.sql`과 migration ledger로 관리합니다.

## 비목표

- 네이티브 iOS/Android 앱 푸쉬 구현
- 이메일/SMS/카카오 알림톡
- 사용자별 알림 시간대 설정
- 여러 알림 캠페인/마케팅 자동화
- 완전한 전달률 분석 대시보드

## 사용자 경험

1. 로그인한 홈 화면에 `복습 알림` 카드가 보입니다.
2. 브라우저가 Push API를 지원하지 않으면 이유와 iPhone 홈 화면 안내를 보여줍니다.
3. 사용자가 `복습 알림 켜기`를 누르면 브라우저 권한 요청이 뜹니다.
4. 권한이 허용되면 push subscription을 서버에 저장하고 상태를 `켜짐`으로 표시합니다.
5. `테스트 보내기`를 누르면 현재 사용자에게 테스트 알림을 보냅니다.
6. `알림 끄기`를 누르면 브라우저 subscription을 해지하고 서버 subscription을 비활성화합니다.
7. 알림을 클릭하면 `/memorize`가 열립니다.

## 정책

- 알림은 명시적 사용자 제스처 후에만 요청합니다.
- `Notification.permission = denied`이면 다시 요청하지 않고 브라우저 설정에서 허용해야 한다고 안내합니다.
- `push_subscriptions.endpoint`는 사용자별로 unique 처리합니다.
- 만료되거나 실패한 subscription은 비활성화합니다.
- 자동 리마인더는 subscription별 하루 1회로 제한합니다.
- MVP 알림 문구는 “오늘 복습할 표현이 있어요”로 고정합니다.

## 데이터 모델

새 테이블 `public.push_subscriptions`를 추가합니다.

- `id uuid primary key`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `endpoint text not null`
- `p256dh text not null`
- `auth text not null`
- `user_agent text null`
- `enabled boolean not null default true`
- `disabled_at timestamptz null`
- `last_notified_at timestamptz null`
- `last_error text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

RLS는 로그인 사용자가 자신의 subscription만 조회/저장/수정/삭제할 수 있게 제한합니다. 서버 cron은 service role로 due 알림을 발송합니다.

## 환경 변수

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: 브라우저 subscription 생성용 VAPID public key
- `VAPID_PRIVATE_KEY`: 서버 push 발송용 VAPID private key
- `VAPID_SUBJECT`: VAPID subject. 없으면 `mailto:admin@example.com` 기본값을 사용합니다.
- `CRON_SECRET`: Vercel cron route 보호용 shared secret

## 수용 기준

- 홈 화면에서 로그인 사용자는 복습 알림 카드와 상태를 볼 수 있습니다.
- 지원 브라우저에서 사용자가 알림을 켜면 `push_subscriptions`에 enabled row가 저장됩니다.
- 알림 끄기는 브라우저 subscription 해지와 서버 비활성화를 수행합니다.
- 테스트 알림 API가 현재 사용자에게 web push를 전송합니다.
- service worker는 `push` 이벤트에서 notification을 표시하고, 클릭 시 `/memorize`를 엽니다.
- cron route는 `CRON_SECRET` 없이는 실행되지 않습니다.
- cron route는 due progress가 있는 enabled subscription에만 하루 1회 알림을 보냅니다.
- 만료된 subscription은 비활성화됩니다.
- `npm run lint`, `npm run typecheck`, 관련 tests, build, live route smoke가 통과합니다.

## 리스크

- iOS/iPadOS는 홈 화면에 추가한 웹앱에서만 Web Push가 안정적으로 동작합니다.
- Vercel 환경 변수에 VAPID/CRON 값이 없으면 UI는 설정 필요 상태가 됩니다.
- 브라우저/OS가 푸쉬 전달을 지연하거나 차단할 수 있습니다.
