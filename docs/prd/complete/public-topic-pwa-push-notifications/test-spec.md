# Test Spec: Public Topic PWA Push Notifications MVP

## Verification Scope

- Push subscription opt-in/out for authenticated PWA users.
- Public-topic eligibility rules for notification sends.
- Asynchronous topic-level delivery through an outbox/job path.
- Duplicate prevention for a topic send event.
- Live route/API smoke checks for the user subscription surface and admin send action.

## Acceptance Checks

| ID | Check | Method |
| --- | --- | --- |
| AC-001 | Authenticated user can create a push subscription for their own user id. | server action/API integration test |
| AC-002 | User can unsubscribe and the stored subscription is removed or marked inactive. | server action/API integration test |
| AC-003 | Anonymous users cannot create push subscriptions. | auth/security test |
| AC-004 | Admin can create a notification send event for an eligible shared topic. | use-case integration test |
| AC-005 | `created_by = "user"` topics are rejected as notification targets. | use-case integration test |
| AC-006 | Restricted folders such as `language-exchange` are rejected as notification targets. | use-case integration test |
| AC-007 | Learner-owned private cards inside a shared topic are excluded from notification eligibility. | use-case integration test |
| AC-008 | A topic send event creates at most one delivery row per active subscription. | database/use-case integration test |
| AC-009 | Re-running the delivery drain does not duplicate already-sent topic notifications. | worker/job integration test |
| AC-010 | Failed expired subscriptions are marked inactive or removed. | worker/job unit or integration test |
| AC-011 | Notification payload includes a topic URL such as `/expressions?topic=<topicId>`. | worker/job unit test |
| AC-012 | User subscription UI route renders in the running app. | live route smoke check |
| AC-013 | Admin send action route/API returns a route-appropriate success or rejection response in the running app. | live route/action smoke check |

## Required Commands

- `npm run lint`
- `npm run typecheck`
- Targeted subscription tests, for example `npm test -- tests/unit/push-subscriptions.test.ts`
- Targeted notification eligibility tests, for example `npm test -- tests/unit/public-topic-notifications.test.ts`
- Targeted delivery drain tests, for example `npm test -- tests/integration/push-delivery.test.ts`
- `npm run verify:rls` when schema/RLS policies are added or changed
- Running-app smoke checks for the affected subscription UI and admin send route/API

## Live Verification

Runtime-facing implementation must verify:

- Dev server runs with external bind: `npm run dev -- --hostname 0.0.0.0`.
- Local route/API check succeeds for the user subscription surface.
- Local route/API check succeeds for the admin topic notification send action.
- External-IP route/API check succeeds when the environment exposes one.
- Dev-server logs show no `InternalServerError`, missing chunk, schema, RLS, or server action failures for the affected paths.

## Schema/RLS Verification

When migrations are introduced:

- `npm run db:status:dev` shows the migration status before applying.
- `npm run db:migrate:dev` applies the migration to the dev Supabase project.
- Service-role/admin reads confirm push subscription and notification outbox tables exist.
- Authenticated-user smoke confirms users can manage only their own subscriptions.
- Cross-user RLS checks confirm one user cannot read or mutate another user's subscription.
- Before promotion to main, `npm run db:status:main` must be checked and production migration requires the explicit production confirmation path.

## Manual Device Checks

At least one manual device/browser check should be recorded before claiming production readiness:

- Android Chrome PWA install, subscribe, receive test notification, tap opens topic.
- iOS 16.4+ Home Screen PWA install, subscribe, receive test notification, tap opens topic.

If either platform is unavailable in the coding environment, final reporting must state the exact unverified platform and the remaining manual check.
