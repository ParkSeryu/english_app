import webPush, { type RequestOptions, type WebPushError } from "web-push";

import { getPushEnv } from "@/lib/push/env";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import type { UserIdentity } from "@/lib/types";
import type { PushSendSummary, PushSubscriptionRow } from "@/lib/push/types";
import {
  disablePushSubscriptionById,
  listEnabledPushSubscriptionsForCron,
  listEnabledPushSubscriptionsForUserByServiceRole,
  markPushSubscriptionError,
  markPushSubscriptionNotified
} from "@/lib/push/subscriptions";

type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

const KOREA_TIME_OFFSET_MS = 9 * 60 * 60 * 1000;

function koreaDateKey(date: Date) {
  return new Date(date.getTime() + KOREA_TIME_OFFSET_MS).toISOString().slice(0, 10);
}

export function wasNotifiedToday(lastNotifiedAt: string | null, now = new Date()) {
  if (!lastNotifiedAt) return false;
  const date = new Date(lastNotifiedAt);
  if (!Number.isFinite(date.getTime())) return false;
  return koreaDateKey(date) === koreaDateKey(now);
}

function toWebPushSubscription(subscription: PushSubscriptionRow) {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth
    }
  };
}

function isExpiredSubscriptionError(error: unknown) {
  const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number((error as WebPushError).statusCode) : 0;
  return statusCode === 404 || statusCode === 410;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function sendWebPushNotification(subscription: PushSubscriptionRow, payload: PushPayload) {
  const env = getPushEnv();
  webPush.setVapidDetails(env.subject, env.publicKey, env.privateKey);
  const options: RequestOptions = { TTL: 12 * 60 * 60 };
  await webPush.sendNotification(toWebPushSubscription(subscription), JSON.stringify(payload), options);
}

export async function sendTestPushNotificationForUser(user: UserIdentity): Promise<PushSendSummary> {
  const subscriptions = await listEnabledPushSubscriptionsForUserByServiceRole(user);
  const summary: PushSendSummary = { considered: subscriptions.length, sent: 0, skipped: 0, disabled: 0, failed: 0 };
  if (subscriptions.length === 0) return summary;

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await sendWebPushNotification(subscription, {
        title: "영어공부 알림 테스트",
        body: "복습 알림이 이렇게 도착합니다.",
        url: "/memorize",
        tag: "english-review-test"
      });
      await markPushSubscriptionNotified(subscription.id, new Date());
      summary.sent += 1;
    } catch (error) {
      if (isExpiredSubscriptionError(error)) {
        await disablePushSubscriptionById(subscription.id, errorMessage(error));
        summary.disabled += 1;
        return;
      }
      await markPushSubscriptionError(subscription.id, errorMessage(error));
      summary.failed += 1;
    }
  }));

  return summary;
}

async function usersWithDueProgress(userIds: string[], now: Date) {
  if (userIds.length === 0) return new Set<string>();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("expression_progress")
    .select("user_id")
    .in("user_id", userIds)
    .eq("is_memorization_enabled", true)
    .or(`due_at.is.null,due_at.lte.${now.toISOString()}`);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((row) => String((row as { user_id: string }).user_id)));
}

export async function sendDueReviewReminders(now = new Date()): Promise<PushSendSummary> {
  const subscriptions = await listEnabledPushSubscriptionsForCron();
  const userIds = [...new Set(subscriptions.map((subscription) => subscription.user_id))];
  const dueUserIds = await usersWithDueProgress(userIds, now);
  const summary: PushSendSummary = { considered: subscriptions.length, sent: 0, skipped: 0, disabled: 0, failed: 0 };

  for (const subscription of subscriptions) {
    if (!dueUserIds.has(subscription.user_id) || wasNotifiedToday(subscription.last_notified_at, now)) {
      summary.skipped += 1;
      continue;
    }

    try {
      await sendWebPushNotification(subscription, {
        title: "오늘 복습할 표현이 있어요",
        body: "짧게 다시 보고 기억을 붙잡아 볼까요?",
        url: "/memorize",
        tag: "english-review-due"
      });
      await markPushSubscriptionNotified(subscription.id, now);
      summary.sent += 1;
    } catch (error) {
      if (isExpiredSubscriptionError(error)) {
        await disablePushSubscriptionById(subscription.id, errorMessage(error));
        summary.disabled += 1;
        continue;
      }
      await markPushSubscriptionError(subscription.id, errorMessage(error));
      summary.failed += 1;
    }
  }

  return summary;
}
