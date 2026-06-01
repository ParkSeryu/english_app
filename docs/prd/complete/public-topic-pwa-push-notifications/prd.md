# PRD: Public Topic PWA Push Notifications MVP

## Status

- Tracker item: `docs/prd/future-work.md`의 T-009.
- Lifecycle folder: `active`.
- Implementation direction: when an admin publishes a shared topic and explicitly sends an alert, subscribed PWA users receive one topic-level push notification.

## Problem

New shared learning topics can be added without learners noticing. A push notification should help opted-in learners discover newly published common cards, but it must not notify for private cards or send one alert per card.

## Goals

- Support mobile web/PWA push notifications for users who install the PWA and grant notification permission.
- Send notifications only after an explicit admin action for a shared topic.
- Send at most one notification per topic send event per subscribed user.
- Keep card/topic creation independent from push delivery so failed push sends do not roll back saved content.
- Exclude private user cards, private user topics, and restricted folders such as `language-exchange`.

## Non-goals

- Native iOS/Android app push notifications.
- Automatic notification on every card insert.
- Marketing, campaign, or arbitrary admin broadcast pushes.
- User-configurable notification schedules.
- Realtime chat-style notifications.
- Advanced batching across unrelated topics.
- Replacing the existing ingestion approval flow.

## Product Flow

1. Admin creates or updates a shared topic with multiple cards through the existing ingestion/approval path.
2. The topic appears in admin-visible content management with an `알림 전송` action.
3. Admin explicitly triggers notification sending for that topic.
4. The app records a notification job/outbox event and returns without waiting for all pushes to finish.
5. A worker, cron, or protected API drain sends the push notification to active PWA subscriptions.
6. Learners tap the notification and land on the topic or the learning surface for that topic.

## PWA Permission Flow

- Users must be authenticated before subscribing to push notifications.
- Users must install or open the app in a browser context that supports Web Push.
- iOS users must use a Home Screen web app on iOS/iPadOS 16.4 or later.
- The app provides an opt-in control for push notifications and stores the resulting subscription server-side.
- Users can disable notifications from the app, which removes or deactivates their push subscription.
- Browser or OS-level permission denial is treated as a supported state, not an error.

## Public Topic / Card Rule

Notification target topics must satisfy all of these conditions:

- `expression_days.created_by = "llm"`.
- The topic's content folder is readable by the `all_authenticated` group.
- Restricted folders such as `language-exchange` are excluded even when the current admin can read them.
- Notifying a topic includes only cards where `expressions.owner_id = expression_days.owner_id`.
- Cards personally added by a learner inside a shared topic are excluded.

## Delivery Model

- A topic send creates a durable notification outbox/job record.
- Push delivery is asynchronous and decoupled from topic/card persistence.
- Partial push failures do not roll back the topic, cards, or the send event.
- Each send event tracks delivery attempts and terminal failures per subscription or recipient.
- The system prevents duplicate delivery for the same topic send event and subscription.

## Data / Schema

Expected new persisted data:

- Push subscriptions keyed by authenticated user and browser subscription endpoint.
- Topic notification send events keyed by topic.
- Delivery attempts or recipient rows keyed by send event and subscription/user.

Schema/RLS requirements:

- Users can create, read, and delete only their own push subscriptions.
- Admin/server-side code can create topic send events for eligible public topics.
- Delivery workers use server credentials and must not expose VAPID/private push credentials to the browser.
- Dev and main Supabase projects require separate migration application and verification.

## UX Requirements

- Push opt-in UI is available from an authenticated user-visible location.
- Admin notification sending is a separate explicit action from saving a topic.
- The send action shows whether the topic is eligible for notification.
- Ineligible topics explain why sending is disabled, for example private topic, restricted folder, or no public cards.
- The notification title and body summarize the topic, not individual cards.
- Notification click opens the relevant topic route, for example `/expressions?topic=<topicId>`.

## Acceptance Criteria

- [ ] A logged-in PWA user can subscribe to push notifications from the app.
- [ ] A logged-in user can unsubscribe, and the app stops sending to that subscription.
- [ ] Admin can trigger one push send for an eligible shared topic.
- [ ] The topic send is asynchronous and does not block on all push delivery attempts.
- [ ] The system does not notify for private user topics.
- [ ] The system does not notify for learner-added private cards inside a shared topic.
- [ ] The system does not notify restricted folders such as `language-exchange`.
- [ ] The same topic send event is delivered at most once per active subscription.
- [ ] Invalid or expired subscriptions are marked inactive or removed after delivery failure.
- [ ] Notification click opens the topic or an appropriate learning route.

## Risks

- iOS Web Push requires Home Screen installation, so some mobile web users cannot subscribe until they install the PWA.
- Browser push subscription formats and expiration behavior vary by browser.
- Sending to many subscriptions from a serverless environment may need batching or a cron drain rather than a single request.
- Misclassifying restricted content as public would create a privacy issue, so the public topic rule must be tested against RLS and folder ACL behavior.

## Open Questions

- Where should the user-facing push opt-in control live first: home, settings, or profile?
- Where should the admin `알림 전송` action live first: ingestion approval result, topic detail, or a minimal admin route?
- Should the first notification copy include card count?
- Should users who joined after the topic was created receive a notification if the admin sends it later?
