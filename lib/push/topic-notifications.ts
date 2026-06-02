import type { SupabaseClient } from "@supabase/supabase-js";

import { MissingWebPushEnvError, getWebPushEnv } from "@/lib/env";
import type {
  BrowserPushSubscriptionInput,
  PushSubscriptionRow,
  TopicNotificationEligibility,
  TopicNotificationSendRow
} from "@/lib/push/types";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import type { ContentFolderSummary, UserIdentity } from "@/lib/types";

export const RESTRICTED_NOTIFICATION_FOLDER_SLUGS = new Set(["language-exchange"]);

type TopicRow = {
  id: string;
  owner_id: string;
  title: string;
  created_by: "llm" | "user";
  folder_id: string | null;
};

type FolderRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  path_ids: string[] | null;
  path_names: string[] | null;
};

type CardRow = {
  id: string;
  owner_id: string;
  english: string;
  source_order: number;
};

function normalizeFolder(row: FolderRow | null): ContentFolderSummary | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parent_id: row.parent_id,
    path_names: row.path_names ?? []
  };
}

function topicTargetUrl(topicId: string) {
  return `/expressions?topic=${encodeURIComponent(topicId)}`;
}

export function buildTopicNotificationCopy(topicTitle: string, cardCount: number) {
  return {
    title: "새 표현 묶음이 추가됐어요",
    body: `${topicTitle}에 새 표현 ${cardCount}개가 준비됐어요.`
  };
}

export function buildLanguageExchangeNotificationCopy(topicTitle: string, cardCount: number) {
  return {
    title: "새 언어교환 표현이 추가됐어요",
    body: `${topicTitle}에 새 표현 ${cardCount}개가 추가됐어요.`
  };
}

export function evaluateTopicNotificationEligibility(input: {
  topic: TopicRow & { folder?: ContentFolderSummary | null };
  folderReadableByAll: boolean;
  cards: CardRow[];
}): TopicNotificationEligibility {
  const { topic, folderReadableByAll, cards } = input;

  if (topic.created_by !== "llm") {
    return { eligible: false, reason: "Only LLM/shared topics can be notified." };
  }

  if (!folderReadableByAll) {
    return { eligible: false, reason: "Topic folder is not readable by all authenticated users." };
  }

  if (topic.folder?.slug && RESTRICTED_NOTIFICATION_FOLDER_SLUGS.has(topic.folder.slug)) {
    return { eligible: false, reason: "Restricted topic folders cannot be notified." };
  }

  const publicCards = cards.filter((card) => card.owner_id === topic.owner_id);
  if (publicCards.length === 0) {
    return { eligible: false, reason: "Topic has no public cards to notify." };
  }

  const copy = buildTopicNotificationCopy(topic.title, publicCards.length);
  return {
    eligible: true,
    topic,
    publicCards,
    title: copy.title,
    body: copy.body,
    targetUrl: topicTargetUrl(topic.id)
  };
}

async function isFolderReadableByAll(supabase: SupabaseClient, folder: FolderRow | null) {
  if (!folder) return false;
  const { data: group, error: groupError } = await supabase
    .from("content_groups")
    .select("id")
    .eq("slug", "all_authenticated")
    .maybeSingle();
  if (groupError) throw groupError;
  if (!group?.id) return false;

  const readableFolderIds = folder.path_ids?.length ? folder.path_ids : [folder.id];
  const { data: permissions, error: permissionError } = await supabase
    .from("content_folder_permissions")
    .select("folder_id")
    .eq("permission", "read")
    .eq("group_id", group.id)
    .in("folder_id", readableFolderIds);

  if (permissionError) throw permissionError;
  return Boolean(permissions?.length);
}

export async function getTopicNotificationEligibility(topicId: string, supabase: SupabaseClient = createServiceRoleSupabaseClient()) {
  const { data: topic, error: topicError } = await supabase
    .from("expression_days")
    .select("id,owner_id,title,created_by,folder_id")
    .eq("id", topicId)
    .maybeSingle();
  if (topicError) throw topicError;
  if (!topic) return { eligible: false, reason: "Topic not found." } satisfies TopicNotificationEligibility;

  let folder: FolderRow | null = null;
  if (topic.folder_id) {
    const { data: folderRow, error: folderError } = await supabase
      .from("content_folders")
      .select("id,name,slug,parent_id,path_ids,path_names")
      .eq("id", topic.folder_id)
      .maybeSingle();
    if (folderError) throw folderError;
    folder = folderRow as FolderRow | null;
  }

  const { data: cards, error: cardsError } = await supabase
    .from("expressions")
    .select("id,owner_id,english,source_order")
    .eq("expression_day_id", topic.id)
    .order("source_order", { ascending: true });
  if (cardsError) throw cardsError;

  return evaluateTopicNotificationEligibility({
    topic: { ...(topic as TopicRow), folder: normalizeFolder(folder) },
    folderReadableByAll: await isFolderReadableByAll(supabase, folder),
    cards: (cards ?? []) as CardRow[]
  });
}

export async function createTopicNotificationSend(
  topicId: string,
  requestedBy: Pick<UserIdentity, "id">,
  supabase: SupabaseClient = createServiceRoleSupabaseClient()
) {
  const eligibility = await getTopicNotificationEligibility(topicId, supabase);
  if (!eligibility.eligible) {
    return { ok: false as const, reason: eligibility.reason };
  }

  const { data: send, error: sendError } = await supabase
    .from("topic_notification_sends")
    .insert({
      expression_day_id: topicId,
      requested_by: requestedBy.id,
      title: eligibility.title,
      body: eligibility.body,
      target_url: eligibility.targetUrl,
      status: "pending",
      updated_at: new Date().toISOString()
    })
    .select("id,expression_day_id,requested_by,title,body,target_url,status")
    .single();
  if (sendError) throw sendError;

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("id,user_id")
    .eq("is_active", true);
  if (subscriptionsError) throw subscriptionsError;

  const deliveryRows = (subscriptions ?? []).map((subscription) => ({
    send_id: send.id,
    subscription_id: subscription.id,
    user_id: subscription.user_id,
    status: "pending",
    updated_at: new Date().toISOString()
  }));

  if (deliveryRows.length > 0) {
    const { error: deliveriesError } = await supabase
      .from("topic_notification_deliveries")
      .upsert(deliveryRows, { onConflict: "send_id,subscription_id" });
    if (deliveriesError) throw deliveriesError;
  }

  return { ok: true as const, send: send as TopicNotificationSendRow, queuedDeliveries: deliveryRows.length };
}

export async function createOwnerTopicNotificationSend(input: {
  topicId: string;
  ownerId: string;
  requestedBy: Pick<UserIdentity, "id">;
  title: string;
  body: string;
  targetUrl?: string;
  supabase?: SupabaseClient;
}) {
  const supabase = input.supabase ?? createServiceRoleSupabaseClient();
  const { data: send, error: sendError } = await supabase
    .from("topic_notification_sends")
    .insert({
      expression_day_id: input.topicId,
      requested_by: input.requestedBy.id,
      title: input.title,
      body: input.body,
      target_url: input.targetUrl ?? topicTargetUrl(input.topicId),
      status: "pending",
      updated_at: new Date().toISOString()
    })
    .select("id,expression_day_id,requested_by,title,body,target_url,status")
    .single();
  if (sendError) throw sendError;

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("id,user_id")
    .eq("user_id", input.ownerId)
    .eq("is_active", true);
  if (subscriptionsError) throw subscriptionsError;

  const deliveryRows = (subscriptions ?? []).map((subscription) => ({
    send_id: send.id,
    subscription_id: subscription.id,
    user_id: subscription.user_id,
    status: "pending",
    updated_at: new Date().toISOString()
  }));

  if (deliveryRows.length > 0) {
    const { error: deliveriesError } = await supabase
      .from("topic_notification_deliveries")
      .upsert(deliveryRows, { onConflict: "send_id,subscription_id" });
    if (deliveriesError) throw deliveriesError;
  }

  return { ok: true as const, send: send as TopicNotificationSendRow, queuedDeliveries: deliveryRows.length };
}

function toBrowserSubscription(subscription: PushSubscriptionRow): BrowserPushSubscriptionInput {
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expiration_time ? Date.parse(subscription.expiration_time) : null,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth
    }
  };
}

export type WebPushSender = (subscription: BrowserPushSubscriptionInput, payload: string) => Promise<void>;

export async function sendWebPush(subscription: BrowserPushSubscriptionInput, payload: string) {
  const webPush = (await import("web-push")).default;
  const env = getWebPushEnv();
  webPush.setVapidDetails(env.subject, env.publicKey, env.privateKey);
  await webPush.sendNotification(subscription, payload);
}

function isExpiredSubscriptionError(error: unknown) {
  const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number((error as { statusCode?: unknown }).statusCode) : null;
  return statusCode === 404 || statusCode === 410;
}

export async function drainTopicNotificationDeliveries(options: {
  sendId?: string;
  limit?: number;
  supabase?: SupabaseClient;
  sender?: WebPushSender;
} = {}) {
  const supabase = options.supabase ?? createServiceRoleSupabaseClient();
  const limit = options.limit ?? 25;
  const sender = options.sender ?? sendWebPush;

  let query = supabase
    .from("topic_notification_deliveries")
    .select("send_id,subscription_id,user_id,status,attempt_count,topic_notification_sends(id,title,body,target_url),push_subscriptions(id,user_id,endpoint,p256dh,auth,expiration_time,user_agent,is_active)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (options.sendId) query = query.eq("send_id", options.sendId);

  const { data: deliveries, error } = await query;
  if (error) throw error;
  if (!deliveries?.length) {
    if (options.sendId) await finalizeSendStatus(supabase, options.sendId);
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const delivery of deliveries) {
    const send = Array.isArray(delivery.topic_notification_sends) ? delivery.topic_notification_sends[0] : delivery.topic_notification_sends;
    const subscription = Array.isArray(delivery.push_subscriptions) ? delivery.push_subscriptions[0] : delivery.push_subscriptions;
    const attemptCount = Number(delivery.attempt_count ?? 0) + 1;

    if (!send || !subscription?.is_active) {
      failed += 1;
      await supabase
        .from("topic_notification_deliveries")
        .update({ status: "failed", attempt_count: attemptCount, last_error: "Missing or inactive subscription.", updated_at: new Date().toISOString() })
        .eq("send_id", delivery.send_id)
        .eq("subscription_id", delivery.subscription_id);
      continue;
    }

    const payload = JSON.stringify({
      title: send.title,
      body: send.body,
      url: send.target_url,
      tag: `topic-${send.id}`
    });

    try {
      await sender(toBrowserSubscription(subscription as PushSubscriptionRow), payload);
      sent += 1;
      await supabase
        .from("topic_notification_deliveries")
        .update({ status: "sent", attempt_count: attemptCount, sent_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() })
        .eq("send_id", delivery.send_id)
        .eq("subscription_id", delivery.subscription_id);
    } catch (sendError) {
      failed += 1;
      if (isExpiredSubscriptionError(sendError)) {
        await supabase
          .from("push_subscriptions")
          .update({ is_active: false, disabled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", delivery.subscription_id);
      }
      await supabase
        .from("topic_notification_deliveries")
        .update({
          status: "failed",
          attempt_count: attemptCount,
          last_error: sendError instanceof Error ? sendError.message : "Failed to send push notification.",
          updated_at: new Date().toISOString()
        })
        .eq("send_id", delivery.send_id)
        .eq("subscription_id", delivery.subscription_id);
    }
  }

  if (options.sendId) {
    await finalizeSendStatus(supabase, options.sendId);
  }

  return { processed: deliveries.length, sent, failed };
}

async function finalizeSendStatus(supabase: SupabaseClient, sendId: string) {
  const { data: remaining, error: remainingError } = await supabase
    .from("topic_notification_deliveries")
    .select("send_id")
    .eq("send_id", sendId)
    .eq("status", "pending")
    .limit(1);
  if (remainingError) throw remainingError;

  if (remaining?.length) return;

  const { error: updateError } = await supabase
    .from("topic_notification_sends")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", sendId);
  if (updateError) throw updateError;
}

export function isWebPushConfigured() {
  try {
    getWebPushEnv();
    return true;
  } catch (error) {
    if (error instanceof MissingWebPushEnvError) return false;
    throw error;
  }
}
